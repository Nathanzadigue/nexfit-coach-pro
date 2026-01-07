import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

/* ---------- TYPES ---------- */

type Booking = {
  id: string;
  sport: string;
  coachingMode: string;
  price: string;
  date: string;
  time: string;
  sortableDate?: string;
  sortableTime?: string;
  duration?: number;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "paid";
  coachId: string;
  coachName?: string;
  coachEmail?: string;
  serviceId: string;
  createdAt: any;
};

/* ---------- SCREEN ---------- */

export default function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "paid" | "cancelled">("all");

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  /* ---------- FETCH BOOKINGS ---------- */

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("clientId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(bookingsQuery);
      const bookingsList: Booking[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Get coach information
        let coachName = "Coach";
        let coachEmail = "";
        
        try {
          const coachDoc = await getDocs(
            query(collection(db, "users"), where("uid", "==", data.coachId))
          );
          if (!coachDoc.empty) {
            const coachData = coachDoc.docs[0].data();
            coachName = `${coachData.firstName || ""} ${coachData.lastName || ""}`.trim() || "Coach";
            coachEmail = coachData.email || "";
          }
        } catch (error) {
          console.error("Error fetching coach info:", error);
        }

        bookingsList.push({
          id: docSnap.id,
          sport: data.sport || "Sport",
          coachingMode: data.coachingMode || "no-preference",
          price: data.price || "0",
          date: data.date || data.sortableDate || "To be scheduled",
          time: data.time || data.sortableTime || "To be scheduled",
          sortableDate: data.sortableDate,
          sortableTime: data.sortableTime,
          duration: data.duration || 60,
          status: data.status || "pending",
          coachId: data.coachId,
          coachName,
          coachEmail,
          serviceId: data.serviceId,
          createdAt: data.createdAt,
        });
      }

      setBookings(bookingsList);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  /* ---------- FILTER BOOKINGS ---------- */

  const filteredBookings = bookings.filter(booking => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  /* ---------- CANCEL BOOKING ---------- */

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Cancel booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "bookings", bookingId), {
                status: "cancelled",
                updatedAt: serverTimestamp(),
                cancelledAt: serverTimestamp(),
              });

              // Refresh list
              fetchBookings();

              Alert.alert(
                "✅ Booking cancelled",
                "Your booking has been successfully cancelled."
              );
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Alert.alert("Error", "Unable to cancel booking");
            }
          },
        },
      ]
    );
  };

  /* ---------- FORMAT DATE ---------- */

  const formatDate = (dateStr: string) => {
    if (dateStr === "To be scheduled") return "To be scheduled";
    
    try {
      const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const isEnglishDate = englishMonths.some(month => dateStr.toLowerCase().includes(month.toLowerCase()));
      
      if (isEnglishDate) {
        return dateStr;
      }
      
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
      }
      
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (timeStr === "To be scheduled") return "To be scheduled";
    
    try {
      if (timeStr.includes(':') && timeStr.split(':').length >= 2) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes}`;
      }
      
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  /* ---------- GET STATUS INFO ---------- */

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "#FB8C00", text: "Pending", icon: "time-outline" };
      case "confirmed":
        return { color: "#2E7D32", text: "Confirmed", icon: "checkmark-circle-outline" };
      case "paid":
        return { color: "#007AFF", text: "Paid", icon: "card-outline" };
      case "declined":
        return { color: "#C62828", text: "Declined", icon: "close-circle-outline" };
      case "cancelled":
        return { color: "#757575", text: "Cancelled", icon: "remove-circle-outline" };
      default:
        return { color: "#000", text: status, icon: "help-circle-outline" };
    }
  };

  /* ---------- RENDER FILTERS ---------- */

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "confirmed", label: "Confirmed" },
          { key: "paid", label: "Paid" },
          { key: "cancelled", label: "Cancelled" },
        ].map((item) => (
          <Pressable
            key={item.key}
            style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
            onPress={() => setFilter(item.key as any)}
          >
            <Text style={[styles.filterButtonText, filter === item.key && styles.filterButtonTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  /* ---------- RENDER BOOKING ITEM ---------- */

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          if (item.status === "confirmed") {
            // Redirect to payment
            router.push({
              pathname: "/(client)/payment",
              params: {
                bookingId: item.id,
                amount: item.price,
                serviceName: item.sport,
                serviceId: item.serviceId,
                date: item.date,
                time: item.time,
              },
            });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.sport}>{item.sport}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.coachInfo}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.coachText}>{item.coachName}</Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{formatDate(item.date)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{formatTime(item.time)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="timer-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.duration || 60} min</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.price} €</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {item.status === "pending" && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item.id)}
            >
              <Ionicons name="close-circle" size={16} color="#FF3B30" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
          
          {item.status === "confirmed" && (
            <Pressable
              style={styles.payButton}
              onPress={() => {
                router.push({
                  pathname: "/(client)/payment",
                  params: {
                    bookingId: item.id,
                    amount: item.price,
                    serviceName: item.sport,
                    serviceId: item.serviceId,
                    date: item.date,
                    time: item.time,
                  },
                });
              }}
            >
              <Ionicons name="card" size={16} color="#FFF" />
              <Text style={styles.payButtonText}>Pay now</Text>
            </Pressable>
          )}
          
          {item.status === "paid" && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.paidText}>Paid</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My bookings</Text>
          <Text style={styles.subtitle}>
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {renderFilters()}

        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>
                {filter === "all" ? "No bookings" : `No ${filter} bookings`}
              </Text>
              <Text style={styles.emptyText}>
                {filter === "all" 
                  ? "Start by booking a session with a coach!"
                  : "No bookings match this filter."}
              </Text>
              {filter !== "all" && (
                <Pressable
                  style={styles.allBookingsButton}
                  onPress={() => setFilter("all")}
                >
                  <Text style={styles.allBookingsText}>View all bookings</Text>
                </Pressable>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    backgroundColor: '#666',
    zIndex: 1000,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, // Seulement sur les côtés
    marginTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  filterButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sport: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  coachInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  coachText: {
    fontSize: 14,
    color: "#666",
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: "#000",
  },
  actions: {
    marginTop: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  payButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  paidText: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  allBookingsButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#000",
    borderRadius: 12,
  },
  allBookingsText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
});
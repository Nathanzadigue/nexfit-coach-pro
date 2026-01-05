import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons";

/* ---------- TYPES ---------- */

type Booking = {
  id: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  sport: string;
  coachingMode: string;
  price: string;
  duration?: number;
  clientName?: string;
  clientEmail?: string;
  scheduledDateTime?: any;
};

/* ---------- SCREEN ---------- */

export default function PlanningScreen() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Récupérer TOUTES les réservations du coach, triées par date puis par heure
      const q = query(
        collection(db, "bookings"),
        where("coachId", "==", user.uid),
        orderBy("date", "desc"),
        orderBy("time", "asc")
      );

      const snap = await getDocs(q);

      const bookingsList: Booking[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        bookingsList.push({
          id: docSnap.id,
          date: data.date,
          time: data.time,
          status: data.status,
          sport: data.sport || "Sport",
          coachingMode: data.coachingMode || "no-preference",
          price: data.price || "0",
          duration: data.duration || 60,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          scheduledDateTime: data.scheduledDateTime,
        });
      });

      setBookings(bookingsList);
    } catch (error: any) {
      console.error("Error loading planning:", error);
      // Si erreur d'index, essayer sans orderBy
      if (error.code === 'failed-precondition') {
        try {
          const q = query(
            collection(db, "bookings"),
            where("coachId", "==", user.uid)
          );
          const snap = await getDocs(q);
          const bookingsList: Booking[] = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              date: data.date,
              time: data.time,
              status: data.status,
              sport: data.sport || "Sport",
              coachingMode: data.coachingMode || "no-preference",
              price: data.price || "0",
              duration: data.duration || 60,
              clientName: data.clientName,
              clientEmail: data.clientEmail,
              scheduledDateTime: data.scheduledDateTime,
            };
          });
          // Trier manuellement par date (plus récent en premier) puis par heure
          bookingsList.sort((a, b) => {
            if (a.date !== b.date) {
              return b.date.localeCompare(a.date); // Date décroissante
            }
            return a.time.localeCompare(b.time); // Heure croissante
          });
          setBookings(bookingsList);
        } catch (err) {
          console.error("Error loading bookings without order:", err);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const updateStatus = async (
    bookingId: string,
    status: "confirmed" | "declined" | "cancelled"
  ) => {
    Alert.alert(
      status === "confirmed" ? "Confirm Booking" : 
      status === "declined" ? "Decline Booking" : "Cancel Booking",
      `Are you sure you want to ${status} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "confirmed" ? "Accept" : 
                status === "declined" ? "Decline" : "Cancel",
          style: status === "confirmed" ? "default" : "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "bookings", bookingId), { 
                status,
                updatedAt: new Date()
              });

              setBookings((prev) =>
                prev.map((b) =>
                  b.id === bookingId ? { ...b, status } : b
                )
              );

              Alert.alert(
                "Success",
                status === "confirmed" 
                  ? "Booking confirmed successfully!" 
                  : status === "declined"
                  ? "Booking declined."
                  : "Booking cancelled."
              );
            } catch (error) {
              console.error("Error updating booking:", error);
              Alert.alert("Error", "Failed to update booking");
            }
          },
        },
      ]
    );
  };

  const formatDateForDisplay = (dateStr: string) => {
    try {
      if (dateStr.includes('/')) {
        const [year, month, day] = dateStr.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getDurationText = (minutes?: number) => {
    if (!minutes) return "60 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#FB8C00";
      case "confirmed": return "#2E7D32";
      case "declined": return "#C62828";
      case "cancelled": return "#757575";
      default: return "#000";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Grouper les réservations par date
  const groupedBookings = bookings.reduce((groups, booking) => {
    const date = booking.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(booking);
    return groups;
  }, {} as Record<string, Booking[]>);

  // Convertir en tableau pour FlatList
  const sections = Object.entries(groupedBookings).map(([date, bookings]) => ({
    date,
    bookings,
  }));

  const renderSection = ({ item }: { item: { date: string, bookings: Booking[] } }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar-outline" size={18} color="#000" />
        <Text style={styles.sectionTitle}>
          {formatDateForDisplay(item.date)}
        </Text>
        <Text style={styles.sectionCount}>
          {item.bookings.length} session{item.bookings.length > 1 ? 's' : ''}
        </Text>
      </View>
      
      {item.bookings.map((booking) => (
        <View key={booking.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.time}>{booking.time}</Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20', borderColor: getStatusColor(booking.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.sport}>{booking.sport}</Text>
          
          <View style={styles.clientInfo}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.clientText}>
              {booking.clientName || booking.clientEmail || "Client"}
            </Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="timer-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{getDurationText(booking.duration)}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{booking.price} €</Text>
              </View>
            </View>
            
            <View style={styles.modeRow}>
              <Text style={styles.modeText}>
                {booking.coachingMode === "remote" && "Remote"}
                {booking.coachingMode === "in-person" && "In Person"}
                {booking.coachingMode === "no-preference" && "No Preference"}
              </Text>
            </View>
          </View>

          {booking.status === "pending" && (
            <View style={styles.actions}>
              <Pressable
                style={styles.declineButton}
                onPress={() => updateStatus(booking.id, "declined")}
              >
                <Ionicons name="close-circle" size={18} color="#FF3B30" />
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>

              <Pressable
                style={styles.acceptButton}
                onPress={() => updateStatus(booking.id, "confirmed")}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </Pressable>
            </View>
          )}

          {booking.status === "confirmed" && (
            <View style={styles.actions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => updateStatus(booking.id, "cancelled")}
              >
                <Ionicons name="close-circle" size={18} color="#FF3B30" />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Planning</Text>
        <Text style={styles.subtitle}>
          {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.date}
        renderItem={renderSection}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              When clients book your services, they'll appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#F5F5F5" 
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  list: { 
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  time: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sport: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  clientText: {
    fontSize: 14,
    color: "#666",
  },
  details: {
    marginBottom: 16,
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
  },
  detailText: {
    fontSize: 14,
    color: "#000",
  },
  modeRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modeText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  declineButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  acceptButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
});

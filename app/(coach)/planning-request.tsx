import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- TYPES ---------- */

type Booking = {
  id: string;
  clientId: string;
  coachId: string;
  serviceId: string;
  sport: string;
  coachingMode: string;
  price: string;
  date: string;
  time: string;
  sortableDate?: string;
  sortableTime?: string;
  duration?: number;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "paid";
  clientEmail?: string;
  clientName?: string;
  clientFirstName?: string;
  clientLastName?: string;
};

/* ---------- SCREEN ---------- */

export default function PlanningScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#666');
    }
    
    return () => {
      StatusBar.setBarStyle('default');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
      }
    };
  }, []);

  /* ---------- FETCH PENDING BOOKINGS ---------- */

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // Fetch ALL bookings
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const bookingsList: Booking[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Filter: only those for this coach AND with "pending" status
        if (data.coachId === user.uid && data.status === "pending") {
          bookingsList.push({
            id: docSnap.id,
            clientId: data.clientId,
            coachId: data.coachId,
            serviceId: data.serviceId,
            sport: data.sport || "Sport",
            coachingMode: data.coachingMode || "no-preference",
            price: data.price || "0",
            date: data.date || data.sortableDate || "Date to be determined",
            time: data.time || data.sortableTime || "Time to be determined",
            sortableDate: data.sortableDate,
            sortableTime: data.sortableTime,
            duration: data.duration || 60,
            status: data.status || "pending",
            clientEmail: data.clientEmail,
            clientName: data.clientName,
            clientFirstName: data.clientFirstName,
            clientLastName: data.clientLastName,
          });
        }
      });

      // Sort by date (most recent first)
      bookingsList.sort((a, b) => {
        const dateA = a.sortableDate || a.date;
        const dateB = b.sortableDate || b.date;
        return dateB.localeCompare(dateA);
      });

      console.log(`✅ ${bookingsList.length} pending reservations`);
      setBookings(bookingsList);
    } catch (error) {
      console.error("❌ Error loading bookings:", error);
      Alert.alert("Error", "Unable to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  /* ---------- UPDATE STATUS ---------- */

  const updateStatus = async (id: string, status: "confirmed" | "declined") => {
    try {
      const bookingRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingRef);
      
      if (!bookingSnap.exists()) {
        Alert.alert("Error", "Booking not found");
        return;
      }
      
      const bookingData = bookingSnap.data();
      const clientId = bookingData.clientId;
      
      // Update booking status
      await updateDoc(bookingRef, { 
        status,
        updatedAt: serverTimestamp(),
        coachRespondedAt: serverTimestamp(),
      });
      
      // 🔔 Create notification for client
      if (status === "confirmed") {
        await addDoc(collection(db, "notifications"), {
          userId: clientId,
          type: "booking_confirmed",
          title: "🎯 Booking confirmed!",
          message: `Your ${bookingData.sport} booking has been confirmed by the coach. You can now proceed with payment.`,
          bookingId: id,
          read: false,
          createdAt: serverTimestamp(),
          data: {
            bookingId: id,
            sport: bookingData.sport,
            price: bookingData.price,
            coachId: bookingData.coachId,
            serviceId: bookingData.serviceId,
            date: bookingData.date,
            time: bookingData.time,
          }
        });
      } else if (status === "declined") {
        await addDoc(collection(db, "notifications"), {
          userId: clientId,
          type: "booking_declined",
          title: "❌ Booking declined",
          message: `Your ${bookingData.sport} booking has been declined by the coach.`,
          bookingId: id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      
      // Remove from local list
      setBookings((prev) => prev.filter((x) => x.id !== id));
      
      Alert.alert(
        "Success",
        status === "confirmed" 
          ? "✅ Booking successfully confirmed! The client has been notified." 
          : "❌ Booking declined. The client has been notified."
      );
      
      // Refresh after a short delay
      setTimeout(() => {
        fetchBookings();
      }, 500);
      
    } catch (error) {
      console.error("Error updating booking:", error);
      Alert.alert("Error", "Unable to update booking");
    }
  };

  const handleAccept = (id: string) => {
    Alert.alert(
      "Confirm booking",
      "Are you sure you want to accept this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: () => updateStatus(id, "confirmed"),
        },
      ]
    );
  };

  const handleDecline = (id: string) => {
    Alert.alert(
      "Decline booking",
      "Are you sure you want to decline this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => updateStatus(id, "declined"),
        },
      ]
    );
  };

  /* ---------- HELPER FUNCTIONS ---------- */

  const formatDate = (dateStr: string) => {
    if (dateStr === "Date to be determined") return "To be determined";
    
    try {
      const frenchMonths = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
      const isFrenchDate = frenchMonths.some(month => dateStr.toLowerCase().includes(month));
      
      if (isFrenchDate) {
        return dateStr;
      }
      
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (timeStr === "Time to be determined") return "To be determined";
    
    try {
      if (timeStr.includes(':') && timeStr.split(':').length >= 2) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours}h${minutes}`;
      }
      
      return timeStr;
    } catch {
      return timeStr;
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

  const getClientName = (item: Booking) => {
    if (item.clientFirstName && item.clientLastName) {
      return `${item.clientFirstName} ${item.clientLastName}`;
    }
    if (item.clientName) {
      return item.clientName;
    }
    if (item.clientEmail) {
      return item.clientEmail.split('@')[0];
    }
    return "Client";
  };

  /* ---------- RENDER ITEM ---------- */

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sport}>{item.sport}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.clientInfo}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.clientText}>
          {getClientName(item)}
        </Text>
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
            <Text style={styles.detailText}>{getDurationText(item.duration)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.price} €</Text>
          </View>
        </View>

        <View style={styles.modeRow}>
          <Text style={styles.modeText}>
            Mode: {item.coachingMode === "remote" && "📍 Remote"}
                  {item.coachingMode === "in-person" && "👤 In person"}
                  {item.coachingMode === "no-preference" && "🤷 No preference"}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.declineButton}
          onPress={() => handleDecline(item.id)}
        >
          <Ionicons name="close-circle" size={18} color="#FF3B30" />
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>

        <Pressable
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );

  /* ---------- RENDER EMPTY ---------- */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No pending bookings</Text>
      <Text style={styles.emptyText}>
        Your clients' bookings will appear here for confirmation.
      </Text>
    </View>
  );

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  /* ---------- MAIN RENDER ---------- */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <Text style={styles.headerSubtitle}>
          {bookings.length} pending request{bookings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: {
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
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
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
    marginBottom: 12,
  },
  sport: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#856404",
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
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
    flex: 1,
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
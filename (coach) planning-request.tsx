import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  duration?: number;
  scheduledDateTime?: any;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  createdAt: any;
  clientEmail?: string;
  clientName?: string;
};

/* ---------- SCREEN ---------- */

export default function PlanningScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- FETCH BOOKINGS ---------- */

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "bookings"),
        where("coachId", "==", user.uid),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const bookingsList: Booking[] = [];
      
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        bookingsList.push({
          id: docSnap.id,
          clientId: data.clientId,
          coachId: data.coachId,
          serviceId: data.serviceId,
          sport: data.sport,
          coachingMode: data.coachingMode,
          price: data.price,
          date: data.date,
          time: data.time,
          duration: data.duration || 60,
          scheduledDateTime: data.scheduledDateTime,
          status: data.status,
          createdAt: data.createdAt,
          clientEmail: data.clientEmail,
          clientName: data.clientName,
        });
      }
      
      setBookings(bookingsList);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      // Si erreur d'index, essayer sans orderBy
      if (error.code === 'failed-precondition') {
        try {
          const q = query(
            collection(db, "bookings"),
            where("coachId", "==", user.uid),
            where("status", "==", "pending")
          );
          const snap = await getDocs(q);
          const bookingsList: Booking[] = snap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data
            } as Booking;
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
      await updateDoc(doc(db, "bookings", id), { 
        status,
        updatedAt: new Date()
      });
      
      // Retirer de la liste localement
      setBookings((prev) => prev.filter((x) => x.id !== id));
      
      Alert.alert(
        "Success",
        status === "confirmed" 
          ? "Booking confirmed successfully!" 
          : "Booking declined."
      );
    } catch (error) {
      console.error("Error updating booking:", error);
      Alert.alert("Error", "Failed to update booking");
    }
  };

  const handleAccept = (id: string) => {
    Alert.alert(
      "Confirm Booking",
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
      "Decline Booking",
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

  /* ---------- FORMAT FUNCTIONS ---------- */

  const formatDate = (dateStr: string) => {
    try {
      // Si la date est déjà formatée (depuis Firestore)
      if (dateStr.includes('/')) {
        return dateStr;
      }
      // Sinon, essayer de parser
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
          {item.clientName || item.clientEmail || `Client (${item.clientId.substring(0, 6)}...)`}
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
            <Text style={styles.detailText}>{item.time}</Text>
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
            Mode: {item.coachingMode === "remote" && "Remote"}
                 {item.coachingMode === "in-person" && "In Person"}
                 {item.coachingMode === "no-preference" && "No Preference"}
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
        When clients book your services, they'll appear here for confirmation.
      </Text>
    </View>
  );

  /* ---------- RENDER ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <Text style={styles.headerSubtitle}>
          {bookings.length} pending {bookings.length === 1 ? 'request' : 'requests'}
        </Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
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

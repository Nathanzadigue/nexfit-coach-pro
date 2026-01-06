import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
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
  sortableDate?: string;
  sortableTime?: string;
  duration?: number;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  clientEmail?: string;
  clientName?: string;
};

/* ---------- SCREEN ---------- */

export default function PlanningScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- FETCH PENDING BOOKINGS ---------- */

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // Récupérer TOUTES les réservations
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const bookingsList: Booking[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Filtrer : uniquement celles pour ce coach ET avec statut "pending"
        if (data.coachId === user.uid && data.status === "pending") {
          bookingsList.push({
            id: docSnap.id,
            clientId: data.clientId,
            coachId: data.coachId,
            serviceId: data.serviceId,
            sport: data.sport || "Sport",
            coachingMode: data.coachingMode || "no-preference",
            price: data.price || "0",
            date: data.date || data.sortableDate || "Date à définir",
            time: data.time || data.sortableTime || "Heure à définir",
            sortableDate: data.sortableDate,
            sortableTime: data.sortableTime,
            duration: data.duration || 60,
            status: data.status || "pending",
            clientEmail: data.clientEmail,
            clientName: data.clientName,
          });
        }
      });

      // Trier par date (plus récent en premier)
      bookingsList.sort((a, b) => {
        const dateA = a.sortableDate || a.date;
        const dateB = b.sortableDate || b.date;
        return dateB.localeCompare(dateA);
      });

      console.log(`✅ ${bookingsList.length} réservations en attente`);
      setBookings(bookingsList);
    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
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
        "Succès",
        status === "confirmed" 
          ? "✅ Réservation confirmée avec succès !" 
          : "❌ Réservation refusée."
      );
      
      // Rafraîchir après un court délai
      setTimeout(() => {
        fetchBookings();
      }, 500);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour la réservation");
    }
  };

  const handleAccept = (id: string) => {
    Alert.alert(
      "Confirmer la réservation",
      "Êtes-vous sûr de vouloir accepter cette réservation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Accepter",
          style: "default",
          onPress: () => updateStatus(id, "confirmed"),
        },
      ]
    );
  };

  const handleDecline = (id: string) => {
    Alert.alert(
      "Refuser la réservation",
      "Êtes-vous sûr de vouloir refuser cette réservation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser",
          style: "destructive",
          onPress: () => updateStatus(id, "declined"),
        },
      ]
    );
  };

  /* ---------- HELPER FUNCTIONS ---------- */

  const formatDate = (dateStr: string) => {
    if (dateStr === "Date à définir") return "À définir";
    
    try {
      // Si la date est déjà en français
      const frenchMonths = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
      const isFrenchDate = frenchMonths.some(month => dateStr.toLowerCase().includes(month));
      
      if (isFrenchDate) {
        return dateStr;
      }
      
      // Si c'est au format YYYY-MM-DD
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('fr-FR', {
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
    if (timeStr === "Heure à définir") return "À définir";
    
    try {
      // Si c'est au format HH:MM
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

  /* ---------- RENDER ITEM ---------- */

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sport}>{item.sport}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>En attente</Text>
        </View>
      </View>

      <View style={styles.clientInfo}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.clientText}>
          {item.clientName || item.clientEmail || `Client`}
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
            Mode : {item.coachingMode === "remote" && "📍 À distance"}
                  {item.coachingMode === "in-person" && "👤 En présentiel"}
                  {item.coachingMode === "no-preference" && "🤷 Sans préférence"}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.declineButton}
          onPress={() => handleDecline(item.id)}
        >
          <Ionicons name="close-circle" size={18} color="#FF3B30" />
          <Text style={styles.declineButtonText}>Refuser</Text>
        </Pressable>

        <Pressable
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </Pressable>
      </View>
    </View>
  );

  /* ---------- RENDER EMPTY ---------- */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>Aucune réservation en attente</Text>
      <Text style={styles.emptyText}>
        Les réservations de vos clients apparaîtront ici pour confirmation.
      </Text>
    </View>
  );

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  /* ---------- MAIN RENDER ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Demandes de réservation</Text>
        <Text style={styles.headerSubtitle}>
          {bookings.length} demande{bookings.length !== 1 ? 's' : ''} en attente
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
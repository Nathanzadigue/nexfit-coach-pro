import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type Service = {
  coachId: string;
  sport: string;
  coachingMode: string;
  price: string;
  duration?: number;
  dateTime?: Date; // Date et heure définies par le coach
};

/* ---------- SCREEN ---------- */

export default function NewBookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- FETCH SERVICE ---------- */

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "services", serviceId));
        if (snap.exists()) {
          const data = snap.data();
          setService({
            coachId: data.coachId,
            sport: data.sport,
            coachingMode: data.coachingMode,
            price: data.price,
            duration: data.duration || 60,
            dateTime: data.dateTime?.toDate(),
          } as Service);
        }
      } catch (error) {
        console.error("Error loading service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  /* ---------- HELPERS ---------- */

  const formatDate = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return d.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return d.toLocaleTimeString('fr-FR', options);
  };

  const getDurationText = (minutes: number) => {
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

  /* ---------- CONFIRM BOOKING ---------- */

  const handleConfirm = async () => {
    if (!user || !service || !serviceId) {
      Alert.alert("Erreur", "Informations manquantes");
      return;
    }

    // Vérifier si le service a une date/heure définie
    if (!service.dateTime) {
      Alert.alert("Erreur", "Ce service n'a pas de date et heure programmées");
      return;
    }

    try {
      const dateObj = service.dateTime;
      
      // 🔹 FORMATAGE CORRECT POUR L'AFFICHAGE
      const displayDate = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const displayTime = dateObj.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // 🔹 FORMATAGE POUR LE TRI
      const sortableDate = dateObj.toISOString().split('T')[0]; // "2025-01-24"
      const time24h = dateObj.toTimeString().slice(0, 5); // "14:30"

      await addDoc(collection(db, "bookings"), {
        clientId: user.uid,
        clientEmail: user.email,
        coachId: service.coachId,
        serviceId: serviceId,
        sport: service.sport,
        coachingMode: service.coachingMode,
        price: service.price,
        duration: service.duration || 60,
        // 🔹 STOCKER LES DEUX VERSIONS
        date: displayDate,           // Pour l'affichage "ven. 24 janv. 2025"
        time: displayTime,           // Pour l'affichage "14:30"
        sortableDate: sortableDate,  // Pour le tri "2025-01-24"
        sortableTime: time24h,       // Pour le tri "14:30"
        scheduledDateTime: service.dateTime,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Réservation confirmée",
        "Votre réservation a été créée avec succès !",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(client)/bookings"),
          }
        ]
      );
    } catch (error) {
      console.error("Impossible de créer la réservation:", error);
      Alert.alert("Erreur", "Impossible de créer la réservation. Veuillez réessayer.");
    }
  };

  /* ---------- STATES ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Chargement…</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text>Service non trouvé</Text>
      </View>
    );
  }

  /* ---------- AFFICHAGE DE LA DATE ET HEURE ---------- */

  const getDateTimeDisplay = () => {
    if (!service.dateTime) {
      return { dateText: "Non programmé", timeText: "" };
    }
    
    const date = service.dateTime;
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    
    return { dateText: formattedDate, timeText: formattedTime };
  };

  const { dateText, timeText } = getDateTimeDisplay();

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Réserver une séance</Text>

        {/* SERVICE INFO */}
        <View style={styles.card}>
          <Text style={styles.sport}>{service.sport}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.meta}>Mode : {service.coachingMode}</Text>
            <Text style={styles.price}>{service.price} €</Text>
          </View>

          {/* DURATION */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Durée :</Text>
            <Text style={styles.infoValue}>
              {getDurationText(service.duration || 60)}
            </Text>
          </View>

          {/* DATE & TIME (READ-ONLY) - AMÉLIORÉ */}
          {service.dateTime ? (
            <>
              <View style={styles.datetimeContainer}>
                <View style={styles.datetimeHeader}>
                  <Text style={styles.datetimeTitle}>⏰ Date & Heure programmées</Text>
                </View>
                
                <View style={styles.datetimeContent}>
                  <View style={styles.datetimeItem}>
                    <Ionicons name="calendar-outline" size={18} color="#666" style={styles.datetimeIcon} />
                    <View>
                      <Text style={styles.datetimeLabel}>Date</Text>
                      <Text style={styles.datetimeValue}>{dateText}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.datetimeSeparator} />
                  
                  <View style={styles.datetimeItem}>
                    <Ionicons name="time-outline" size={18} color="#666" style={styles.datetimeIcon} />
                    <View>
                      <Text style={styles.datetimeLabel}>Heure</Text>
                      <Text style={styles.datetimeValue}>{timeText}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={20} color="#856404" style={styles.warningIcon} />
              <View style={styles.warningContent}>
                <Text style={styles.warningText}>
                  ⚠️ Ce service n'a pas de date et heure programmées.
                </Text>
                <Text style={styles.warningSubtext}>
                  Veuillez contacter le coach pour programmer.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color="#055C9D" style={styles.noteIcon} />
            <Text style={styles.noteText}>
              La date et l'heure sont fixées par le coach. Vous ne pouvez pas les modifier.
            </Text>
          </View>
        </View>

        {/* BOOKING CONFIRMATION BUTTON */}
        <Pressable 
          style={[
            styles.primaryButton, 
            !service.dateTime && styles.disabledButton
          ]} 
          onPress={handleConfirm}
          disabled={!service.dateTime}
        >
          <Text style={styles.primaryText}>
            {service.dateTime ? "Confirmer la réservation" : "Impossible - Pas de programme"}
          </Text>
        </Pressable>

        {/* CANCEL BUTTON */}
        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Annuler</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#000",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  sport: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#000",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  meta: {
    fontSize: 15,
    color: "#555",
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  /* NOUVEAUX STYLES DATE/TIME */
  datetimeContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  datetimeHeader: {
    marginBottom: 12,
  },
  datetimeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  datetimeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datetimeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datetimeIcon: {
    marginRight: 4,
  },
  datetimeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  datetimeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  datetimeSeparator: {
    width: 1,
    height: 40,
    backgroundColor: "#EEE",
    marginHorizontal: 16,
  },
  warningBox: {
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FFEAA7",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    fontSize: 14,
    color: "#856404",
    fontWeight: "500",
    lineHeight: 20,
  },
  warningSubtext: {
    fontSize: 13,
    color: "#856404",
    marginTop: 4,
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#B6E0FE",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noteIcon: {
    marginTop: 2,
  },
  noteText: {
    fontSize: 13,
    color: "#055C9D",
    fontStyle: "italic",
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.7,
  },
  primaryText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  secondaryText: {
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

// Import manquant
import { Ionicons } from "@expo/vector-icons";

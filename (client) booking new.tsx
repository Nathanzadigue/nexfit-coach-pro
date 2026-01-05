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
  View,
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
  duration?: number; // Durée en minutes
  dateTime?: Date; // Date et heure du cours
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

  const formatDateTime = (date: Date) => {
    const optionsDate: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    const optionsTime: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    return {
      date: date.toLocaleDateString('fr-FR', optionsDate),
      time: date.toLocaleTimeString('fr-FR', optionsTime)
    };
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
      Alert.alert("Error", "Missing information");
      return;
    }

    // Vérifier si le service a une date/heure définie
    if (!service.dateTime) {
      Alert.alert("Error", "This service doesn't have a scheduled date and time");
      return;
    }

    try {
      const bookingData = {
        clientId: user.uid,
        clientEmail: user.email,
        coachId: service.coachId,
        serviceId: serviceId,
        sport: service.sport,
        coachingMode: service.coachingMode,
        price: service.price,
        duration: service.duration || 60,
        scheduledDateTime: service.dateTime, // Date/heure fixée par le coach
        status: "pending", // Ou "confirmed" selon votre workflow
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "bookings"), bookingData);

      Alert.alert(
        "Booking Confirmed",
        "Your booking has been successfully created!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(client)/bookings"),
          }
        ]
      );
    } catch (error) {
      console.error("Unable to create booking:", error);
      Alert.alert("Error", "Unable to create booking. Please try again.");
    }
  };

  /* ---------- STATES ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text>Service not found</Text>
      </View>
    );
  }

  const { date: formattedDate, time: formattedTime } = service.dateTime 
    ? formatDateTime(service.dateTime)
    : { date: "Not scheduled", time: "" };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Book a session</Text>

        {/* SERVICE INFO */}
        <View style={styles.card}>
          <Text style={styles.sport}>{service.sport}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.meta}>Mode: {service.coachingMode}</Text>
            <Text style={styles.price}>{service.price} €</Text>
          </View>

          {/* DATE AND TIME INFO (READ-ONLY) */}
          {service.dateTime ? (
            <View style={styles.datetimeSection}>
              <Text style={styles.sectionTitle}>Scheduled Session</Text>
              
              <View style={styles.datetimeRow}>
                <View style={styles.datetimeItem}>
                  <Text style={styles.datetimeLabel}>Date:</Text>
                  <Text style={styles.datetimeValue}>{formattedDate}</Text>
                </View>
                
                <View style={styles.datetimeItem}>
                  <Text style={styles.datetimeLabel}>Time:</Text>
                  <Text style={styles.datetimeValue}>{formattedTime}</Text>
                </View>
              </View>
              
              <View style={styles.datetimeRow}>
                <View style={styles.datetimeItem}>
                  <Text style={styles.datetimeLabel}>Duration:</Text>
                  <Text style={styles.datetimeValue}>
                    {getDurationText(service.duration || 60)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ This service doesn't have a scheduled date and time.
              </Text>
              <Text style={styles.warningSubtext}>
                Please contact the coach for scheduling.
              </Text>
            </View>
          )}

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              ℹ️ The date and time are fixed by the coach. You cannot modify them.
            </Text>
          </View>
        </View>

        {/* BOOKING CONFIRMATION */}
        <Pressable 
          style={[
            styles.primaryButton, 
            !service.dateTime && styles.disabledButton
          ]} 
          onPress={handleConfirm}
          disabled={!service.dateTime}
        >
          <Text style={styles.primaryText}>
            {service.dateTime ? "Confirm Booking" : "Cannot Book - No Schedule"}
          </Text>
        </Pressable>

        {/* CANCEL BUTTON */}
        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Cancel</Text>
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
    marginBottom: 12,
    color: "#000",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
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
  datetimeSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  datetimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  datetimeItem: {
    flex: 1,
  },
  datetimeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  datetimeValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  warningBox: {
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  warningText: {
    fontSize: 14,
    color: "#856404",
    fontWeight: "500",
  },
  warningSubtext: {
    fontSize: 13,
    color: "#856404",
    marginTop: 4,
  },
  noteBox: {
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#B6E0FE",
  },
  noteText: {
    fontSize: 13,
    color: "#055C9D",
    fontStyle: "italic",
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

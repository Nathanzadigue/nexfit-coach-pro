import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type Service = {
  coachId: string;
  sport: string;
  coachingMode: string;
  price: string;
};

/* ---------- SCREEN ---------- */

export default function NewBookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ DATE = Date (OK)
  const [date, setDate] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // ✅ TIME = STRING (CORRECTION CLÉ)
  const [time, setTime] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
          setService(snap.data() as Service);
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

  const formatDate = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate()
    ).padStart(2, "0")}`;

  /* ---------- CONFIRM BOOKING ---------- */

  const handleConfirm = async () => {
    if (!user || !service || !date || !time || !serviceId) {
      Alert.alert("Missing information", "Please select date and time");
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        clientId: user.uid,
        coachId: service.coachId,
        serviceId: serviceId,
        sport: service.sport,
        coachingMode: service.coachingMode,
        price: service.price,
        date: formatDate(date),
        time: time, // ✅ STRING "HH:mm"
        status: "pending",
        createdAt: serverTimestamp(),
      });

      router.replace("/(client)/bookings");
    } catch (error) {
      console.error("Unable to create booking:", error);
      Alert.alert("Error", "Unable to create booking");
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
          <Text style={styles.meta}>Mode: {service.coachingMode}</Text>
          <Text style={styles.price}>{service.price} €</Text>
        </View>

        {/* DATE */}
        <Pressable
          onPress={() => {
            setTempDate(date || new Date());
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.input}>
            {date ? formatDate(date) : "Select date"}
          </Text>
        </Pressable>

        {showDatePicker && (
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={tempDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              themeVariant="light"
              accentColor="#000"
              minimumDate={new Date()}
              onChange={(_, selected) => {
                if (selected) setTempDate(selected);
              }}
            />

            <Pressable
              style={styles.confirmPicker}
              onPress={() => {
                if (tempDate) setDate(tempDate);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.confirmText}>Confirm date</Text>
            </Pressable>
          </View>
        )}

        {/* TIME */}
        <Pressable
          onPress={() => {
            setTempTime(new Date());
            setShowTimePicker(true);
          }}
        >
          <Text style={styles.input}>
            {time ? time : "Select time"}
          </Text>
        </Pressable>

        {showTimePicker && (
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={tempTime || new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "spinner"}
              is24Hour={true}
              themeVariant="light"
              accentColor="#000"
              onChange={(_, selected) => {
                if (selected) setTempTime(selected);
              }}
            />

            <Pressable
              style={styles.confirmPicker}
              onPress={() => {
                if (tempTime) {
                  const hours = tempTime.getHours();
                  const minutes = tempTime.getMinutes();

                  const timeString =
                    String(hours).padStart(2, "0") +
                    ":" +
                    String(minutes).padStart(2, "0");

                  setTime(timeString); // ✅ STOCKAGE STRING
                }
                setShowTimePicker(false);
              }}
            >
              <Text style={styles.confirmText}>Confirm time</Text>
            </Pressable>
          </View>
        )}

        {/* CONFIRM */}
        <Pressable style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryText}>Confirm booking</Text>
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
    marginBottom: 8,
    color: "#000",
  },
  meta: {
    fontSize: 15,
    color: "#555",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    color: "#000",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 12,
    color: "#000",
  },
  pickerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  confirmPicker: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  confirmText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  primaryText: {
    color: "#FFF",
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

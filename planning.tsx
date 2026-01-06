import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type Booking = {
  id: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "declined";
};

/* ---------- SCREEN ---------- */

export default function PlanningScreen() {
  const { user } = useAuth();

  /* ===== DATE STATE ===== */
  const [date, setDate] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* ===== DATA ===== */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- HELPERS ---------- */

  const formatDate = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate()
    ).padStart(2, "0")}`;

  /* ---------- FETCH BOOKINGS ---------- */

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setLoading(true);

      try {
        const q = query(
          collection(db, "bookings"),
          where("coachId", "==", user.uid),
          where("date", "==", formatDate(date))
        );

        const snap = await getDocs(q);

        setBookings(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Booking, "id">),
          }))
        );
      } catch (error) {
        console.error("Error loading planning:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, date]);

  /* ---------- ACTIONS ---------- */

  const updateStatus = async (
    bookingId: string,
    status: "confirmed" | "declined"
  ) => {
    await updateDoc(doc(db, "bookings", bookingId), { status });

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status } : b
      )
    );
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>

        {/* DATE SELECTOR */}
        <Pressable
          onPress={() => {
            setTempDate(date);
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.input}>
            {formatDate(date)}
          </Text>
        </Pressable>
      </View>

      {/* ===== DATE PICKER ===== */}
      {showDatePicker && (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={tempDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            themeVariant="light"
            accentColor="#000"
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
            <Text style={styles.confirmText}>
              Confirm date
            </Text>
          </Pressable>
        </View>
      )}

      {/* ===== CONTENT ===== */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={bookings}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No sessions for this day
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.time}>
                {item.time}
              </Text>

              <Text
                style={[
                  styles.status,
                  item.status === "pending" && styles.pending,
                  item.status === "confirmed" && styles.confirmed,
                  item.status === "declined" && styles.declined,
                ]}
              >
                {item.status.toUpperCase()}
              </Text>

              {item.status === "pending" && (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.accept}
                    onPress={() =>
                      updateStatus(item.id, "confirmed")
                    }
                  >
                    <Text style={styles.actionText}>
                      Accept
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.decline}
                    onPress={() =>
                      updateStatus(item.id, "declined")
                    }
                  >
                    <Text style={styles.actionTextDark}>
                      Decline
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#000",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    color: "#000",
  },

  pickerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    margin: 20,
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

  list: {
    padding: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  time: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#000",
  },

  status: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  pending: {
    color: "#FB8C00",
  },
  confirmed: {
    color: "#2E7D32",
  },
  declined: {
    color: "#C62828",
  },

  actions: {
    flexDirection: "row",
    marginTop: 6,
  },
  accept: {
    flex: 1,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  decline: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    padding: 12,
    borderRadius: 10,
  },
  actionText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
  },
  actionTextDark: {
    color: "#000",
    textAlign: "center",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#777",
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

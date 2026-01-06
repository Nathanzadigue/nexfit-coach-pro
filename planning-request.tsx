import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

export default function PlanningScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const q = query(
        collection(db, "bookings"),
        where("coachId", "==", user.uid),
        where("status", "==", "pending")
      );

      const snap = await getDocs(q);
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetch();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "bookings", id), { status });
    setBookings((b) => b.filter((x) => x.id !== id));
  };

  return (
    <FlatList
      contentContainerStyle={{ padding: 20 }}
      data={bookings}
      keyExtractor={(i) => i.id}
      ListEmptyComponent={<Text>No pending bookings</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text>Date: {item.date}</Text>
          <Text>Time: {item.time}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.accept}
              onPress={() => updateStatus(item.id, "confirmed")}
            >
              <Text style={styles.text}>Accept</Text>
            </Pressable>

            <Pressable
              style={styles.decline}
              onPress={() => updateStatus(item.id, "declined")}
            >
              <Text style={styles.textDark}>Decline</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
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
  text: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
  },
  textDark: {
    color: "#000",
    textAlign: "center",
    fontWeight: "600",
  },
});

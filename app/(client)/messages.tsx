import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- TYPES ---------- */

type Conversation = {
  id: string;
  lastMessage: string;
  updatedAt: any;
  otherUserName: string;
  unreadFor?: string | null;
};

/* ---------- SCREEN ---------- */

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid)
        );

        const snap = await getDocs(q);
        const list: Conversation[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data();

          const otherUserId = data.participants.find(
            (id: string) => id !== user.uid
          );

          let otherUserName = "Conversation";

          if (otherUserId) {
            const userSnap = await getDoc(
              doc(db, "users", otherUserId)
            );
            if (userSnap.exists()) {
              const u = userSnap.data();
              otherUserName = `${u.firstName} ${u.lastName}`;
            }
          }

          list.push({
            id: docSnap.id,
            lastMessage: data.lastMessage,
            updatedAt: data.updatedAt,
            unreadFor: data.unreadFor ?? null,
            otherUserName,
          });
        }

        setConversations(list);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No conversations yet
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push(`/(client)/messages/${item.id}`)
            }
          >
            <View style={styles.row}>
              <Text style={styles.name}>
                {item.otherUserName}
              </Text>

              {item.unreadFor === user?.uid && (
                <View style={styles.dot} />
              )}
            </View>

            <Text
              style={styles.preview}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 20,
  },
  card: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  preview: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
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

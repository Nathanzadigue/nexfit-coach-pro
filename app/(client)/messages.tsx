import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        style={styles.listContainer}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
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
  screen: {
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    paddingBottom: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
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
    backgroundColor: "#F5F5F5",
  },
});
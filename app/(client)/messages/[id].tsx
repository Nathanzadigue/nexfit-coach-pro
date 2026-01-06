import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type Message = {
  id: string;
  senderId: string;
  text: string;
};

/* ---------- SCREEN ---------- */

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  /* ---------- LOAD CONVERSATION ---------- */

  useEffect(() => {
    if (!id || !user) return;

    const convRef = doc(db, "conversations", id);

    // 🔹 récupérer l'autre participant
    getDoc(convRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const other = data.participants.find(
          (p: string) => p !== user.uid
        );
        setOtherUserId(other ?? null);
      }
    });

    // 🔹 messages ordonnés DU PLUS ANCIEN AU PLUS RÉCENT
    const messagesQuery = query(
      collection(db, "conversations", id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(messagesQuery, (snap) => {
      const list: Message[] = [];
      snap.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as any),
        });
      });
      setMessages(list);
    });

    // 🔴 marquer comme lu
    updateDoc(convRef, { unreadFor: null });

    return unsub;
  }, [id, user]);

  /* ---------- SEND MESSAGE ---------- */

  const sendMessage = async () => {
    if (!text.trim() || !user || !otherUserId || !id) return;

    const messageText = text;
    setText("");

    const convRef = doc(db, "conversations", id);

    // 🔹 message
    await addDoc(
      collection(db, "conversations", id, "messages"),
      {
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp(),
      }
    );

    // 🔹 mise à jour conversation
    await updateDoc(convRef, {
      lastMessage: messageText,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      unreadFor: otherUserId,
    });
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.uid;

            return (
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.me : styles.other,
                ]}
              >
                <Text
                  style={[
                    styles.text,
                    isMe && { color: "#FFF" },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            );
          }}
        />

        {/* INPUT */}
        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor="#888"
            style={styles.input}
          />
          <Pressable style={styles.send} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  messages: {
    padding: 16,
    paddingBottom: 10,
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  me: {
    backgroundColor: "#000",
    alignSelf: "flex-end",
  },
  other: {
    backgroundColor: "#EEE",
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 15,
    color: "#000",
  },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    backgroundColor: "#FFF",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 14,
    marginRight: 8,
    color: "#000",
  },
  send: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendText: {
    color: "#FFF",
    fontWeight: "600",
  },
});

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- SCREEN ---------- */

export default function ComposeMessageScreen() {
  const { coachId, coachName } = useLocalSearchParams<{
    coachId: string;
    coachName: string;
  }>();

  const { user } = useAuth();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !coachId || !message.trim()) return;

    setSending(true);

    try {
      // 🔹 conversationId déterministe
      const conversationId = [user.uid, coachId].sort().join("_");

      const convoRef = doc(db, "conversations", conversationId);

      // 🔹 créer / mettre à jour la conversation
      await setDoc(
        convoRef,
        {
          participants: [user.uid, coachId],
          lastMessage: message,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 🔹 ajouter le message
      await addDoc(
        collection(convoRef, "messages"),
        {
          senderId: user.uid,
          text: message,
          createdAt: serverTimestamp(),
        }
      );

      router.replace(`/(client)/messages/${conversationId}`);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <Text style={styles.to}>To: {coachName}</Text>

        {/* SUBJECT */}
        <TextInput
          placeholder="Subject (optional)"
          value={subject}
          onChangeText={setSubject}
          style={styles.input}
        />

        {/* MESSAGE */}
        <TextInput
          placeholder="Write your message..."
          value={message}
          onChangeText={setMessage}
          multiline
          style={styles.textarea}
        />

        {/* SEND */}
        <Pressable
          style={[
            styles.sendButton,
            sending && { opacity: 0.5 },
          ]}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.sendText}>
            {sending ? "Sending..." : "Send"}
          </Text>
        </Pressable>
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
  container: {
    flex: 1,
    padding: 20,
  },
  to: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#000",
  },
  textarea: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#000",
  },
  sendButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
  },
  sendText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

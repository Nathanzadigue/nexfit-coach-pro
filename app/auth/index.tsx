import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useAuth } from "@/src/store/AuthContext";
import { router } from "expo-router";

type Mode = "choice" | "login";

export default function AuthIndex() {
  const { signIn } = useAuth();

  const [mode, setMode] = useState<Mode>("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await signIn(email, password);

      // ❌ AUCUNE REDIRECTION ICI
      // 👉 le RootLayout décide client / coach

    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* ===== CHOICE ===== */}
        {mode === "choice" && (
          <>
            <Text style={styles.title}>Welcome to Nexfit</Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => setMode("login")}
            >
              <Text style={styles.primaryText}>Log in</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/auth/step1")}
            >
              <Text style={styles.secondaryText}>Sign up</Text>
            </Pressable>
          </>
        )}

        {/* ===== LOGIN ===== */}
        {mode === "login" && (
          <>
            <Text style={styles.title}>Log in</Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#000"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#000"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={styles.primaryButton}
              onPress={handleLogin}
            >
              <Text style={styles.primaryText}>Validate</Text>
            </Pressable>

            <Pressable onPress={() => setMode("choice")}>
              <Text style={styles.link}>← Back</Text>
            </Pressable>
          </>
        )}

      </View>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#000",
    backgroundColor: "#FFF",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#444",
    paddingVertical: 14,
    borderRadius: 10,
  },
  secondaryText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
  },
});

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type CoachingMode = "remote" | "in-person" | "no-preference";

type CoachService = {
  sport: string;
  coachingMode: CoachingMode;
  price: string;
};

/* ---------- SCREEN ---------- */

export default function CoachServicesScreen() {
  const { user } = useAuth();

  const [sport, setSport] = useState("");
  const [coachingMode, setCoachingMode] =
    useState<CoachingMode>("remote");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------- LOAD EXISTING SERVICE ---------- */

  useEffect(() => {
    const fetchService = async () => {
      if (!user) return;

      try {
        const ref = doc(db, "services", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as CoachService;
          setSport(data.sport);
          setCoachingMode(data.coachingMode);
          setPrice(data.price);
        }
      } catch (error) {
        console.error("Error loading service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [user]);

  /* ---------- SAVE SERVICE ---------- */

  const handleSave = async () => {
    if (!sport || !price) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (isNaN(Number(price))) {
      Alert.alert("Error", "Price must be a number");
      return;
    }

    if (!user) return;

    try {
      setSaving(true);

      await setDoc(
        doc(db, "services", user.uid),
        {
          coachId: user.uid,
          sport,
          coachingMode,
          price,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      Alert.alert("Success", "Service saved");
    } catch (error) {
      console.error("Error saving service:", error);
      Alert.alert("Error", "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>My service</Text>

        {/* SPORT */}
        <Text style={styles.label}>Sport / Practice</Text>
        <TextInput
          value={sport}
          onChangeText={setSport}
          placeholder="Yoga, Fitness, Cardio…"
          style={styles.input}
        />

        {/* COACHING MODE */}
        <Text style={styles.label}>Coaching mode</Text>

        {[
          { label: "Remote", value: "remote" },
          { label: "In person", value: "in-person" },
          { label: "No preference", value: "no-preference" },
        ].map((item) => (
          <Pressable
            key={item.value}
            onPress={() =>
              setCoachingMode(item.value as CoachingMode)
            }
            style={[
              styles.option,
              coachingMode === item.value &&
                styles.optionSelected,
            ]}
          >
            <Text style={styles.optionText}>
              {item.label}
            </Text>
          </Pressable>
        ))}

        {/* PRICE */}
        <Text style={styles.label}>Price (€)</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="50"
          style={styles.input}
        />

        {/* SAVE */}
        <Pressable
          style={[
            styles.button,
            saving && { opacity: 0.5 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving…" : "Save service"}
          </Text>
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
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
    color: "#000",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    color: "#000",
  },
  option: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: "#000",
    backgroundColor: "#EEE",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/firebase/config";

/* ---------- TYPES ---------- */

type CoachProfile = {
  firstName: string;
  lastName: string;
  userType: string;
  goals?: string[];
};

/* ---------- SCREEN ---------- */

export default function CoachProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [coach, setCoach] = useState<CoachProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  /* ---------- FETCH COACH ---------- */

  useEffect(() => {
    const fetchCoach = async () => {
      try {
        if (!id) return;

        const ref = doc(db, "users", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setCoach(snap.data() as CoachProfile);
        }
      } catch (error) {
        console.error(
          "Error loading coach profile:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCoach();
  }, [id]);

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!coach) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Coach not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.name}>
          {coach.firstName} {coach.lastName}
        </Text>

        <Text style={styles.role}>
          Professional coach
        </Text>

        {coach.goals && coach.goals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Specialties
            </Text>

            {coach.goals.map((goal) => (
              <Text key={goal} style={styles.item}>
                • {goal}
              </Text>
            ))}
          </View>
        )}

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push(
              `/(client)/messages?coachId=${id}`
            )
          }
        >
          <Text style={styles.primaryText}>
            Contact coach
          </Text>
        </Pressable>
      </View>
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
  name: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    color: "#000",
  },
  role: {
    fontSize: 15,
    color: "#555",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  item: {
    fontSize: 15,
    color: "#000",
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
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

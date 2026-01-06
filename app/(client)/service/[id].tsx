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

type Service = {
  coachId: string;
  sport: string;
  coachingMode: string;
  price: string;
};

type Coach = {
  firstName: string;
  lastName: string;
};

/* ---------- SCREEN ---------- */

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [service, setService] = useState<Service | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- FETCH SERVICE + COACH ---------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        const serviceRef = doc(db, "services", id);
        const serviceSnap = await getDoc(serviceRef);

        if (!serviceSnap.exists()) {
          setLoading(false);
          return;
        }

        const serviceData = serviceSnap.data() as Service;
        setService(serviceData);

        const coachRef = doc(db, "users", serviceData.coachId);
        const coachSnap = await getDoc(coachRef);

        if (coachSnap.exists()) {
          setCoach(coachSnap.data() as Coach);
        }
      } catch (error) {
        console.error("Error loading service detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!service || !coach) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Service not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ---------- COACH ---------- */}
        <View style={styles.coachBlock}>
          <Text style={styles.coachName}>
            {coach.firstName} {coach.lastName}
          </Text>
        </View>

        {/* ---------- SERVICE ---------- */}
        <View style={styles.card}>
          <Text style={styles.sport}>{service.sport}</Text>

          <Text style={styles.meta}>
            Coaching mode: {service.coachingMode}
          </Text>

          <Text style={styles.price}>
            {service.price} €
          </Text>
        </View>

        {/* ---------- ACTIONS ---------- */}
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/(client)/messages/compose",
              params: {
                coachId: service.coachId,
                coachName: `${coach.firstName} ${coach.lastName}`,
                serviceId: id,
              },
            })
          }
        >
          <Text style={styles.primaryText}>
            Contact coach
          </Text>
        </Pressable>

        {/* ✅ CORRECTION ICI */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: "/(client)/booking/new",
              params: { serviceId: id },
            })
          }
        >
          <Text style={styles.secondaryText}>
            Reserve session
          </Text>
        </Pressable>

        {/* ---------- VIEW COACH PROFILE ---------- */}
        <Pressable
          style={styles.linkButton}
          onPress={() =>
            router.push(
              `/(client)/coaches/${service.coachId}`
            )
          }
        >
          <Text style={styles.linkText}>
            View coach profile
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
  coachBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  coachName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
    marginBottom: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    color: "#000",
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    textDecorationLine: "underline",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

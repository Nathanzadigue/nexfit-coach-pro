import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";

import { db, auth } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type CoachProfile = {
  userType: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
};

/* ---------- SCREEN ---------- */

export default function CoachProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- FETCH PROFILE ---------- */

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfile(snap.data() as CoachProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error loading coach profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* ---------- LOGOUT ---------- */

  const confirmLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            await signOut(auth);
          },
        },
      ]
    );
  };

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  /* ---------- EMPTY ---------- */

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text>No coach profile data found.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.logoutButton}
            onPress={confirmLogout}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- CONTENT ---------- */

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.title}>Coach profile</Text>

        <Section title="Account">
          <Item label="Account type" value={profile.userType} />
          <Item label="Email" value={profile.email} />
        </Section>

        <Section title="Personal information">
          <Item
            label="First name"
            value={profile.firstName || "—"}
          />
          <Item
            label="Last name"
            value={profile.lastName || "—"}
          />
          <Item
            label="Date of birth"
            value={profile.dateOfBirth || "—"}
          />
        </Section>

        {profile.address && (
          <Section title="Address">
            <Item
              label="Street"
              value={profile.address.street || "—"}
            />
            <Item
              label="City"
              value={profile.address.city || "—"}
            />
            <Item
              label="Country"
              value={profile.address.country || "—"}
            />
          </Section>
        )}
      </ScrollView>

      {/* ---------- LOGOUT BUTTON ---------- */}
      <View style={styles.footer}>
        <Pressable
          style={styles.logoutButton}
          onPress={confirmLogout}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue}>{value}</Text>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#000",
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  item: {
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 13,
    color: "#666",
  },
  itemValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ---------- FOOTER ---------- */

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  logoutButton: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";

import { auth, db } from "@/src/firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const FREQUENCIES = [
  "1 time per week",
  "2 times per week",
  "3 times per week",
  "4 times per week",
  "5 times per week",
  "6 times per week",
];

type CoachingPreference = "remote" | "in-person" | "no-preference";

export default function OnboardingStep3() {
  const params = useLocalSearchParams();
  const goals = JSON.parse((params.goals as string) || "[]");

  const [frequency, setFrequency] = useState<string | null>(null);
  const [preference, setPreference] =
    useState<CoachingPreference | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const isValid = frequency && preference;

  const handleFinish = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);

    try {
      let uid: string;

      try {
        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            params.email as string,
            params.password as string
          );
        uid = userCredential.user.uid;
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          const userCredential =
            await signInWithEmailAndPassword(
              auth,
              params.email as string,
              params.password as string
            );
          uid = userCredential.user.uid;
        } else {
          throw error;
        }
      }

      await setDoc(
        doc(db, "users", uid),
        {
          userType: params.userType,
          email: params.email,
          firstName: params.firstName,
          lastName: params.lastName,
          dateOfBirth: params.dateOfBirth,
          address: {
            street: params.streetAddress,
            city: params.city,
            country: params.country,
          },
          goals,
          sessionsPerWeek: frequency,
          coachingPreference: preference,
          onboardingCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ REDIRECTION SELON LE RÔLE (SEULE MODIFICATION)
     
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Training preferences</Text>

      <Text style={styles.sectionTitle}>Sessions per week</Text>

      {FREQUENCIES.map((item) => (
        <Pressable
          key={item}
          onPress={() => setFrequency(item)}
          style={[
            styles.option,
            frequency === item && styles.optionSelected,
          ]}
        >
          <View style={styles.radioCircle}>
            {frequency === item && (
              <View style={styles.radioDot} />
            )}
          </View>
          <Text style={styles.optionText}>{item}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>
        Coaching preference
      </Text>

      <Pressable
        onPress={() => setPreference("remote")}
        style={[
          styles.option,
          preference === "remote" && styles.optionSelected,
        ]}
      >
        <View style={styles.radioCircle}>
          {preference === "remote" && (
            <View style={styles.radioDot} />
          )}
        </View>
        <Text style={styles.optionText}>Remote</Text>
      </Pressable>

      <Pressable
        onPress={() => setPreference("in-person")}
        style={[
          styles.option,
          preference === "in-person" && styles.optionSelected,
        ]}
      >
        <View style={styles.radioCircle}>
          {preference === "in-person" && (
            <View style={styles.radioDot} />
          )}
        </View>
        <Text style={styles.optionText}>In-person</Text>
      </Pressable>

      <Pressable
        onPress={() => setPreference("no-preference")}
        style={[
          styles.option,
          preference === "no-preference" &&
            styles.optionSelected,
        ]}
      >
        <View style={styles.radioCircle}>
          {preference === "no-preference" && (
            <View style={styles.radioDot} />
          )}
        </View>
        <Text style={styles.optionText}>
          No preference
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          (!isValid || submitting) &&
            styles.buttonDisabled,
        ]}
        onPress={handleFinish}
      >
        <Text style={styles.buttonText}>
          {submitting
            ? "Creating account..."
            : "Finish"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#000",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
    color: "#000",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  optionSelected: {
    borderColor: "#000",
    backgroundColor: "#EEE",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});

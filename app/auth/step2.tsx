import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";

const GOALS = [
  "Weight loss",
  "Strength",
  "Rehabilitation",
  "Cardio",
  "Aesthetics",
  "Athlete development",
];

export default function OnboardingStep2() {
  const params = useLocalSearchParams();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  const isValid = selectedGoals.length > 0;

  const handleContinue = () => {
    if (!isValid) return;

    router.push({
      pathname: "/auth/step3",
      params: {
        ...params,
        goals: JSON.stringify(selectedGoals),
      },
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Your goals</Text>
      <Text style={styles.subtitle}>Select one or more goals</Text>

      {GOALS.map((goal) => (
        <Pressable
          key={goal}
          onPress={() => toggleGoal(goal)}
          style={[
            styles.option,
            selectedGoals.includes(goal) && styles.optionSelected,
          ]}
        >
          <View style={styles.checkbox}>
            {selectedGoals.includes(goal) && (
              <View style={styles.checkboxInner} />
            )}
          </View>
          <Text style={styles.optionText}>{goal}</Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

/* styles INCHANGÉS */

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
    marginBottom: 8,
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
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
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 12,
    height: 12,
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
    marginTop: 20,
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

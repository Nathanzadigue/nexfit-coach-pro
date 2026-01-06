import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

type UserType = "coach" | "individual";

export default function OnboardingStep1() {
  const [userType, setUserType] = useState<UserType | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [showPicker, setShowPicker] = useState(false);

  const isFormValid =
    userType &&
    email &&
    password.length >= 6 &&
    firstName &&
    lastName &&
    dateOfBirth &&
    streetAddress &&
    city &&
    country;

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  };

  const handleContinue = () => {
    if (!isFormValid) return;

    router.push({
      pathname: "/auth/step2",
      params: {
        userType,
        email,
        password,
        firstName,
        lastName,
        dateOfBirth: formatDate(dateOfBirth!),
        streetAddress,
        city,
        country,
      },
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create your account</Text>

      {/* ===== USER TYPE ===== */}
      <Text style={styles.sectionTitle}>I am a</Text>

      <View style={styles.radioGroup}>
        {["coach", "individual"].map((type) => (
          <Pressable
            key={type}
            style={[
              styles.radioOption,
              userType === type && styles.radioSelected,
            ]}
            onPress={() => setUserType(type as UserType)}
          >
            <View style={styles.radioCircle}>
              {userType === type && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>
              {type === "coach" ? "Coach" : "Individual"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ===== AUTH ===== */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#000"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password (min. 6 characters)"
        placeholderTextColor="#000"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* ===== PROFILE ===== */}
      <TextInput
        placeholder="First name"
        placeholderTextColor="#000"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <TextInput
        placeholder="Last name"
        placeholderTextColor="#000"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />

      {/* ===== DATE PICKER ===== */}
      <Pressable
        onPress={() => {
          setTempDate(dateOfBirth || new Date(2000, 0, 1));
          setShowPicker(true);
        }}
      >
        <TextInput
          placeholder="Date of birth (YYYY/MM/DD)"
          placeholderTextColor="#000"
          value={dateOfBirth ? formatDate(dateOfBirth) : ""}
          editable={false}
          pointerEvents="none"
          style={styles.input}
        />
      </Pressable>

      {showPicker && (
        <View style={{ marginBottom: 12 }}>
          <DateTimePicker
            value={tempDate || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            themeVariant="light"
            accentColor="#000"
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              if (selectedDate) setTempDate(selectedDate);
            }}
          />

          <Pressable
            style={{
              backgroundColor: "#000",
              paddingVertical: 12,
              borderRadius: 10,
              marginTop: 8,
            }}
            onPress={() => {
              if (tempDate) setDateOfBirth(tempDate);
              setShowPicker(false);
            }}
          >
            <Text
              style={{
                color: "#FFF",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Confirm date
            </Text>
          </Pressable>
        </View>
      )}

      <TextInput
        placeholder="Street address"
        placeholderTextColor="#000"
        value={streetAddress}
        onChangeText={setStreetAddress}
        style={styles.input}
      />

      <TextInput
        placeholder="City"
        placeholderTextColor="#000"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <TextInput
        placeholder="Country"
        placeholderTextColor="#000"
        value={country}
        onChangeText={setCountry}
        style={styles.input}
      />

      {/* ===== CONTINUE ===== */}
      <Pressable
        style={[styles.button, !isFormValid && styles.buttonDisabled]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */

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
    color: "#000",
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#FFF",
  },
  radioSelected: {
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
  radioLabel: {
    fontSize: 16,
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

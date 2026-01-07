import DateTimePicker from '@react-native-community/datetimepicker';
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

/* ---------- TYPES ---------- */

type UserProfile = {
  userType: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  goals: string[];
  sessionsPerWeek: string;
  coachingPreference: string;
};

type EditableFields = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  goals: string;
  sessionsPerWeek: string;
  coachingPreference: string;
};

const SESSIONS_OPTIONS = ["1", "2", "3", "4", "5", "6"];
const COACHING_OPTIONS = ["Remote", "In person", "No preference"];

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // États pour les pickers
  const [showSessionsPicker, setShowSessionsPicker] = useState(false);
  const [showCoachingPicker, setShowCoachingPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // État pour la date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Animation pour le footer
  const footerAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const [form, setForm] = useState<EditableFields>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: { street: "", city: "", country: "" },
    goals: "",
    sessionsPerWeek: "",
    coachingPreference: "",
  });

  /* ---------- DATE FORMATTING ---------- */

  const safeFormatDate = (dateInput: any): string => {
    if (!dateInput) return "Not set";
    
    // Si c'est déjà une chaîne formatée correctement
    if (typeof dateInput === 'string') {
      let cleanString = dateInput.trim();
      
      cleanString = cleanString.replace(/undefined\//g, '');
      
      if (!cleanString) return "Not set";
      
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanString)) {
        return cleanString;
      }
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanString)) {
        const [year, month, day] = cleanString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanString)) {
        const [year, month, day] = cleanString.split('/');
        return `${day}/${month}/${year}`;
      }
      
      if (cleanString.includes('T')) {
        try {
          const date = new Date(cleanString);
          if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        } catch (e) {
          console.error("Error parsing ISO date:", e);
        }
      }
      
      return cleanString || "Invalid date";
    }
    
    if (dateInput instanceof Date) {
      try {
        const day = dateInput.getDate().toString().padStart(2, '0');
        const month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
        const year = dateInput.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        console.error("Error formatting Date object:", e);
        return "Invalid date";
      }
    }
    
    if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
      try {
        const date = dateInput.toDate();
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        console.error("Error formatting Firebase Timestamp:", e);
        return "Invalid date";
      }
    }
    
    if (typeof dateInput === 'number') {
      try {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
      } catch (e) {
        console.error("Error formatting timestamp:", e);
      }
    }
    
    return "Unknown format";
  };

  const parseDateToYYYYMMDD = (dateInput: any): string => {
    if (!dateInput) return "";
    
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
      const [day, month, year] = dateInput.split('/');
      return `${year}-${month}-${day}`;
    }
    
    let date: Date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
      date = dateInput.toDate();
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      try {
        date = new Date(dateInput);
      } catch (e) {
        console.error("Cannot parse date:", dateInput);
        return "";
      }
    }
    
    if (isNaN(date.getTime())) {
      return "";
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#666');
    }
    
    return () => {
      StatusBar.setBarStyle('default');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
      }
    };
  }, []);

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
          const data = snap.data() as UserProfile;
          setProfile(data);
          
          let initialDate = new Date();
          let dateOfBirthString = "";
          
          if (data.dateOfBirth) {
            dateOfBirthString = parseDateToYYYYMMDD(data.dateOfBirth);
            
            if (dateOfBirthString) {
              const [year, month, day] = dateOfBirthString.split('-').map(Number);
              initialDate = new Date(year, month - 1, day);
            }
          }
          
          setSelectedDate(initialDate);
          
          setForm({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            dateOfBirth: dateOfBirthString,
            address: {
              street: data.address?.street || "",
              city: data.address?.city || "",
              country: data.address?.country || "",
            },
            goals: data.goals?.join(", ") || "",
            sessionsPerWeek: data.sessionsPerWeek || "",
            coachingPreference: data.coachingPreference || "",
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* ---------- SCROLL HANDLERS ---------- */

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    const paddingToBottom = 50;
    const isBottomReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsAtBottom(isBottomReached);
    
    const SCROLL_THRESHOLD = 5;
    
    if (isBottomReached) {
      if (!isFooterVisible) {
        showFooter();
      }
    } else if (Math.abs(scrollDelta) > SCROLL_THRESHOLD) {
      if (scrollDelta > 0 && currentScrollY > 50) {
        if (isFooterVisible) {
          hideFooter();
        }
      } else if (scrollDelta < 0) {
        if (!isFooterVisible) {
          showFooter();
        }
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  const hideFooter = () => {
    setIsFooterVisible(false);
    Animated.timing(footerAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const showFooter = () => {
    setIsFooterVisible(true);
    Animated.timing(footerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  /* ---------- DATE HANDLERS ---------- */

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setForm({ ...form, dateOfBirth: formattedDate });
    }
  };

  const openDatePicker = () => {
    setShowCoachingPicker(false);
    setShowSessionsPicker(false);
    setShowDatePicker(true);
  };

  /* ---------- HANDLERS ---------- */

  const startEditing = () => {
    setEditing(true);
    showFooter();
  };

  const cancelEditing = () => {
    if (profile) {
      const dateOfBirthString = parseDateToYYYYMMDD(profile.dateOfBirth);
      
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        dateOfBirth: dateOfBirthString,
        address: {
          street: profile.address?.street || "",
          city: profile.address?.city || "",
          country: profile.address?.country || "",
        },
        goals: profile.goals?.join(", ") || "",
        sessionsPerWeek: profile.sessionsPerWeek || "",
        coachingPreference: profile.coachingPreference || "",
      });
      
      if (dateOfBirthString) {
        const [year, month, day] = dateOfBirthString.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, day));
      }
    }
    setShowSessionsPicker(false);
    setShowCoachingPicker(false);
    setShowDatePicker(false);
    setEditing(false);
  };

  const selectSession = (session: string) => {
    setForm({ ...form, sessionsPerWeek: session });
    setShowSessionsPicker(false);
  };

  const selectCoaching = (preference: string) => {
    setForm({ ...form, coachingPreference: preference });
    setShowCoachingPicker(false);
  };

  const saveChanges = async () => {
    if (!user || !profile) return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return;
    }

    setSaving(true);

    try {
      const goalsArray = form.goals
        .split(",")
        .map(goal => goal.trim())
        .filter(goal => goal.length > 0);

      const updatedData: Partial<UserProfile> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        address: {
          street: form.address.street.trim(),
          city: form.address.city.trim(),
          country: form.address.country.trim(),
        },
        goals: goalsArray,
        sessionsPerWeek: form.sessionsPerWeek.trim(),
        coachingPreference: form.coachingPreference.trim(),
      };

      await updateDoc(doc(db, "users", user.uid), updatedData);
      
      setProfile({
        ...profile,
        ...updatedData
      });

      Alert.alert("Success", "Profile updated successfully");
      setEditing(false);
      setShowSessionsPicker(false);
      setShowCoachingPicker(false);
      setShowDatePicker(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.statusBarBackground} />
        <View style={styles.center}>
          <Text>No profile data found.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.footerButton, styles.logoutButton]}
            onPress={confirmLogout}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- COMPONENTS ---------- */

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>My profile</Text>
      {!editing ? (
        <Pressable style={styles.editButton} onPress={startEditing}>
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const renderPersonalInfo = () => {
    if (editing) {
      return (
        <Section title="Personal information">
          <EditableItem
            label="First name *"
            value={form.firstName}
            onChange={(text) => setForm({...form, firstName: text})}
            placeholder="Enter first name"
          />
          <EditableItem
            label="Last name *"
            value={form.lastName}
            onChange={(text) => setForm({...form, lastName: text})}
            placeholder="Enter last name"
          />
          
          <View style={styles.item}>
            <Text style={styles.itemLabel}>Date of birth</Text>
            <Pressable
              style={styles.selectButton}
              onPress={openDatePicker}
            >
              <Text style={styles.selectButtonText}>
                {form.dateOfBirth 
                  ? safeFormatDate(form.dateOfBirth)
                  : "Select date"}
              </Text>
            </Pressable>
          </View>
          
          <Item label="Account type" value={profile.userType} />
          <Item label="Email" value={profile.email} />
        </Section>
      );
    }

    return (
      <Section title="Personal information">
        <Item label="Account type" value={profile.userType} />
        <Item label="First name" value={profile.firstName} />
        <Item label="Last name" value={profile.lastName} />
        <Item label="Date of birth" value={safeFormatDate(profile.dateOfBirth)} />
        <Item label="Email" value={profile.email} />
      </Section>
    );
  };

  const renderAddress = () => {
    if (editing) {
      return (
        <Section title="Address">
          <EditableItem
            label="Street"
            value={form.address.street}
            onChange={(text) => setForm({
              ...form, 
              address: {...form.address, street: text}
            })}
            placeholder="Enter street"
          />
          <EditableItem
            label="City"
            value={form.address.city}
            onChange={(text) => setForm({
              ...form, 
              address: {...form.address, city: text}
            })}
            placeholder="Enter city"
          />
          <EditableItem
            label="Country"
            value={form.address.country}
            onChange={(text) => setForm({
              ...form, 
              address: {...form.address, country: text}
            })}
            placeholder="Enter country"
          />
        </Section>
      );
    }

    return (
      <Section title="Address">
        <Item label="Street" value={profile.address.street} />
        <Item label="City" value={profile.address.city} />
        <Item label="Country" value={profile.address.country} />
      </Section>
    );
  };

  const renderGoals = () => {
    if (editing) {
      return (
        <Section title="Training goals">
          <View style={styles.textAreaContainer}>
            <Text style={styles.itemLabel}>Goals (separate by commas)</Text>
            <TextInput
              style={[styles.textArea, editing && styles.editingInput]}
              value={form.goals}
              onChangeText={(text) => setForm({...form, goals: text})}
              placeholder="e.g., Weight loss, Muscle gain, Improve endurance"
              multiline
              numberOfLines={3}
              editable={editing}
            />
          </View>
        </Section>
      );
    }

    return (
      <Section title="Training goals">
        {profile.goals.map((goal, index) => (
          <Text key={index} style={styles.listItem}>
            • {goal}
          </Text>
        ))}
      </Section>
    );
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Select date of birth</Text>
          
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            textColor="#000"
            style={styles.datePicker}
          />
          
          {Platform.OS === 'ios' && (
            <View style={styles.iosButtons}>
              <Pressable
                style={[styles.iosButton, styles.iosCancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.iosCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.iosButton, styles.iosConfirmButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.iosConfirmButtonText}>Confirm</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSessionsPicker = () => {
    if (!showSessionsPicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Select sessions per week</Text>
          {SESSIONS_OPTIONS.map((session) => (
            <Pressable
              key={session}
              style={[
                styles.pickerOption,
                form.sessionsPerWeek === session && styles.pickerOptionSelected
              ]}
              onPress={() => selectSession(session)}
            >
              <Text style={[
                styles.pickerOptionText,
                form.sessionsPerWeek === session && styles.pickerOptionTextSelected
              ]}>
                {session} time{parseInt(session) > 1 ? 's' : ''} per week
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.pickerOption, styles.pickerCancel]}
            onPress={() => setShowSessionsPicker(false)}
          >
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderCoachingPicker = () => {
    if (!showCoachingPicker) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Select coaching preference</Text>
          {COACHING_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.pickerOption,
                form.coachingPreference === option && styles.pickerOptionSelected
              ]}
              onPress={() => selectCoaching(option)}
            >
              <Text style={[
                styles.pickerOptionText,
                form.coachingPreference === option && styles.pickerOptionTextSelected
              ]}>
                {option}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.pickerOption, styles.pickerCancel]}
            onPress={() => setShowCoachingPicker(false)}
          >
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderPreferences = () => {
    if (editing) {
      return (
        <Section title="Preferences">
          <View style={styles.item}>
            <Text style={styles.itemLabel}>Sessions per week</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => {
                setShowCoachingPicker(false);
                setShowDatePicker(false);
                setShowSessionsPicker(true);
              }}
            >
              <Text style={styles.selectButtonText}>
                {form.sessionsPerWeek 
                  ? `${form.sessionsPerWeek} time${parseInt(form.sessionsPerWeek) > 1 ? 's' : ''} per week`
                  : "Select sessions"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.item}>
            <Text style={styles.itemLabel}>Coaching preference</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => {
                setShowSessionsPicker(false);
                setShowDatePicker(false);
                setShowCoachingPicker(true);
              }}
            >
              <Text style={styles.selectButtonText}>
                {form.coachingPreference || "Select preference"}
              </Text>
            </Pressable>
          </View>
        </Section>
      );
    }

    return (
      <Section title="Preferences">
        <Item
          label="Sessions per week"
          value={profile.sessionsPerWeek 
            ? `${profile.sessionsPerWeek} time${parseInt(profile.sessionsPerWeek) > 1 ? 's' : ''} per week`
            : "Not set"
          }
        />
        <Item
          label="Coaching preference"
          value={profile.coachingPreference || "Not set"}
        />
      </Section>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 80 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          {renderHeader()}
          {renderPersonalInfo()}
          {renderAddress()}
          {renderGoals()}
          {renderPreferences()}
        </ScrollView>
      </KeyboardAvoidingView>

      {renderDatePicker()}
      {renderSessionsPicker()}
      {renderCoachingPicker()}

      <Animated.View 
        style={[
          styles.footer,
          {
            transform: [{
              translateY: footerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 100]
              })
            }],
            opacity: footerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            })
          }
        ]}
      >
        {editing ? (
          <View style={styles.editActions}>
            <Pressable 
              style={[styles.footerButton, styles.cancelButton]} 
              onPress={cancelEditing}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.footerButton, styles.saveButton]} 
              onPress={saveChanges}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.footerButton, styles.logoutButton]}
            onPress={confirmLogout}
          >
            <Text style={styles.logoutText}>
              Log out
            </Text>
          </Pressable>
        )}
      </Animated.View>
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

function EditableItem({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <TextInput
        style={styles.editableInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
      />
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    backgroundColor: '#666',
    zIndex: 1000,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    width: '100%',
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
    marginBottom: 12,
  },
  itemLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  editableInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    paddingVertical: 6,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#000",
  },
  textAreaContainer: {
    marginBottom: 8,
  },
  textArea: {
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#FAFAFA",
  },
  editingInput: {
    borderColor: "#007AFF",
    backgroundColor: "#FFF",
  },
  listItem: {
    fontSize: 16,
    color: "#000",
    marginBottom: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: Platform.OS === 'ios' ? 0 : 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: Platform.OS === 'ios' ? 350 : 'auto',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 0,
  },
  datePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 150,
  },
  iosButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    padding: 10,
  },
  iosButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  iosCancelButton: {
    backgroundColor: '#F0F0F0',
  },
  iosConfirmButton: {
    backgroundColor: '#007AFF',
  },
  iosCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  iosConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#F9F9F9",
  },
  pickerOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  pickerOptionTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  pickerCancel: {
    marginTop: 20,
    backgroundColor: "#F0F0F0",
    borderColor: "#DDD",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  footerButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#E53935",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
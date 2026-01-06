import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons"; // Pour les icônes
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- TYPES ---------- */

type CoachingMode = "remote" | "in-person" | "no-preference";

interface CoachService {
  id?: string; // ID du document Firestore
  sport: string;
  coachingMode: CoachingMode;
  price: string;
  coachId: string;
  dateTime?: Date; // Date et heure du cours
  duration: number; // Durée en minutes
  createdAt?: Date;
}

/* ---------- SCREEN ---------- */

export default function CoachServicesScreen() {
  const { user } = useAuth();

  const [services, setServices] = useState<CoachService[]>([]);
  const [editingService, setEditingService] = useState<CoachService | null>(null);
  
  const [sport, setSport] = useState("");
  const [coachingMode, setCoachingMode] = useState<CoachingMode>("remote");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60"); // Durée par défaut 60 minutes
  const [date, setDate] = useState(new Date()); // Date par défaut aujourd'hui
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /* ---------- LOAD EXISTING SERVICES ---------- */

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;

    try {
      const servicesRef = collection(db, "services");
      const q = query(
        servicesRef, 
        where("coachId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const servicesList: CoachService[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        servicesList.push({
          id: doc.id,
          sport: data.sport || "",
          coachingMode: data.coachingMode || "remote",
          price: data.price || "",
          duration: data.duration || 60,
          dateTime: data.dateTime?.toDate(),
          coachId: data.coachId,
          createdAt: data.createdAt?.toDate(),
        } as CoachService);
      });
      
      setServices(servicesList);
    } catch (error) {
      console.error("Error loading services:", error);
      Alert.alert("Error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- DATE/TIME HANDLERS ---------- */

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Garder l'heure actuelle, changer seulement la date
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Garder la date actuelle, changer seulement l'heure
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDateTime = (date: Date) => {
    const optionsDate: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    const optionsTime: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    return {
      date: date.toLocaleDateString('fr-FR', optionsDate),
      time: date.toLocaleTimeString('fr-FR', optionsTime)
    };
  };

  const getDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
  };

  /* ---------- SAVE/UPDATE SERVICE ---------- */

  const handleSave = async () => {
    if (!sport || !price || !duration) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (isNaN(Number(price))) {
      Alert.alert("Error", "Price must be a number");
      return;
    }

    if (isNaN(Number(duration)) || Number(duration) <= 0) {
      Alert.alert("Error", "Duration must be a positive number");
      return;
    }

    if (!user) return;

    try {
      setSaving(true);

      const serviceData = {
        coachId: user.uid,
        sport,
        coachingMode,
        price,
        duration: Number(duration),
        dateTime: date,
        updatedAt: new Date(),
      };

      if (isEditing && editingService?.id) {
        // Update existing service
        await setDoc(
          doc(db, "services", editingService.id),
          serviceData,
          { merge: true }
        );
        Alert.alert("Success", "Service updated");
      } else {
        // Create new service
        const newDocRef = doc(collection(db, "services"));
        await setDoc(newDocRef, {
          ...serviceData,
          createdAt: new Date(),
        });
        Alert.alert("Success", "Service added");
      }

      // Reset form
      resetForm();
      // Refresh list
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      Alert.alert("Error", "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- DELETE SERVICE ---------- */

  const handleDelete = async (serviceId: string) => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "services", serviceId));
              Alert.alert("Success", "Service deleted");
              fetchServices();
            } catch (error) {
              console.error("Error deleting service:", error);
              Alert.alert("Error", "Failed to delete service");
            }
          },
        },
      ]
    );
  };

  /* ---------- EDIT SERVICE ---------- */

  const handleEdit = (service: CoachService) => {
    setSport(service.sport);
    setCoachingMode(service.coachingMode);
    setPrice(service.price);
    setDuration(service.duration.toString());
    if (service.dateTime) {
      setDate(new Date(service.dateTime));
    } else {
      setDate(new Date());
    }
    setEditingService(service);
    setIsEditing(true);
  };

  const resetForm = () => {
    setSport("");
    setCoachingMode("remote");
    setPrice("");
    setDuration("60");
    setDate(new Date());
    setEditingService(null);
    setIsEditing(false);
  };

  /* ---------- RENDER SERVICE ITEM ---------- */

  const renderServiceItem = ({ item }: { item: CoachService }) => {
    const { date: formattedDate, time: formattedTime } = item.dateTime 
      ? formatDateTime(new Date(item.dateTime))
      : { date: "Date non définie", time: "" };
    
    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceSport}>{item.sport}</Text>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceMode}>
              {item.coachingMode === "remote" && "Remote"}
              {item.coachingMode === "in-person" && "In Person"}
              {item.coachingMode === "no-preference" && "No Preference"}
            </Text>
            <Text style={styles.servicePrice}>{item.price} €</Text>
          </View>
          <View style={styles.datetimeContainer}>
            <View style={styles.datetimeItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.datetimeText}>{formattedDate}</Text>
            </View>
            <View style={styles.datetimeItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.datetimeText}>{formattedTime}</Text>
            </View>
            <View style={styles.datetimeItem}>
              <Ionicons name="timer-outline" size={14} color="#666" />
              <Text style={styles.datetimeText}>{getDurationText(item.duration)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.serviceActions}>
          <Pressable 
            onPress={() => handleEdit(item)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </Pressable>
          <Pressable 
            onPress={() => item.id && handleDelete(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
          </Pressable>
        </View>
      </View>
    );
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
      <ScrollView style={styles.container}>
        <Text style={styles.title}>
          {isEditing ? "Edit Service" : "My Services"}
        </Text>

        {/* FORM */}
        <View style={styles.form}>
          <Text style={styles.label}>Sport / Practice</Text>
          <TextInput
            value={sport}
            onChangeText={setSport}
            placeholder="Yoga, Fitness, Cardio…"
            style={styles.input}
          />

          <Text style={styles.label}>Coaching mode</Text>
          {[
            { label: "Remote", value: "remote" },
            { label: "In person", value: "in-person" },
            { label: "No preference", value: "no-preference" },
          ].map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setCoachingMode(item.value as CoachingMode)}
              style={[
                styles.option,
                coachingMode === item.value && styles.optionSelected,
              ]}
            >
              <Text style={styles.optionText}>{item.label}</Text>
            </Pressable>
          ))}

          <Text style={styles.label}>Price (€)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="50"
            style={styles.input}
          />

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="60"
            style={styles.input}
          />

          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.datetimeSelection}>
            <Pressable 
              style={styles.datetimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.datetimeButtonText}>
                {formatDateTime(date).date}
              </Text>
            </Pressable>
            
            <Pressable 
              style={styles.datetimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.datetimeButtonText}>
                {formatDateTime(date).time}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={onChangeTime}
            />
          )}

          <View style={styles.formButtons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={resetForm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving 
                  ? "Saving…" 
                  : isEditing 
                    ? "Update Service" 
                    : "Add Service"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* SERVICES LIST */}
        <Text style={styles.sectionTitle}>
          My Services ({services.length})
        </Text>
        
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basketball-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No services yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first service above
            </Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id!}
            scrollEnabled={false}
            style={styles.list}
          />
        )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 30,
    marginBottom: 15,
    color: "#000",
  },
  form: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
    color: "#000",
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#000",
  },
  option: {
    backgroundColor: "#F8F8F8",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
  datetimeSelection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  datetimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  datetimeButtonText: {
    fontSize: 16,
    color: "#000",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  serviceCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceSport: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  serviceDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceMode: {
    fontSize: 14,
    color: "#666",
    marginRight: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  datetimeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  datetimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  datetimeText: {
    fontSize: 12,
    color: "#666",
  },
  serviceActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButton: {
    padding: 8,
  },
  list: {
    marginBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
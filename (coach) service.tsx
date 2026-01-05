import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons"; // Pour les icônes
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
        servicesList.push({
          id: doc.id,
          ...doc.data()
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

  /* ---------- SAVE/UPDATE SERVICE ---------- */

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

      const serviceData = {
        coachId: user.uid,
        sport,
        coachingMode,
        price,
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
    setEditingService(service);
    setIsEditing(true);
  };

  const resetForm = () => {
    setSport("");
    setCoachingMode("remote");
    setPrice("");
    setEditingService(null);
    setIsEditing(false);
  };

  /* ---------- RENDER SERVICE ITEM ---------- */

  const renderServiceItem = ({ item }: { item: CoachService }) => (
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
      </View>
      <View style={styles.serviceActions}>
        <Pressable 
          onPress={() => handleEdit(item)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </Pressable>
        <Pressable 
          onPress={() => handleDelete(item.id!)}
          style={styles.actionButton}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </Pressable>
      </View>
    </View>
  );

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
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
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
    marginBottom: 4,
  },
  serviceDetails: {
    flexDirection: "row",
    alignItems: "center",
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
  serviceActions: {
    flexDirection: "row",
    gap: 12,
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

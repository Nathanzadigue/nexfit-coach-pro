import { db } from "@/src/firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- TYPES ---------- */

type Service = {
  coachId: string;
  sport: string;
  coachingMode: string;
  price: string;
  dateTime?: any;
  duration?: number;
};

type CoachProfile = {
  firstName: string;
  lastName: string;
  userType: string;
  goals?: string[];
  address?: {
    street: string;
    city: string;
    country: string;
  };
  sessionsPerWeek?: string;
  coachingPreference?: string;
};

/* ---------- UTILITY FUNCTIONS ---------- */

const parseDateToYYYYMMDD = (dateInput: any): string => {
  if (!dateInput) return "";

  // Si c'est un timestamp Firestore
  if (dateInput.toDate) {
    const date = dateInput.toDate();
    return date.toISOString().split('T')[0];
  }

  // Si c'est un objet Date
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }

  // Si c'est déjà une string
  if (typeof dateInput === 'string') {
    return dateInput;
  }

  return "";
};

const formatDate = (date?: Date) => {
  if (!date) return "À définir";
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short',
  };
  return date.toLocaleDateString('fr-FR', options);
};

const formatTime = (date?: Date) => {
  if (!date) return "";
  
  const options: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleTimeString('fr-FR', options);
};

const getDurationText = (minutes?: number) => {
  if (!minutes) return "60 min";
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

const getCoachingModeText = (mode: string) => {
  switch (mode) {
    case "remote": return "📍 À distance";
    case "in-person": return "👤 En présentiel";
    case "no-preference": return "🤷 Flexible";
    default: return mode;
  }
};

/* ---------- SCREEN ---------- */

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [service, setService] = useState<Service | null>(null);
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  /* ---------- FETCH SERVICE + COACH ---------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        // Récupérer le service
        const serviceRef = doc(db, "services", id);
        const serviceSnap = await getDoc(serviceRef);

        if (!serviceSnap.exists()) {
          setLoading(false);
          return;
        }

        const serviceData = serviceSnap.data() as Service;
        setService(serviceData);

        // Récupérer le profil complet du coach
        const coachRef = doc(db, "users", serviceData.coachId);
        const coachSnap = await getDoc(coachRef);

        if (coachSnap.exists()) {
          const coachData = coachSnap.data() as CoachProfile;
          
          // Formater la date de naissance si elle existe
          let formattedCoachData = { ...coachData };
          if (coachData.address) {
            // Ne garder que la ville et le pays
            formattedCoachData = {
              ...coachData,
              address: {
                street: "", // Supprimer la rue
                city: coachData.address.city || "",
                country: coachData.address.country || ""
              }
            };
          }
          
          setCoach(formattedCoachData);
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.statusBarBackground} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!service || !coach) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.statusBarBackground} />
        <View style={styles.center}>
          <Text>Service not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- COACH ---------- */}
        <View style={styles.coachBlock}>
          <Text style={styles.coachName}>
            {coach.firstName} {coach.lastName}
          </Text>
          <Text style={styles.role}>
            Professional coach
          </Text>
        </View>

        {/* ---------- SERVICE DETAILS ---------- */}
        <View style={styles.card}>
          <Text style={styles.sport}>{service.sport}</Text>
          
          {/* Prix et mode de coaching sur la même ligne */}
          <View style={styles.priceModeRow}>
            <Text style={styles.price}>
              {service.price} €
            </Text>
            <View style={styles.modeTag}>
              <Text style={styles.modeTagText}>
                {getCoachingModeText(service.coachingMode)}
              </Text>
            </View>
          </View>

          {/* Date, Heure et Durée */}
          {service.dateTime ? (
            <View style={styles.datetimeContainer}>
              <View style={styles.datetimeRow}>
                <View style={styles.datetimeItem}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.datetimeText}>
                    {formatDate(service.dateTime?.toDate())}
                  </Text>
                </View>
                
                <View style={styles.datetimeItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.datetimeText}>
                    {formatTime(service.dateTime?.toDate())}
                  </Text>
                </View>
                
                <View style={styles.datetimeItem}>
                  <Ionicons name="timer-outline" size={16} color="#666" />
                  <Text style={styles.datetimeText}>
                    {getDurationText(service.duration)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDateTimeContainer}>
              <Ionicons name="warning-outline" size={14} color="#FB8C00" />
              <Text style={styles.noDateTimeText}>
                Date et heure à définir avec le coach
              </Text>
            </View>
          )}
        </View>

        {/* ---------- COACH DETAILS ---------- */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            About the coach
          </Text>

          {/* Spécialités */}
          {coach.goals && coach.goals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subtitle}>Specialties</Text>
              {coach.goals.map((goal) => (
                <Text key={goal} style={styles.item}>
                  • {goal}
                </Text>
              ))}
            </View>
          )}

          {/* Sessions par semaine */}
          {coach.sessionsPerWeek && (
            <View style={styles.section}>
              <Text style={styles.subtitle}>Weekly availability</Text>
              <Text style={styles.item}>
                {coach.sessionsPerWeek} sessions per week
              </Text>
            </View>
          )}

          {/* Préférence de coaching */}
          {coach.coachingPreference && (
            <View style={styles.section}>
              <Text style={styles.subtitle}>Coaching style</Text>
              <Text style={styles.item}>
                {coach.coachingPreference}
              </Text>
            </View>
          )}

          {/* Ville et Pays seulement */}
          {coach.address && coach.address.city && (
            <View style={styles.section}>
              <Text style={styles.subtitle}>Location</Text>
              <Text style={styles.item}>
                {coach.address.city}
                {coach.address.country ? `, ${coach.address.country}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ---------- ACTIONS ---------- */}
        <View style={styles.actionsContainer}>
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
        </View>
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
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    backgroundColor: '#666',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 0,
  },
  coachBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  coachName: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    color: "#000",
  },
  role: {
    fontSize: 15,
    color: "#555",
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
    marginBottom: 12,
    color: "#000",
  },
  priceModeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modeTag: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeTagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  datetimeContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  datetimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  datetimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  datetimeText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  noDateTimeContainer: {
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFEAA7",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noDateTimeText: {
    fontSize: 14,
    color: "#856404",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  section: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  item: {
    fontSize: 15,
    color: "#000",
    marginBottom: 4,
  },
  actionsContainer: {
    marginBottom: 24,
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
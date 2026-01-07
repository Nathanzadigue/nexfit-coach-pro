import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- TYPES ---------- */

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  read: boolean;
  createdAt: any;
  data?: {
    bookingId?: string;
    sport?: string;
    price?: string;
    clientId?: string;
    clientEmail?: string;
    date?: string;
    time?: string;
  };
};

/* ---------- SCREEN ---------- */

export default function CoachHomeScreen() {
  const { user } = useAuth();

  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  /* ---------- FETCH PENDING BOOKINGS ---------- */
  useEffect(() => {
    if (!user) return;

    const fetchPendingBookings = async () => {
      try {
        const q = query(
          collection(db, "bookings"),
          where("coachId", "==", user.uid),
          where("status", "==", "pending")
        );

        const snap = await getDocs(q);
        setPendingCount(snap.size);
      } catch (error) {
        console.error("Error loading pending bookings:", error);
      }
    };

    fetchPendingBookings();

    // Listen to notifications in real time
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList: Notification[] = [];
      let unread = 0;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notificationsList.push({
          id: docSnap.id,
          ...data,
        } as Notification);
        
        if (!data.read) unread++;
      });
      
      setNotifications(notificationsList);
      setUnreadCount(unread);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Reload data
    if (user) {
      const q = query(
        collection(db, "bookings"),
        where("coachId", "==", user.uid),
        where("status", "==", "pending")
      );

      getDocs(q).then((snap) => {
        setPendingCount(snap.size);
        setRefreshing(false);
      });
    }
  };

  /* ---------- MARK NOTIFICATION AS READ ---------- */

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  /* ---------- MARK ALL AS READ ---------- */

  const markAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(n => !n.read)
        .map(n => updateDoc(doc(db, "notifications", n.id), { read: true }));
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  /* ---------- HANDLE NOTIFICATION PRESS ---------- */

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate according to notification type
    if (notification.type === "payment_received") {
      // Redirect to corresponding booking
      router.navigate("/(coach)/planning");
    } else if (notification.type === "new_booking") {
      // Redirect to booking requests
      router.navigate("/(coach)/planning-request");
    } else if (notification.type === "client_message") {
      // Redirect to messages
      router.navigate("/(coach)/messages");
    }
  };

  /* ---------- FORMAT DATE ---------- */

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} h ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return "Recently";
    }
  };

  /* ---------- RENDER NOTIFICATION ITEM ---------- */

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        {item.type === "payment_received" ? (
          <Ionicons name="cash" size={24} color="#2E7D32" />
        ) : item.type === "new_booking" ? (
          <Ionicons name="calendar" size={24} color="#007AFF" />
        ) : item.type === "client_message" ? (
          <Ionicons name="chatbubble" size={24} color="#FF9800" />
        ) : (
          <Ionicons name="notifications" size={24} color="#666" />
        )}
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        {item.type === "payment_received" && item.data && (
          <View style={styles.paymentDetails}>
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Amount:</Text>
              <Text style={styles.paymentDetailValue}>{item.data.price} €</Text>
            </View>
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Session:</Text>
              <Text style={styles.paymentDetailValue}>{item.data.sport}</Text>
            </View>
          </View>
        )}
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );

  /* ---------- STATISTICS ---------- */

  const getPaidBookingsCount = () => {
    return notifications.filter(n => n.type === "payment_received").length;
  };

  const getNewBookingsCount = () => {
    return notifications.filter(n => n.type === "new_booking" && !n.read).length;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: "#666" }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Coach</Text>
          </View>
          
          {unreadCount > 0 && (
            <Pressable 
              style={styles.notificationBadge}
              onPress={markAllAsRead}
            >
              <Ionicons name="notifications" size={22} color="#000" />
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* STATISTICS CARDS */}
        <View style={styles.statsContainer}>
          <Pressable 
            style={styles.statCard}
            onPress={() => router.navigate("/(coach)/planning-request")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#FFF3CD" }]}>
              <Ionicons name="time-outline" size={24} color="#FB8C00" />
            </View>
            <Text style={styles.statCount}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Pressable>
          
          <Pressable 
            style={styles.statCard}
            onPress={() => router.navigate("/(coach)/planning")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="cash-outline" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.statCount}>{getPaidBookingsCount()}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </Pressable>
          
          <Pressable 
            style={styles.statCard}
            onPress={() => router.navigate("/(coach)/messages")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="chatbubble-outline" size={24} color="#1976D2" />
            </View>
            <Text style={styles.statCount}>{getNewBookingsCount()}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </Pressable>
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.length > 0 && unreadCount > 0 && (
            <Pressable onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyNotifications}>
            <Ionicons name="notifications-off-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              Notifications about your bookings and payments will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications.slice(0, 5)} // Show only first 5
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.notificationsList}
            showsVerticalScrollIndicator={true}
            indicatorStyle="black"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        {/* SUPPRIMÉ: QUICK ACTIONS SECTION */}
        {/* SUPPRIMÉ: INFO CARD SECTION */}
      </View>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  screen: {
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  notificationBadge: {
    position: "relative",
    padding: 8,
  },
  badgeDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statCount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  markAllText: {
    fontSize: 12,
    color: "#666",
    textDecorationLine: "underline",
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    backgroundColor: "#F8F9FF",
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  paymentDetails: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  paymentDetailValue: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
});
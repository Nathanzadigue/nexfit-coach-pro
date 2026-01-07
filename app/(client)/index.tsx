import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
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
    bookingId: string;
    sport: string;
    price: string;
    coachId: string;
    serviceId: string;
    date: string;
    time: string;
  };
};

type Booking = {
  id: string;
  status: string;
  sport: string;
  price: string;
  date: string;
  time: string;
  sortableDate?: string;
  sortableTime?: string;
};

/* ---------- SCREEN ---------- */

export default function ClientHomeScreen() {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  /* ---------- FETCH NOTIFICATIONS ---------- */

  useEffect(() => {
    if (!user) return;

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
    });

    // Load bookings
    fetchBookings();

    return () => unsubscribe();
  }, [user]);

  /* ---------- FETCH BOOKINGS ---------- */

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("clientId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(bookingsQuery);
      const pending: Booking[] = [];
      const confirmed: Booking[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const booking: Booking = {
          id: docSnap.id,
          status: data.status,
          sport: data.sport,
          price: data.price,
          date: data.date,
          time: data.time,
          sortableDate: data.sortableDate,
          sortableTime: data.sortableTime,
        };

        if (data.status === "pending") {
          pending.push(booking);
        } else if (data.status === "confirmed") {
          confirmed.push(booking);
        }
      });

      setPendingBookings(pending);
      setConfirmedBookings(confirmed);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
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
    if (notification.type === "booking_confirmed" && notification.data) {
      // Redirect to payment screen
      router.push({
        pathname: "/(client)/payment",
        params: {
          bookingId: notification.data.bookingId,
          amount: notification.data.price,
          serviceName: notification.data.sport,
          serviceId: notification.data.serviceId,
          date: notification.data.date,
          time: notification.data.time,
        },
      });
    } else if (notification.type === "booking_declined") {
      // Redirect to bookings
      router.push("/(client)/bookings");
    } else if (notification.type === "payment_confirmed") {
      // Redirect to bookings
      router.push("/(client)/bookings");
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
        {item.type === "booking_confirmed" ? (
          <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
        ) : item.type === "booking_declined" ? (
          <Ionicons name="close-circle" size={24} color="#C62828" />
        ) : item.type === "payment_confirmed" ? (
          <Ionicons name="card" size={24} color="#2E7D32" />
        ) : (
          <Ionicons name="notifications" size={24} color="#FF9800" />
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
        
        {item.type === "booking_confirmed" && (
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Proceed to payment</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" />
          </View>
        )}
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );

  /* ---------- RENDER BOOKING SUMMARY ---------- */

  const renderBookingSummary = () => (
    <View style={styles.bookingsSummary}>
      <Pressable 
        style={styles.summaryCard}
        onPress={() => router.push("/(client)/bookings?status=pending")}
      >
        <Ionicons name="time-outline" size={24} color="#FB8C00" />
        <Text style={styles.summaryCount}>{pendingBookings.length}</Text>
        <Text style={styles.summaryLabel}>Pending</Text>
      </Pressable>
      
      <Pressable 
        style={styles.summaryCard}
        onPress={() => router.push("/(client)/bookings?status=confirmed")}
      >
        <Ionicons name="checkmark-circle-outline" size={24} color="#2E7D32" />
        <Text style={styles.summaryCount}>{confirmedBookings.length}</Text>
        <Text style={styles.summaryLabel}>Confirmed</Text>
      </Pressable>
      
      <Pressable 
        style={styles.summaryCard}
        onPress={() => router.push("/(client)/search")}
      >
        <Ionicons name="add-circle-outline" size={24} color="#000" />
        <Text style={styles.summaryLabel}>New booking</Text>
      </Pressable>
    </View>
  );

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 12, color: "#666" }}>
          Loading your data...
        </Text>
      </View>
    );
  }

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Hello 👋</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          
          <Pressable 
            style={styles.notificationBadge}
            onPress={markAllAsRead}
          >
            <Ionicons name="notifications" size={22} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* BOOKINGS SUMMARY */}
        {renderBookingSummary()}

        {/* NOTIFICATIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
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
              Notifications about your bookings will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
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

        {/* REMOVED: QUICK ACTIONS SECTION */}
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
    paddingHorizontal: 20, // Seulement sur les côtés
    marginTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20, // Ajouté pour l'espacement
    marginBottom: 24,
  },
  welcome: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
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
  bookingsSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginVertical: 8,
  },
  summaryLabel: {
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
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
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
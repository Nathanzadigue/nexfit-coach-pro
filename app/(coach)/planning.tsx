import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import { Ionicons } from "@expo/vector-icons";

/* ---------- TYPES ---------- */

type Booking = {
  id: string;
  date: string;
  time: string;
  sortableDate?: string;
  sortableTime?: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  sport: string;
  coachingMode: string;
  price: string;
  duration?: number;
  clientName?: string;
  clientEmail?: string;
};

type DayGroup = {
  date: string;
  dayName: string;
  dayNumber: string;
  month: string;
  year: string;
  bookings: Booking[];
  isOpen: boolean; // For accordion
};

/* ---------- SCREEN ---------- */

export default function PlanningScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false); // Filter for cancelled sessions

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  /* ---------- FETCH BOOKINGS ---------- */

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const bookingsList: Booking[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        if (data.coachId === user.uid) {
          bookingsList.push({
            id: docSnap.id,
            date: data.date || data.sortableDate || "To be scheduled",
            time: data.time || data.sortableTime || "To be scheduled",
            sortableDate: data.sortableDate || data.date,
            sortableTime: data.sortableTime || data.time,
            status: data.status || "pending",
            sport: data.sport || "Sport not specified",
            coachingMode: data.coachingMode || "no-preference",
            price: data.price || "0",
            duration: data.duration || 60,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
          });
        }
      });

      // Sort by date (most recent first)
      bookingsList.sort((a, b) => {
        const statusOrder = { pending: 0, confirmed: 1, declined: 2, cancelled: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        
        const dateA = a.sortableDate || a.date;
        const dateB = b.sortableDate || b.date;
        
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        
        const timeA = a.sortableTime || a.time;
        const timeB = b.sortableTime || b.time;
        
        return timeA.localeCompare(timeB);
      });

      setBookings(bookingsList);
      
      // Group by day with calendar format
      const groups = groupByDay(bookingsList);
      setDayGroups(groups);
      
    } catch (error) {
      console.error("❌ Error loading planning:", error);
      Alert.alert("Error", "Unable to load your planning");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  /* ---------- GROUP BY DAY ---------- */

  const groupByDay = (bookingsList: Booking[]): DayGroup[] => {
    const groups: Record<string, DayGroup> = {};
    
    bookingsList.forEach((booking) => {
      let dateStr = booking.sortableDate || booking.date;
      
      // If date is "To be scheduled", put in special group
      if (dateStr === "To be scheduled") {
        dateStr = "To be scheduled";
      }
      
      if (!groups[dateStr]) {
        let dayName = "To be scheduled";
        let dayNumber = "";
        let month = "";
        let year = "";
        
        if (dateStr !== "To be scheduled") {
          try {
            // Try to parse date
            let dateObj: Date;
            
            if (dateStr.includes('-')) {
              // Format YYYY-MM-DD
              const [yearStr, monthStr, dayStr] = dateStr.split('-');
              dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
            } else if (dateStr.includes('/')) {
              // Format YYYY/MM/DD
              const [yearStr, monthStr, dayStr] = dateStr.split('/');
              dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
            } else {
              // Try to parse as normal Date
              dateObj = new Date(dateStr);
            }
            
            if (!isNaN(dateObj.getTime())) {
              dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              dayNumber = dateObj.getDate().toString();
              month = dateObj.toLocaleDateString('en-US', { month: 'long' });
              year = dateObj.getFullYear().toString();
            }
          } catch (error) {
            console.log("Date parsing error:", dateStr);
          }
        }
        
        groups[dateStr] = {
          date: dateStr,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          dayNumber,
          month: month.charAt(0).toUpperCase() + month.slice(1),
          year,
          bookings: [],
          isOpen: true // Open by default
        };
      }
      
      groups[dateStr].bookings.push(booking);
    });
    
    // Convert to array and sort by date
    return Object.values(groups).sort((a, b) => {
      if (a.date === "To be scheduled") return 1;
      if (b.date === "To be scheduled") return -1;
      return b.date.localeCompare(a.date);
    });
  };

  /* ---------- TOGGLE DAY ACCORDION ---------- */

  const toggleDay = (date: string) => {
    setDayGroups(prev => 
      prev.map(group => 
        group.date === date 
          ? { ...group, isOpen: !group.isOpen }
          : group
      )
    );
  };

  const expandAllDays = () => {
    setDayGroups(prev => prev.map(group => ({ ...group, isOpen: true })));
  };

  const collapseAllDays = () => {
    setDayGroups(prev => prev.map(group => ({ ...group, isOpen: false })));
  };

  /* ---------- FILTER FUNCTIONS ---------- */

  // Count active sessions (exclude cancelled)
  const countActiveSessions = () => {
    return bookings.filter(b => b.status !== "cancelled").length;
  };

  // Count cancelled sessions
  const countCancelledSessions = () => {
    return bookings.filter(b => b.status === "cancelled").length;
  };

  // Filter sessions according to filter
  const getFilteredBookings = (bookings: Booking[]) => {
    if (showCancelled) {
      return bookings; // Show all
    }
    return bookings.filter(b => b.status !== "cancelled");
  };

  // Count sessions per day (exclude cancelled if filter active)
  const countDaySessions = (bookings: Booking[]) => {
    const filtered = getFilteredBookings(bookings);
    return filtered.length;
  };

  /* ---------- UPDATE STATUS ---------- */

  const updateStatus = async (
    bookingId: string,
    status: "confirmed" | "declined" | "cancelled"
  ) => {
    Alert.alert(
      status === "confirmed" ? "Confirm booking" : 
      status === "declined" ? "Decline booking" : "Cancel booking",
      `Are you sure you want to ${status === "confirmed" ? "accept" : status === "declined" ? "decline" : "cancel"} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "confirmed" ? "Accept" : 
                status === "declined" ? "Decline" : "Cancel",
          style: status === "confirmed" ? "default" : "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "bookings", bookingId), { 
                status,
                updatedAt: new Date()
              });

              // Refresh data
              fetchBookings();
              
              Alert.alert(
                "Success",
                status === "confirmed" 
                  ? "✅ Booking confirmed successfully!" 
                  : status === "declined"
                  ? "❌ Booking declined."
                  : "📝 Booking cancelled."
              );
            } catch (error) {
              console.error("Error updating:", error);
              Alert.alert("Error", "Unable to update booking");
            }
          },
        },
      ]
    );
  };

  /* ---------- HELPER FUNCTIONS ---------- */

  const formatTimeForDisplay = (timeStr: string) => {
    if (timeStr === "To be scheduled") return "To be scheduled";
    
    try {
      if (timeStr.includes(':') && timeStr.split(':').length >= 2) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes}`;
      }
      
      return timeStr;
    } catch {
      return timeStr;
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#FB8C00";
      case "confirmed": return "#2E7D32";
      case "declined": return "#C62828";
      case "cancelled": return "#757575";
      default: return "#000";
    }
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: "Pending",
      confirmed: "Confirmed",
      declined: "Declined",
      cancelled: "Cancelled"
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "time-outline";
      case "confirmed": return "checkmark-circle-outline";
      case "declined": return "close-circle-outline";
      case "cancelled": return "remove-circle-outline";
      default: return "help-circle-outline";
    }
  };

  /* ---------- RENDER DAY GROUP ---------- */

  const renderDayGroup = (group: DayGroup) => {
    const filteredBookings = getFilteredBookings(group.bookings);
    const sessionCount = countDaySessions(group.bookings);
    
    // If no sessions to display (after filtering) and cancelled are hidden
    if (sessionCount === 0 && !showCancelled) {
      return null;
    }

    return (
      <View key={group.date} style={styles.dayGroup}>
        {/* DAY HEADER (CLICKABLE) */}
        <Pressable 
          style={styles.dayHeader}
          onPress={() => toggleDay(group.date)}
        >
          {group.date === "To be scheduled" ? (
            <View style={styles.dateBoxUndefined}>
              <Text style={styles.dayNameUndefined}>{group.dayName}</Text>
            </View>
          ) : (
            <View style={styles.dateBox}>
              <Text style={styles.dayName}>{group.dayName}</Text>
              <Text style={styles.dayNumber}>{group.dayNumber}</Text>
              <Text style={styles.monthYear}>
                {group.month} {group.year}
              </Text>
            </View>
          )}
          
          <View style={styles.dayHeaderRight}>
            <View style={styles.sessionCount}>
              <Text style={styles.sessionCountText}>
                {sessionCount} session{sessionCount > 1 ? 's' : ''}
              </Text>
            </View>
            
            <Ionicons 
              name={group.isOpen ? "chevron-up-outline" : "chevron-down-outline"} 
              size={20} 
              color="#666" 
            />
          </View>
        </Pressable>

        {/* DAY SESSIONS (ACCORDION) */}
        {group.isOpen && filteredBookings.length > 0 && (
          <View style={styles.sessionsContainer}>
            {filteredBookings.map((booking) => (
              <View key={booking.id} style={[
                styles.sessionCard,
                booking.status === "cancelled" && styles.cancelledSession
              ]}>
                {/* TIME AND STATUS */}
                <View style={styles.sessionHeader}>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.timeText}>
                      {formatTimeForDisplay(booking.time)}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) + '20' }
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(booking.status) as any} 
                      size={14} 
                      color={getStatusColor(booking.status)} 
                    />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(booking.status) }
                    ]}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                </View>

                {/* SPORT AND CLIENT */}
                <View style={styles.sessionBody}>
                  <Text style={styles.sportText}>{booking.sport}</Text>
                  
                  <View style={styles.clientRow}>
                    <Ionicons name="person-outline" size={12} color="#666" />
                    <Text style={styles.clientText} numberOfLines={1}>
                      {booking.clientName || booking.clientEmail || "Client"}
                    </Text>
                  </View>
                </View>

                {/* DETAILS */}
                <View style={styles.sessionDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="timer-outline" size={12} color="#666" />
                      <Text style={styles.detailText}>{getDurationText(booking.duration)}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={12} color="#666" />
                      <Text style={styles.detailText}>{booking.price} €</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Ionicons 
                        name={booking.coachingMode === "remote" ? "wifi-outline" : 
                               booking.coachingMode === "in-person" ? "person-outline" : "help-outline"} 
                        size={12} 
                        color="#666" 
                      />
                      <Text style={styles.detailText}>
                        {booking.coachingMode === "remote" ? "Remote" :
                         booking.coachingMode === "in-person" ? "In-person" : "Flexible"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ACTIONS (only for pending and confirmed) */}
                {booking.status === "pending" && (
                  <View style={styles.sessionActions}>
                    <Pressable
                      style={styles.declineButton}
                      onPress={() => updateStatus(booking.id, "declined")}
                    >
                      <Ionicons name="close-circle" size={16} color="#FF3B30" />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </Pressable>

                    <Pressable
                      style={styles.acceptButton}
                      onPress={() => updateStatus(booking.id, "confirmed")}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </Pressable>
                  </View>
                )}

                {booking.status === "confirmed" && (
                  <View style={styles.sessionActions}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => updateStatus(booking.id, "cancelled")}
                    >
                      <Ionicons name="close-circle" size={16} color="#FF3B30" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                )}

                {booking.status === "cancelled" && (
                  <View style={styles.cancelledNotice}>
                    <Ionicons name="information-circle-outline" size={14} color="#757575" />
                    <Text style={styles.cancelledNoticeText}>
                      This session has been cancelled
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* MESSAGE IF NO SESSIONS (after filtering) */}
        {group.isOpen && filteredBookings.length === 0 && (
          <View style={styles.noSessionsMessage}>
            <Ionicons name="calendar-outline" size={24} color="#CCCCCC" />
            <Text style={styles.noSessionsText}>
              No active sessions for this day
            </Text>
          </View>
        )}
      </View>
    );
  };

  /* ---------- RENDER EMPTY ---------- */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>Empty planning</Text>
      <Text style={styles.emptyText}>
        Your bookings will appear here once clients book your services.
      </Text>
    </View>
  );

  /* ---------- RENDER FILTERS ---------- */

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterButtons}>
        <Pressable
          style={[styles.filterButton, !showCancelled && styles.filterButtonActive]}
          onPress={() => setShowCancelled(false)}
        >
          <Ionicons 
            name="eye-outline" 
            size={16} 
            color={!showCancelled ? "#FFF" : "#666"} 
          />
          <Text style={[styles.filterButtonText, !showCancelled && styles.filterButtonTextActive]}>
            Hide cancelled
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterButton, showCancelled && styles.filterButtonActive]}
          onPress={() => setShowCancelled(true)}
        >
          <Ionicons 
            name="eye-off-outline" 
            size={16} 
            color={showCancelled ? "#FFF" : "#666"} 
          />
          <Text style={[styles.filterButtonText, showCancelled && styles.filterButtonTextActive]}>
            Show cancelled
          </Text>
        </Pressable>
      </View>

      <View style={styles.accordionButtons}>
        <Pressable
          style={styles.accordionButton}
          onPress={expandAllDays}
        >
          <Ionicons name="expand-outline" size={16} color="#666" />
          <Text style={styles.accordionButtonText}>Expand all</Text>
        </Pressable>

        <Pressable
          style={styles.accordionButton}
          onPress={collapseAllDays}
        >
          <Ionicons name="contract-outline" size={16} color="#666" />
          <Text style={styles.accordionButtonText}>Collapse all</Text>
        </Pressable>
      </View>
    </View>
  );

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 12, color: "#666" }}>Loading planning...</Text>
      </View>
    );
  }

  /* ---------- MAIN RENDER ---------- */

  const activeSessions = countActiveSessions();
  const cancelledSessions = countCancelledSessions();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>My Planning</Text>
            <Text style={styles.subtitle}>
              {activeSessions} active session{activeSessions !== 1 ? 's' : ''}
              {cancelledSessions > 0 && !showCancelled && ` • ${cancelledSessions} cancelled`}
            </Text>
          </View>
          
          <Pressable onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={22} color="#000" />
          </Pressable>
        </View>

        {bookings.length > 0 && renderFilters()}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {dayGroups.filter(group => {
            const sessionCount = countDaySessions(group.bookings);
            return sessionCount > 0 || showCancelled;
          }).length === 0 ? (
            renderEmpty()
          ) : (
            <>
              {dayGroups
                .filter(group => {
                  const sessionCount = countDaySessions(group.bookings);
                  return sessionCount > 0 || showCancelled;
                })
                .map(renderDayGroup)}
              
              <View style={styles.bottomSpace} />
            </>
          )}
        </ScrollView>
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
    marginTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  
  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  
  /* FILTERS */
  filtersContainer: {
    backgroundColor: "#FFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  filterButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  accordionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  accordionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  accordionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  
  /* MAIN CONTENT */
  scrollContent: { 
    padding: 16,
    paddingBottom: 40,
  },
  
  /* DAY */
  dayGroup: {
    marginBottom: 20,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F9F9F9",
  },
  dayHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateBox: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  dateBoxUndefined: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  dayNameUndefined: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  dayNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  monthYear: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  sessionCount: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionCountText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  
  /* SESSIONS */
  sessionsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  sessionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  cancelledSession: {
    opacity: 0.7,
    backgroundColor: "#FAFAFA",
    borderColor: "#EEE",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  
  /* SESSION BODY */
  sessionBody: {
    marginBottom: 12,
  },
  sportText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clientText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  
  /* DETAILS */
  sessionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  
  /* ACTIONS */
  sessionActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  declineButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 13,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  acceptButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 13,
  },
  
  /* CANCELLED NOTICE */
  cancelledNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  cancelledNoticeText: {
    fontSize: 12,
    color: "#757575",
    fontStyle: "italic",
  },
  
  /* NO SESSIONS MESSAGE */
  noSessionsMessage: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  noSessionsText: {
    fontSize: 14,
    color: "#999",
  },
  
  /* EMPTY STATE */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  
  /* OTHER */
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  bottomSpace: {
    height: 40,
  },
});
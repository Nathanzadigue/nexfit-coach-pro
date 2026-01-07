import { db } from "@/src/firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  GestureResponderEvent,
  Modal,
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

/* ---------- TYPES ---------- */

type ServiceItem = {
  id: string;
  coachId: string;
  sport: string;
  coachingMode: string;
  price: string;
  coachName: string;
  dateTime?: Date;
  duration?: number;
};

type FilterState = {
  coachingMode: 'all' | 'remote' | 'in-person';
  date: Date | null;
  startHour: number;
  endHour: number;
  useTimeFilter: boolean;
};

type SortOption = 'none' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';

/* ---------- SCREEN ---------- */

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filtered, setFiltered] = useState<ServiceItem[]>([]);
  const [sortedServices, setSortedServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    coachingMode: 'all',
    date: null,
    startHour: 6,
    endHour: 22,
    useTimeFilter: false,
  });
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const screenWidth = Dimensions.get('window').width;
  const timeSliderWidth = screenWidth - 80;
  
  // Drag states
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const sliderRef = useRef<View>(null);
  const [sliderX, setSliderX] = useState(0);
  
  // Reference for modal ScrollView
  const modalScrollViewRef = useRef<ScrollView>(null);

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  /* ---------- FETCH SERVICES ---------- */

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snap = await getDocs(collection(db, "services"));
        const list: ServiceItem[] = [];

        for (const serviceDoc of snap.docs) {
          const service = serviceDoc.data();
          const coachSnap = await getDoc(
            doc(db, "users", service.coachId)
          );

          if (!coachSnap.exists()) continue;

          const coach = coachSnap.data();

          list.push({
            id: serviceDoc.id,
            coachId: service.coachId,
            sport: service.sport,
            coachingMode: service.coachingMode,
            price: service.price,
            coachName: `${coach.firstName} ${coach.lastName}`,
            dateTime: service.dateTime?.toDate(),
            duration: service.duration || 60,
          });
        }

        setServices(list);
        setFiltered(list);
        setSortedServices(list);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  /* ---------- APPLY FILTERS ---------- */

  useEffect(() => {
    let results = services;

    // Text filter
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(
        (item) =>
          item.sport.toLowerCase().includes(q) ||
          item.coachingMode.toLowerCase().includes(q) ||
          item.coachName.toLowerCase().includes(q)
      );
    }

    // Coaching mode filter
    if (filters.coachingMode !== 'all') {
      results = results.filter((item) => {
        if (filters.coachingMode === 'remote') {
          return item.coachingMode === 'remote' || item.coachingMode === 'no-preference';
        } else if (filters.coachingMode === 'in-person') {
          return item.coachingMode === 'in-person' || item.coachingMode === 'no-preference';
        }
        return false;
      });
    }

    // Date filter
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0);
      
      results = results.filter((item) => {
        if (!item.dateTime) return false;
        
        const serviceDate = new Date(item.dateTime);
        serviceDate.setHours(0, 0, 0, 0);
        
        return serviceDate.getTime() === selectedDate.getTime();
      });
    }

    // Time range filter (always available)
    if (filters.useTimeFilter && (filters.startHour !== 6 || filters.endHour !== 22)) {
      results = results.filter((item) => {
        if (!item.dateTime) return false;
        
        const serviceTime = new Date(item.dateTime);
        const serviceHours = serviceTime.getHours();
        const serviceMinutes = serviceTime.getMinutes();
        const serviceTotalMinutes = serviceHours * 60 + serviceMinutes;
        
        const startTotalMinutes = filters.startHour * 60;
        const endTotalMinutes = filters.endHour * 60;
        
        return serviceTotalMinutes >= startTotalMinutes && serviceTotalMinutes <= endTotalMinutes;
      });
    }

    setFiltered(results);
  }, [query, services, filters]);

  /* ---------- APPLY SORTING ---------- */

  useEffect(() => {
    let sorted = [...filtered];
    
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'date-asc':
        sorted.sort((a, b) => {
          if (!a.dateTime && !b.dateTime) return 0;
          if (!a.dateTime) return 1;
          if (!b.dateTime) return -1;
          return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        });
        break;
      case 'date-desc':
        sorted.sort((a, b) => {
          if (!a.dateTime && !b.dateTime) return 0;
          if (!a.dateTime) return 1;
          if (!b.dateTime) return -1;
          return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
        });
        break;
      case 'none':
      default:
        // No sorting
        break;
    }
    
    setSortedServices(sorted);
  }, [filtered, sortBy]);

  /* ---------- CALENDAR FUNCTIONS ---------- */

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDay = firstDay.getDay();
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isSelected: filters.date && isSameDay(dayDate, filters.date),
        isToday: isSameDay(dayDate, new Date()),
      });
    }
    
    // Current month days
    const daysInMonth = lastDay.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isSelected: filters.date && isSameDay(dayDate, filters.date),
        isToday: isSameDay(dayDate, new Date()),
      });
    }
    
    // Next month days
    const totalCells = 42; // 6 weeks
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isSelected: filters.date && isSameDay(dayDate, filters.date),
        isToday: isSameDay(dayDate, new Date()),
      });
    }
    
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const handleDayPress = (day: Date) => {
    setFilters({...filters, date: day});
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const clearDateFilter = () => {
    setFilters({...filters, date: null});
  };

  /* ---------- TIME SLIDER FUNCTIONS ---------- */

  const handleSliderLayout = () => {
    if (sliderRef.current) {
      sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
        setSliderX(pageX);
      });
    }
  };

  const handleSliderPress = (event: GestureResponderEvent) => {
    if (!filters.useTimeFilter) return;
    
    const pageX = event.nativeEvent.pageX;
    const relativeX = pageX - sliderX;
    const hour = Math.max(0, Math.min(24, Math.round((relativeX / timeSliderWidth) * 24)));
    
    // Determine which handle is closer
    const startDistance = Math.abs(hour - filters.startHour);
    const endDistance = Math.abs(hour - filters.endHour);
    
    if (startDistance < endDistance && hour < filters.endHour - 1) {
      // Closer to start handle
      setFilters({...filters, startHour: hour});
    } else if (hour > filters.startHour + 1) {
      // Closer to end handle
      setFilters({...filters, endHour: hour});
    }
  };

  const handleHandlePress = (handle: 'start' | 'end') => {
    if (!filters.useTimeFilter) return;
    setDragging(handle);
    
    // Disable modal scroll when starting to drag a handle
    if (modalScrollViewRef.current) {
      modalScrollViewRef.current.setNativeProps({ scrollEnabled: false });
    }
  };

  const handleMoveShouldSetResponder = () => {
    return dragging !== null;
  };

  const handleResponderMove = (event: GestureResponderEvent) => {
    if (!dragging || !filters.useTimeFilter) return;
    
    const pageX = event.nativeEvent.pageX;
    const relativeX = pageX - sliderX;
    const hour = Math.max(0, Math.min(24, Math.round((relativeX / timeSliderWidth) * 24)));
    
    if (dragging === 'start' && hour < filters.endHour - 1) {
      setFilters({...filters, startHour: hour});
    } else if (dragging === 'end' && hour > filters.startHour + 1) {
      setFilters({...filters, endHour: hour});
    }
  };

  const handleResponderRelease = () => {
    setDragging(null);
    
    // Re-enable modal scroll when releasing the handle
    if (modalScrollViewRef.current) {
      modalScrollViewRef.current.setNativeProps({ scrollEnabled: true });
    }
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const clearTimeFilter = () => {
    setFilters({...filters, startHour: 6, endHour: 22, useTimeFilter: false});
  };

  /* ---------- FILTER FUNCTIONS ---------- */

  const clearFilters = () => {
    setFilters({
      coachingMode: 'all',
      date: null,
      startHour: 6,
      endHour: 22,
      useTimeFilter: false,
    });
    setQuery("");
  };

  const hasActiveFilters = () => {
    return filters.coachingMode !== 'all' || 
           filters.date !== null || 
           (filters.useTimeFilter && (filters.startHour !== 6 || filters.endHour !== 22));
  };

  /* ---------- HELPER FUNCTIONS ---------- */

  const formatDate = (date?: Date) => {
    if (!date) return "To be scheduled";
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const formatFilterDate = (date: Date | null) => {
    if (!date) return "Choose a date";
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
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
      case "remote": return "📍 Remote";
      case "in-person": return "👤 In-person";
      case "no-preference": return "🤷 Flexible";
      default: return mode;
    }
  };

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'none': return 'Sort by';
      case 'price-asc': return 'Price (low to high)';
      case 'price-desc': return 'Price (high to low)';
      case 'date-asc': return 'Date (earliest)';
      case 'date-desc': return 'Date (latest)';
      default: return 'Sort by';
    }
  };

  /* ---------- RENDER CALENDAR ---------- */

  const renderCalendar = () => {
    const days = getDaysInMonth(selectedMonth);
    const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={prevMonth} style={styles.calendarNavButton}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
          
          <Text style={styles.calendarMonth}>{monthName}</Text>
          
          <Pressable onPress={nextMonth} style={styles.calendarNavButton}>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </Pressable>
        </View>

        <View style={styles.calendarDayNames}>
          {dayNames.map((dayName, index) => (
            <Text key={index} style={styles.calendarDayName}>
              {dayName}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day, dayIndex) => (
              <Pressable
                key={dayIndex}
                style={[
                  styles.calendarDay,
                  !day.isCurrentMonth && styles.calendarDayOtherMonth,
                  day.isToday && styles.calendarDayToday,
                  day.isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => handleDayPress(day.date)}
                disabled={!day.isCurrentMonth}
              >
                <Text style={[
                  styles.calendarDayText,
                  !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                  day.isToday && styles.calendarDayTextToday,
                  day.isSelected && styles.calendarDayTextSelected,
                ]}>
                  {day.date.getDate()}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    );
  };

  /* ---------- RENDER TIME SLIDER ---------- */

  const renderTimeSlider = () => {
    const startPosition = (filters.startHour / 24) * timeSliderWidth;
    const endPosition = (filters.endHour / 24) * timeSliderWidth;
    const rangeWidth = endPosition - startPosition;

    return (
      <View style={styles.timeSliderContainer}>
        <View style={styles.timeSliderHeader}>
          <Text style={styles.timeSliderTitle}>Time range</Text>
          <View style={styles.timeSwitchContainer}>
            <Text style={styles.timeSwitchLabel}>Enable</Text>
            <Pressable
              style={[
                styles.timeSwitch,
                filters.useTimeFilter && styles.timeSwitchActive
              ]}
              onPress={() => setFilters({...filters, useTimeFilter: !filters.useTimeFilter})}
            >
              <View style={[
                styles.timeSwitchThumb,
                filters.useTimeFilter && styles.timeSwitchThumbActive
              ]} />
            </Pressable>
          </View>
        </View>
        
        <View style={[styles.timeSliderContent, !filters.useTimeFilter && styles.timeSliderDisabled]}>
          {/* REMOVED: Time labels (00:00, 06:00, 12:00, 18:00, 24:00) */}
          
          <View 
            ref={sliderRef}
            style={styles.timeSliderTrack}
            onLayout={handleSliderLayout}
            onStartShouldSetResponder={handleMoveShouldSetResponder}
            onMoveShouldSetResponder={handleMoveShouldSetResponder}
            onResponderMove={handleResponderMove}
            onResponderRelease={handleResponderRelease}
            onResponderTerminate={handleResponderRelease}
          >
            <Pressable
              style={styles.timeSliderBackground}
              onPress={handleSliderPress}
              disabled={!filters.useTimeFilter}
            >
              {/* Selected range */}
              <View 
                style={[
                  styles.timeSliderRange,
                  { 
                    left: startPosition,
                    width: rangeWidth,
                  },
                  !filters.useTimeFilter && styles.timeSliderRangeDisabled
                ]} 
              />
              
              {/* Enlarged touch area for start handle */}
              <View
                style={[
                  styles.timeSliderTouchArea,
                  styles.timeSliderTouchAreaStart,
                  { 
                    left: startPosition - 20, // Enlarged area
                  }
                ]}
                pointerEvents="box-only"
              >
                <Pressable
                  style={[
                    styles.timeSliderHandle,
                    styles.timeSliderHandleStart,
                    { left: 8 }, // Adjusted to be centered in touch area
                  ]}
                  onPressIn={() => handleHandlePress('start')}
                  disabled={!filters.useTimeFilter}
                >
                  <Text style={[
                    styles.timeSliderHandleText,
                    !filters.useTimeFilter && styles.timeSliderHandleTextDisabled
                  ]}>
                    {formatHour(filters.startHour)}
                  </Text>
                </Pressable>
              </View>
              
              {/* Enlarged touch area for end handle */}
              <View
                style={[
                  styles.timeSliderTouchArea,
                  styles.timeSliderTouchAreaEnd,
                  { 
                    left: endPosition - 20, // Enlarged area
                  }
                ]}
                pointerEvents="box-only"
              >
                <Pressable
                  style={[
                    styles.timeSliderHandle,
                    styles.timeSliderHandleEnd,
                    { left: 8 }, // Adjusted to be centered in touch area
                  ]}
                  onPressIn={() => handleHandlePress('end')}
                  disabled={!filters.useTimeFilter}
                >
                  <Text style={[
                    styles.timeSliderHandleText,
                    !filters.useTimeFilter && styles.timeSliderHandleTextDisabled
                  ]}>
                    {formatHour(filters.endHour)}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </View>

          <View style={styles.timeSliderSelected}>
            <Text style={[
              styles.timeSliderSelectedText,
              !filters.useTimeFilter && styles.timeSliderSelectedTextDisabled
            ]}>
              {formatHour(filters.startHour)} - {formatHour(filters.endHour)}
            </Text>
          </View>
          
          {!filters.useTimeFilter && (
            <Text style={styles.timeSliderHint}>
              Enable time filter to show only services within this range
            </Text>
          )}
        </View>
      </View>
    );
  };

  /* ---------- RENDER SORT OPTIONS ---------- */

  const renderSortOptions = () => {
    if (!showSortOptions) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSortOptions}
        onRequestClose={() => setShowSortOptions(false)}
      >
        <Pressable 
          style={styles.sortOverlay}
          onPress={() => setShowSortOptions(false)}
        >
          <View style={styles.sortOptionsContainer}>
            <Pressable
              style={[
                styles.sortOption,
                sortBy === 'none' && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy('none');
                setShowSortOptions(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === 'none' && styles.sortOptionTextActive
              ]}>
                No sorting
              </Text>
              {sortBy === 'none' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
            
            <Pressable
              style={[
                styles.sortOption,
                sortBy === 'price-asc' && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy('price-asc');
                setShowSortOptions(false);
              }}
            >
              <Ionicons name="arrow-up" size={16} color={sortBy === 'price-asc' ? "#000" : "#666"} />
              <Text style={[
                styles.sortOptionText,
                sortBy === 'price-asc' && styles.sortOptionTextActive
              ]}>
                Price (low to high)
              </Text>
              {sortBy === 'price-asc' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
            
            <Pressable
              style={[
                styles.sortOption,
                sortBy === 'price-desc' && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy('price-desc');
                setShowSortOptions(false);
              }}
            >
              <Ionicons name="arrow-down" size={16} color={sortBy === 'price-desc' ? "#000" : "#666"} />
              <Text style={[
                styles.sortOptionText,
                sortBy === 'price-desc' && styles.sortOptionTextActive
              ]}>
                Price (high to low)
              </Text>
              {sortBy === 'price-desc' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
            
            <Pressable
              style={[
                styles.sortOption,
                sortBy === 'date-asc' && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy('date-asc');
                setShowSortOptions(false);
              }}
            >
              <Ionicons name="calendar" size={16} color={sortBy === 'date-asc' ? "#000" : "#666"} />
              <Text style={[
                styles.sortOptionText,
                sortBy === 'date-asc' && styles.sortOptionTextActive
              ]}>
                Date (earliest)
              </Text>
              {sortBy === 'date-asc' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
            
            <Pressable
              style={[
                styles.sortOption,
                sortBy === 'date-desc' && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy('date-desc');
                setShowSortOptions(false);
              }}
            >
              <Ionicons name="calendar" size={16} color={sortBy === 'date-desc' ? "#000" : "#666"} />
              <Text style={[
                styles.sortOptionText,
                sortBy === 'date-desc' && styles.sortOptionTextActive
              ]}>
                Date (latest)
              </Text>
              {sortBy === 'date-desc' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    );
  };

  /* ---------- RENDER FILTERS MODAL ---------- */

  const renderFiltersModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilters}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Filters</Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </Pressable>
          </View>

          <ScrollView 
            ref={modalScrollViewRef}
            style={styles.modalBody}
            scrollEnabled={true}
          >
            {/* Coaching mode */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Coaching Mode</Text>
              <View style={styles.coachingModeButtons}>
                <Pressable
                  style={[
                    styles.coachingModeButton,
                    filters.coachingMode === 'all' && styles.coachingModeButtonActive
                  ]}
                  onPress={() => setFilters({...filters, coachingMode: 'all'})}
                >
                  <Text style={[
                    styles.coachingModeButtonText,
                    filters.coachingMode === 'all' && styles.coachingModeButtonTextActive
                  ]}>
                    All modes
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[
                    styles.coachingModeButton,
                    filters.coachingMode === 'remote' && styles.coachingModeButtonActive
                  ]}
                  onPress={() => setFilters({...filters, coachingMode: 'remote'})}
                >
                  <Ionicons name="wifi-outline" size={16} color={filters.coachingMode === 'remote' ? "#FFF" : "#666"} />
                  <Text style={[
                    styles.coachingModeButtonText,
                    filters.coachingMode === 'remote' && styles.coachingModeButtonTextActive
                  ]}>
                    Remote
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[
                    styles.coachingModeButton,
                    filters.coachingMode === 'in-person' && styles.coachingModeButtonActive
                  ]}
                  onPress={() => setFilters({...filters, coachingMode: 'in-person'})}
                >
                  <Ionicons name="person-outline" size={16} color={filters.coachingMode === 'in-person' ? "#FFF" : "#666"} />
                  <Text style={[
                    styles.coachingModeButtonText,
                    filters.coachingMode === 'in-person' && styles.coachingModeButtonTextActive
                  ]}>
                    In-person
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.filterHint}>
                "Flexible" services appear in both modes
              </Text>
            </View>

            {/* Time range (always visible) - MOVED BEFORE DATE */}
            <View style={styles.filterSection}>
              {renderTimeSlider()}
            </View>

            {/* Calendar - MOVED AFTER TIME RANGE */}
            <View style={styles.filterSection}>
              <View style={styles.dateFilterHeader}>
                <Text style={styles.filterSectionTitle}>Date</Text>
                {filters.date && (
                  <Pressable onPress={clearDateFilter} style={styles.dateClearButton}>
                    <Text style={styles.dateClearButtonText}>Clear</Text>
                  </Pressable>
                )}
              </View>
              
              {filters.date && (
                <View style={styles.selectedDateContainer}>
                  <Ionicons name="calendar" size={18} color="#000" />
                  <Text style={styles.selectedDateText}>
                    {formatFilterDate(filters.date)}
                  </Text>
                </View>
              )}
              
              {renderCalendar()}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={styles.clearAllButton}
              onPress={clearFilters}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
              <Text style={styles.clearAllButtonText}>Clear all</Text>
            </Pressable>
            
            <Pressable
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* ---------- RENDER SERVICE ITEM ---------- */

  const renderServiceItem = ({ item }: { item: ServiceItem }) => {
    const hasDateTime = !!item.dateTime;
    const formattedDate = formatDate(item.dateTime);
    const formattedTime = formatTime(item.dateTime);
    const coachingModeText = getCoachingModeText(item.coachingMode);

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push(`/(client)/service/${item.id}`)
        }
      >
        {/* SPORT AND PRICE IN LINE */}
        <View style={styles.headerRow}>
          <Text style={styles.sport}>
            {item.sport}
          </Text>
          <Text style={styles.price}>
            {item.price} €
          </Text>
        </View>

        {/* COACH */}
        <View style={styles.coachRow}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.coachName}>
            {item.coachName}
          </Text>
        </View>

        {/* DATE AND TIME */}
        {hasDateTime ? (
          <View style={styles.datetimeContainer}>
            <View style={styles.datetimeRow}>
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
        ) : (
          <View style={styles.noDateTimeContainer}>
            <Ionicons name="warning-outline" size={14} color="#FB8C00" />
            <Text style={styles.noDateTimeText}>
              Date and time to be scheduled with coach
            </Text>
          </View>
        )}

        {/* MODE AND BUTTON */}
        <View style={styles.footerRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {coachingModeText}
            </Text>
          </View>
          
          <View style={styles.bookButton}>
            <Text style={styles.bookButtonText}>
              Book
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#000" />
          </View>
        </View>
      </Pressable>
    );
  };

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.statusBarBackground} />
      
      {/* SEARCH HEADER AT VERY TOP */}
      <View style={styles.searchHeader}>
        <Text style={styles.title}>Search Services</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              placeholder="Sport, discipline or coach..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} style={styles.clearSearchButton}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </Pressable>
            ) : null}
          </View>
          
          <Pressable 
            style={[styles.filterButton, hasActiveFilters() && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={hasActiveFilters() ? "#FFF" : "#000"} 
            />
            {hasActiveFilters() && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>!</Text>
              </View>
            )}
          </Pressable>
        </View>
        
        {/* ACTIVE FILTERS */}
        {hasActiveFilters() && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.coachingMode !== 'all' && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {filters.coachingMode === 'remote' ? 'Remote' : 'In-person'}
                  </Text>
                  <Pressable onPress={() => setFilters({...filters, coachingMode: 'all'})}>
                    <Ionicons name="close" size={14} color="#FFF" />
                  </Pressable>
                </View>
              )}
              
              {filters.date && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {formatFilterDate(filters.date)}
                  </Text>
                  <Pressable onPress={() => setFilters({...filters, date: null})}>
                    <Ionicons name="close" size={14} color="#FFF" />
                  </Pressable>
                </View>
              )}
              
              {filters.useTimeFilter && (filters.startHour !== 6 || filters.endHour !== 22) && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterTagText}>
                    {formatHour(filters.startHour)}-{formatHour(filters.endHour)}
                  </Text>
                  <Pressable onPress={clearTimeFilter}>
                    <Ionicons name="close" size={14} color="#FFF" />
                  </Pressable>
                </View>
              )}
              
              <Pressable onPress={clearFilters} style={styles.clearAllFiltersButton}>
                <Text style={styles.clearAllFiltersText}>Clear all</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </View>

      {/* RESULTS SECTION WITH VISIBLE SCROLLBAR */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {sortedServices.length} service{sortedServices.length !== 1 ? 's' : ''} found
          </Text>
          
          <Pressable 
            style={styles.sortButton}
            onPress={() => setShowSortOptions(true)}
          >
            <Text style={styles.sortButtonText}>
              {getSortLabel(sortBy)}
            </Text>
            <Ionicons 
              name={showSortOptions ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#000" 
            />
          </Pressable>
        </View>

        <FlatList
          data={sortedServices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsListContent}
          style={styles.resultsList}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black" // iOS
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptyText}>
                No services match your search criteria
              </Text>
              {hasActiveFilters() && (
                <Pressable style={styles.resetFiltersButton} onPress={clearFilters}>
                  <Text style={styles.resetFiltersText}>Reset filters</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={renderServiceItem}
        />
      </View>

      {/* FILTERS MODAL */}
      {renderFiltersModal()}
      
      {/* SORT OPTIONS MODAL */}
      {renderSortOptions()}
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
  // UPDATED: Search header now at very top
  searchHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  clearSearchButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#000",
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  activeFiltersContainer: {
    marginBottom: 12,
  },
  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  activeFilterTagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  clearAllFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 16,
    marginRight: 8,
  },
  clearAllFiltersText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "500",
  },
  // UPDATED: Results container with visible scrollbar space
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F5F5F5",
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  // UPDATED: Results list with scrollbar space
  resultsList: {
    flex: 1,
    paddingHorizontal: 16, // Space for scrollbar
  },
  resultsListContent: {
    paddingHorizontal: 4, // Adjusted for scrollbar
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4, // Space for scrollbar
    borderWidth: 1,
    borderColor: "#EEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sport: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginLeft: 8,
  },
  coachRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  coachName: {
    fontSize: 14,
    color: "#666",
  },
  datetimeContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
  noDateTimeContainer: {
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFEAA7",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noDateTimeText: {
    fontSize: 13,
    color: "#856404",
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tag: {
    backgroundColor: "#EEE",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  resetFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#000",
    borderRadius: 12,
  },
  resetFiltersText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  
  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    gap: 12,
  },
  clearAllButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
    backgroundColor: "transparent",
  },
  clearAllButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
  applyButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  applyButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  
  /* FILTER SECTION STYLES */
  filterSection: {
    marginBottom: 30,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  coachingModeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  coachingModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  coachingModeButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  coachingModeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  coachingModeButtonTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  filterHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  
  /* CALENDAR STYLES */
  dateFilterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateClearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 12,
  },
  dateClearButtonText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "500",
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  calendarContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  calendarDayNames: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  calendarDayName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    width: 40,
    textAlign: "center",
  },
  calendarWeek: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: "#F5F5F5",
  },
  calendarDaySelected: {
    backgroundColor: "#000",
  },
  calendarDayText: {
    fontSize: 14,
    color: "#000",
  },
  calendarDayTextOtherMonth: {
    color: "#999",
  },
  calendarDayTextToday: {
    fontWeight: "600",
  },
  calendarDayTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  
  /* TIME SLIDER STYLES */
  timeSliderContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  timeSliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeSliderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timeSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeSwitchLabel: {
    fontSize: 14,
    color: "#666",
  },
  timeSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEE",
    padding: 2,
    justifyContent: "center",
  },
  timeSwitchActive: {
    backgroundColor: "#000",
  },
  timeSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  timeSwitchThumbActive: {
    alignSelf: "flex-end",
  },
  timeSliderContent: {
    opacity: 1,
  },
  timeSliderDisabled: {
    opacity: 0.5,
  },
  // REMOVED: timeSliderLabels and timeSliderLabel
  
  timeSliderTrack: {
    height: 60, // Increased for touch area
    justifyContent: "center",
    marginTop: 8, // Added to compensate for removed labels
    marginBottom: 8, // Added to compensate for removed labels
  },
  timeSliderBackground: {
    height: 4,
    backgroundColor: "#EEE",
    borderRadius: 2,
    position: "relative",
  },
  timeSliderRange: {
    position: "absolute",
    height: 4,
    backgroundColor: "#000",
    borderRadius: 2,
  },
  timeSliderRangeDisabled: {
    backgroundColor: "#999",
  },
  timeSliderTouchArea: {
    position: "absolute",
    width: 40, // Increased width for better detection
    height: 60, // Increased height for better detection
    top: -30, // Adjusted position to be centered on line
    alignItems: "center",
    justifyContent: "center",
  },
  timeSliderTouchAreaStart: {
    // Specific styles for start handle if needed
  },
  timeSliderTouchAreaEnd: {
    // Specific styles for end handle if needed
  },
  timeSliderHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  timeSliderHandleDisabled: {
    backgroundColor: "#999",
  },
  timeSliderHandleStart: {
    backgroundColor: "#000",
  },
  timeSliderHandleEnd: {
    backgroundColor: "#000",
  },
  timeSliderHandleText: {
    position: "absolute",
    top: -25,
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    minWidth: 40,
    textAlign: "center",
  },
  timeSliderHandleTextDisabled: {
    color: "#999",
  },
  timeSliderSelected: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  timeSliderSelectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timeSliderSelectedTextDisabled: {
    color: "#999",
  },
  timeSliderClearButton: {
    padding: 4,
  },
  timeSliderHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  
  /* SORT OPTIONS STYLES */
  sortOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortOptionsContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 8,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: "#F5F5F5",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#000",
    flex: 1,
    marginLeft: 12,
  },
  sortOptionTextActive: {
    fontWeight: "600",
  },
});
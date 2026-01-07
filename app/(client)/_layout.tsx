import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // 🎨 couleurs
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#888",

        // 📍 positionnement & style
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,

        // ⌨️ cache la tab bar quand le clavier est ouvert (messagerie)
        tabBarHideOnKeyboard: true,

        // 📱 safe area bas (important sur iPhone)
        tabBarItemStyle: styles.item,
      }}
    >
      {/* 🏠 ACCUEIL */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 📅 RÉSERVATIONS */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🔍 RECHERCHE */}
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 💬 MESSAGERIE (messages.tsx) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 👤 PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🚫 NOUVELLE CONVERSATION */}
      <Tabs.Screen
        name="messages/compose"
        options={{ href: null }}
      />

      {/* 🚫 CHAT */}
      <Tabs.Screen
        name="messages/[id]"
        options={{ href: null }}
      />

      {/* 🚫 FICHE SERVICE */}
      <Tabs.Screen
        name="service/[id]"
        options={{ href: null }}
      />

      {/* 🚫 FICHE COACH */}
      <Tabs.Screen
        name="coaches/[id]"
        options={{ href: null }}
      />

      {/* 🚫 NOUVELLE RÉSERVATION */}
      <Tabs.Screen
        name="booking/new"
        options={{ href: null }}
      />

      {/* 🚫 ÉCRAN DE PAIEMENT */}
      <Tabs.Screen
        name="payment"
        options={{ href: null }}
      />
    </Tabs>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 78 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 18 : 8,
    borderTopWidth: 0.5,
    borderTopColor: "#DDD",
    backgroundColor: "#FFF",
  },

  label: {
    fontSize: 12,
    fontWeight: "500",
  },

  item: {
    paddingVertical: 4,
  },
});
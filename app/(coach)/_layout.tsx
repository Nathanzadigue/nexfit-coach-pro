import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CoachLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111",
        tabBarInactiveTintColor: "#999",
      }}
    >
      {/* 🏠 ACCUEIL */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🛠️ SERVICES */}
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 📅 PLANNING */}
      <Tabs.Screen
        name="planning"
        options={{
          title: "Planning",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 💬 MESSAGES */}
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
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🚫 CHAT DÉTAIL (caché) */}
      <Tabs.Screen
        name="messages/[id]"
        options={{
          href: null,
        }}
      />

      {/* 🚫 DEMANDES PLANNING (caché) */}
      <Tabs.Screen
        name="planning-request"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

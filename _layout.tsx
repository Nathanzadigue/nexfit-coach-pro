import { Stack, usePathname, router } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/src/store/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/firebase/config";

function RootNavigator() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    /**
     * 🔴 USER NOT CONNECTED → AUTH
     */
    if (!user) {
      if (!pathname.startsWith("/auth")) {
        router.replace("/auth");
      }
      return;
    }

    
    const redirectByRole = async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          if (!pathname.startsWith("/(client)")) {
            router.replace("/(client)");
          }
          return;
        }

        const userType = snap.data()?.userType;

        if (userType === "coach") {
          if (!pathname.startsWith("/(coach)")) {
            router.replace("/(coach)");
          }
          return;
        }

        if (!pathname.startsWith("/(client)")) {
          router.replace("/(client)");
        }
      } catch (error) {
        console.error("Routing error:", error);

        if (!pathname.startsWith("/(client)")) {
          router.replace("/(client)");
        }
      }
    };

    redirectByRole();
  }, [user, loading]); 
  if (loading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

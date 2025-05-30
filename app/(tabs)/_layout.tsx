import { Tabs } from "expo-router";
import { useAuth } from "../../src/Components/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function TabsLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // Handle navigation in useEffect
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Todo List",
        }}
      />
    </Tabs>
  );
} 
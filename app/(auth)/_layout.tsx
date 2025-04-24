import { Stack } from "expo-router";
import { useAuth } from "../../src/Components/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // Handle navigation in useEffect
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
} 
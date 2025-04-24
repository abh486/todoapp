import { Stack } from "expo-router";
import { AuthProvider } from "../src/Components/contexts/AuthContext";
import { useAuth } from "../src/Components/contexts/AuthContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();

  // Show nothing while checking authentication state
  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

// Root layout component that wraps the entire app
export default function RootLayout() {
  return (
    // Wrap the app with AuthProvider to provide authentication context
    <AuthProvider>
      <Stack>
        {/* Main app screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Authentication screens */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}

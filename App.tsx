import { AuthProvider } from './src/Components/contexts/AuthContext';
import { Stack } from 'expo-router';

// Main App component that sets up the navigation stack
export default function App() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}

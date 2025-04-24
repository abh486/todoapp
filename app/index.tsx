import { Redirect } from 'expo-router';

export default function Index() {
  // Always redirect to login page first
  return <Redirect href="/(auth)/login" />;
}

import { Slot } from 'expo-router';
import 'nativewind';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}

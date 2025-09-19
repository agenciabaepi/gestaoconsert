import AppStack from './AppStack';
import { AuthProvider } from '../src/context/AuthContext';
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
}
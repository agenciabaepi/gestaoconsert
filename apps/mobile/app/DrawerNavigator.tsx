import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabaseClient';
import BancadaScreen from './screens/BancadaScreen';
import PerfilScreen from './screens/PerfilScreen';
import LoginScreen from './screens/LoginScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Sair"
        icon={({ color, size }) => (
          <Ionicons name="exit-outline" size={size} color="#EF4444" />
        )}
        labelStyle={{ color: '#EF4444' }}
        onPress={async () => {
          await supabase.auth.signOut();
        }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const { session } = useAuth();
  if (!session) {
    return <LoginScreen />;
  }
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#2563EB',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Bancada"
        component={BancadaScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
} 
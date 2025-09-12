import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://your-project.supabase.co',
  'public-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restaurarSessao = async () => {
      try {
        const sessionJson = await AsyncStorage.getItem('session');
        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          console.log('🟢 Sessão restaurada:', session);

          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });

          router.replace('/screens/BancadaScreen');
        } else {
          console.log('🔴 Nenhuma sessão encontrada, redirecionando para Login');
          router.replace('/screens/LoginScreen');
        }
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error);
        router.replace('/screens/LoginScreen');
      } finally {
        setLoading(false);
      }
    };

    restaurarSessao();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
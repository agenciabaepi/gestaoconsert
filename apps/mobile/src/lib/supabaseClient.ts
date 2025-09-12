import { createClient } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://nxamrvfusyrtkcshehfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW1ydmZ1c3lydGtjc2hlaGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjEzMTAsImV4cCI6MjA2MzQzNzMxMH0.CWTKEVlWcMeRTv8kHgsPkk-WzoHxypFDb_QSf-DLPAQ';             // ✅ coloque sua chave pública

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

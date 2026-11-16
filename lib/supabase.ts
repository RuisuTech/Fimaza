import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const memoryStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

const authStorage =
  Platform.OS === 'web' && typeof window === 'undefined' ? memoryStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage as any,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
  },
});

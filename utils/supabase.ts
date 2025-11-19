import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@env';
import { createClient } from '@supabase/supabase-js';
import 'expo-sqlite/localStorage/install';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,  // TODO: Change to true after testing
    detectSessionInUrl: false,
  },
});
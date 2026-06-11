import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env, hasSupabaseConfig } from '../env/env';

export { hasSupabaseConfig, assertSupabaseConfigured } from '../env/env';

// Runtime visibility — log which Supabase project the app actually connects
// to, so stale .env / cached-bundle issues are immediately obvious.
if (typeof console !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log(
    `[Supabase] configured=${hasSupabaseConfig} url=${env.supabaseUrl || '(none)'}`,
  );
}

export const supabase = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    global: {
      headers: { 'x-client-app': 'insta-news-telugu' },
    },
  },
);

export const DISPLAY_NAME_KEY = 'telugu_chat_display_name';

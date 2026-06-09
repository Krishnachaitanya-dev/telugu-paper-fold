export { supabase, DISPLAY_NAME_KEY } from '@/core/supabase/supabaseClient';
export { hasSupabaseConfig, assertSupabaseConfigured } from '@/core/env/env';

export { hasSupabaseConfig as hasSupabaseAuthConfig } from '@/core/env/env';

export interface ChatMessage {
  id: string;
  sender_name?: string;
  display_name?: string;
  message?: string;
  created_at: string;
}

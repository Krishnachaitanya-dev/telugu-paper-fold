import { supabase } from '@/core/supabase/supabaseClient';
import { logger } from '@/core/logger';
import type { ChatUser } from '../model/chat.schema';

export async function fetchAvailableUsers(excludeId: string): Promise<ChatUser[]> {
  const { data, error } = await supabase
    .from('chat_users')
    .select('*')
    .neq('id', excludeId)
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) { logger.warn('fetchAvailableUsers failed', { error }); return []; }
  return (data as ChatUser[]) ?? [];
}

export async function searchUsers(query: string, excludeId: string): Promise<ChatUser[]> {
  const q = query.trim();
  if (!q) return fetchAvailableUsers(excludeId);
  const { data } = await supabase
    .from('chat_users')
    .select('*')
    .neq('id', excludeId)
    .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(50);
  return (data as ChatUser[]) ?? [];
}

export async function setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  await supabase
    .from('chat_users')
    .update({ is_online: isOnline, last_seen_at: new Date().toISOString() })
    .eq('id', userId);
}

import { supabase } from '@/core/supabase/supabaseClient';
import { logger } from '@/core/logger';
import { ok, err } from '@/core/result/result';
import { AuthError } from '@/core/errors/errors';
import { avatarColor, normalizeUsername } from '../model/chat.schema';
import type { ChatUser } from '../model/chat.schema';
import type { Result } from '@/core/result/result';

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getMyProfile(): Promise<ChatUser | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('chat_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) { logger.warn('getMyProfile failed', { error }); return null; }
  return (data as ChatUser | null) ?? null;
}

export async function registerOrUpdateUser(
  userId: string,
  displayName: string,
  username: string,
): Promise<Result<ChatUser>> {
  try {
    const cleanUsername = normalizeUsername(username || displayName);
    const color = avatarColor(displayName || cleanUsername);
    const { data, error } = await supabase
      .from('chat_users')
      .upsert(
        {
          id: userId,
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
          avatar_color: color,
          is_online: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single();
    if (error) return err(new AuthError('upsert_failed', error.message, error));
    return ok(data as ChatUser);
  } catch (e) {
    return err(new AuthError('register_failed', String(e), e));
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  username: string,
): Promise<Result<ChatUser>> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return err(new AuthError('signup_failed', error.message, error));
  const userId = data.user?.id;
  if (!userId) return err(new AuthError('no_user', 'Sign up succeeded but no user returned'));
  return registerOrUpdateUser(userId, displayName, username);
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Result<ChatUser>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return err(new AuthError('signin_failed', error.message, error));
  const userId = data.user?.id;
  if (!userId) return err(new AuthError('no_user', 'Sign in succeeded but no user returned'));
  return registerOrUpdateUser(userId, data.user?.email ?? '', '');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

import { supabase } from '@/core/supabase/supabaseClient';
import { sanitizePlainText } from '@/lib/security/inputValidation';
import { assertClientRateLimit } from '@/lib/security/rateLimiter';
import { ok, err } from '@/core/result/result';
import { AuthError, NetworkError } from '@/core/errors/errors';
import { guardDoubleSubmit } from '@/core/resilience/idempotency';
import type { ReporterProfile } from '../model/reporter.schema';
import type { Result } from '@/core/result/result';

async function getSessionUserId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user.id) return sessionData.session.user.id;
  const { data: userData } = await supabase.auth.getUser();
  return userData.user?.id ?? null;
}

export async function getMyReporterProfile(): Promise<ReporterProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from('reporter_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return (data as ReporterProfile | null) ?? null;
}

export async function upsertReporterProfile(profile: {
  displayName: string;
  bio?: string;
  avatarUrl?: string | null;
}): Promise<Result<ReporterProfile>> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return err(new AuthError('auth_failed', userError.message, userError));
    const userId = userData.user?.id;
    if (!userId) return err(new AuthError('no_user', 'Login required'));

    const { data, error } = await supabase
      .from('reporter_profiles')
      .upsert(
        {
          id: userId,
          display_name: sanitizePlainText(profile.displayName, 80),
          bio: profile.bio ? sanitizePlainText(profile.bio, 280) : null,
          avatar_url: profile.avatarUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single();
    if (error) return err(new NetworkError('upsert_failed', error.message, error));
    return ok(data as ReporterProfile);
  } catch (e) {
    return err(new NetworkError('unknown', String(e), e));
  }
}

export interface FollowState {
  following: boolean;
  followerCount: number;
  canFollow: boolean;
  isSelf: boolean;
}

export async function getReporterFollowState(reporterId: string): Promise<FollowState> {
  const userId = await getSessionUserId();
  if (!userId || userId === reporterId) {
    const { count } = await supabase
      .from('reporter_follows')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', reporterId);
    return { following: false, followerCount: count ?? 0, canFollow: false, isSelf: userId === reporterId };
  }

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from('reporter_follows')
      .select('reporter_id')
      .eq('reporter_id', reporterId)
      .eq('follower_id', userId)
      .maybeSingle(),
    supabase
      .from('reporter_follows')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', reporterId),
  ]);

  return { following: Boolean(data), followerCount: count ?? 0, canFollow: true, isSelf: false };
}

export async function getFollowedReporterIds(): Promise<string[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('reporter_follows')
    .select('reporter_id')
    .eq('follower_id', userId);
  if (error) return [];
  return (data ?? []).map((row) => row.reporter_id as string).filter(Boolean);
}

export async function toggleReporterFollow(
  reporterId: string,
  currentlyFollowing: boolean,
): Promise<Result<void>> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return err(new AuthError('no_user', 'Login required'));
    if (userId === reporterId) return err(new AuthError('self_follow', 'Cannot follow own profile'));

    // Double-submit guard — rapid double-tap on follow must not double-write.
    if (!guardDoubleSubmit(`follow:${userId}:${reporterId}`)) {
      return ok(undefined);
    }

    if (currentlyFollowing) {
      const { error } = await supabase
        .from('reporter_follows')
        .delete()
        .eq('reporter_id', reporterId)
        .eq('follower_id', userId);
      if (error) return err(new NetworkError('unfollow_failed', error.message, error));
      return ok(undefined);
    }

    await assertClientRateLimit(`reporter-follow:${userId}`, 20, 60_000);
    const { error } = await supabase
      .from('reporter_follows')
      .insert({ reporter_id: reporterId, follower_id: userId });
    if (error) return err(new NetworkError('follow_failed', error.message, error));
    return ok(undefined);
  } catch (e) {
    return err(new NetworkError('unknown', String(e), e));
  }
}

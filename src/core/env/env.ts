import { z } from 'zod';

const envSchema = z.object({
  supabaseUrl: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  supabaseAnonKey: z.string().min(10, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is too short'),
  sentryDsn: z.string().url().optional(),
  appEnv: z.enum(['development', 'staging', 'production']).default('development'),
  posthogApiKey: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const PLACEHOLDER_VALUES = new Set([
  'https://your-project.supabase.co',
  'your-public-anon-key',
  'placeholder-anon-key',
  'https://placeholder.supabase.co',
]);

// Must use static dot-notation for each key — Expo Metro only inlines
// EXPO_PUBLIC_* vars when accessed as literal property names, not via
// dynamic bracket access like process.env[key].
const parsed = envSchema.safeParse({
  supabaseUrl:    (process.env.EXPO_PUBLIC_SUPABASE_URL    ?? '').trim(),
  supabaseAnonKey:(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  sentryDsn:      (process.env.EXPO_PUBLIC_SENTRY_DSN       ?? '').trim() || undefined,
  appEnv:         (process.env.EXPO_PUBLIC_APP_ENV          ?? '').trim() || 'development',
  posthogApiKey:  (process.env.EXPO_PUBLIC_POSTHOG_API_KEY  ?? '').trim() || undefined,
});

export const env: Env = parsed.success
  ? parsed.data
  : { supabaseUrl: '', supabaseAnonKey: '', appEnv: 'development' };

export const hasSupabaseConfig = Boolean(
  env.supabaseUrl &&
  env.supabaseAnonKey &&
  !PLACEHOLDER_VALUES.has(env.supabaseUrl) &&
  !PLACEHOLDER_VALUES.has(env.supabaseAnonKey),
);

export function assertSupabaseConfigured(): void {
  if (!hasSupabaseConfig) {
    throw new Error(
      'Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
}

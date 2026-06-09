import { z } from 'zod';

export const chatUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  avatar_color: z.string(),
  is_online: z.boolean(),
  last_seen_at: z.string().nullable(),
  created_at: z.string(),
});

export const conversationSchema = z.object({
  id: z.string(),
  user1_id: z.string(),
  user2_id: z.string(),
  last_message: z.string().nullable(),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  other_user: chatUserSchema.optional(),
});

export const messageTypeSchema = z.enum(['text', 'image', 'share']);
export const sharedKindSchema = z.enum(['news', 'reel', 'live']).nullable();

export const dmMessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  content: z.string().nullable(),
  message_type: messageTypeSchema,
  image_url: z.string().nullable(),
  image_expires_at: z.string().nullable(),
  image_view_mode: z.enum(['once', '24h']).nullable().optional(),
  image_viewed_at: z.string().nullable().optional(),
  image_storage_path: z.string().nullable().optional(),
  shared_kind: sharedKindSchema.optional(),
  shared_title: z.string().nullable(),
  shared_url: z.string().nullable(),
  shared_image_url: z.string().nullable(),
  is_seen: z.boolean(),
  created_at: z.string(),
});

export type ChatUser = z.infer<typeof chatUserSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type DmMessage = z.infer<typeof dmMessageSchema>;
export type MessageType = z.infer<typeof messageTypeSchema>;
export type SharedKind = z.infer<typeof sharedKindSchema>;

export interface ShareDraft {
  kind: 'news' | 'reel' | 'live';
  title: string;
  url?: string | null;
  imageUrl?: string | null;
}

export const CHAT_IMAGES_BUCKET = 'chat-images';
export const DISPLAY_NAME_KEY = 'telugu_chat_display_name';

const AVATAR_COLORS = [
  '#0a9b9a', '#7047c7', '#ff4f87', '#ff9f40',
  '#22c55e', '#3b82f6', '#f59e0b', '#e11d48',
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name?: string | null): string {
  const clean = (name ?? 'User').trim();
  return (
    clean
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );
}

export function formatTimeShort(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
}

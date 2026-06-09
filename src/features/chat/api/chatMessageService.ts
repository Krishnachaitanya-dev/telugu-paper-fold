import { supabase } from '@/core/supabase/supabaseClient';
import { assertSafeMessage, sanitizePlainText } from '@/lib/security/inputValidation';
import { assertClientRateLimit } from '@/lib/security/rateLimiter';
import { guardDoubleSubmit, idempotencyKey } from '@/core/resilience/idempotency';
import { RateLimitError } from '@/core/errors/errors';
import type { DmMessage, ShareDraft, Conversation } from '../model/chat.schema';
import type { ChatUser } from '../model/chat.schema';

export async function getOrCreateConversation(
  myId: string,
  otherId: string,
): Promise<Conversation> {
  const [u1, u2] = [myId, otherId].sort();
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user1_id', u1)
    .eq('user2_id', u2)
    .maybeSingle();
  if (existing) return existing as Conversation;
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: u1, user2_id: u2 })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, user1:user1_id(*), user2:user2_id(*)')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return ((data ?? []) as (Conversation & { user1: ChatUser; user2: ChatUser })[]).map(
    (conv) => ({ ...conv, other_user: conv.user1_id === userId ? conv.user2 : conv.user1 }),
  );
}

export async function getMessages(conversationId: string, limit = 80): Promise<DmMessage[]> {
  const { data } = await supabase
    .from('dm_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as DmMessage[]) ?? [];
}

export function subscribeToMessages(
  conversationId: string,
  onInsert: (m: DmMessage) => void,
) {
  return supabase
    .channel(`dm:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as DmMessage),
    )
    .subscribe();
}

async function updateConversationLast(conversationId: string, lastMessage: string) {
  await supabase
    .from('conversations')
    .update({ last_message: lastMessage, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
}

export async function sendTextMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<DmMessage> {
  const safeContent = assertSafeMessage(content);
  // Double-submit guard — keyed on content so the same message can't post twice
  // from a double-tap / retry, while a genuinely new message passes through.
  if (!guardDoubleSubmit(`chat-text:${senderId}:${conversationId}:${safeContent}`)) {
    throw new RateLimitError(1500);
  }
  await assertClientRateLimit(`chat-text:${senderId}`, 20, 60_000);
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content: safeContent, message_type: 'text', client_tag: idempotencyKey() })
    .select()
    .single();
  if (error) throw error;
  updateConversationLast(conversationId, safeContent.slice(0, 120)).catch(() => {});
  return data as DmMessage;
}

export async function sendShareMessage(
  conversationId: string,
  senderId: string,
  draft: ShareDraft,
): Promise<DmMessage> {
  if (!guardDoubleSubmit(`chat-share:${senderId}:${conversationId}:${draft.url ?? draft.title}`)) {
    throw new RateLimitError(1500);
  }
  await assertClientRateLimit(`chat-share:${senderId}`, 12, 60_000);
  const label =
    draft.kind === 'reel'
      ? 'Shared reel'
      : draft.kind === 'live'
        ? 'Shared live channel'
        : 'Shared news';
  const safeTitle = sanitizePlainText(draft.title, 280);
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: label,
      message_type: 'share',
      shared_kind: draft.kind,
      shared_title: safeTitle,
      shared_url: draft.url ?? null,
      shared_image_url: draft.imageUrl ?? null,
      client_tag: idempotencyKey(),
    })
    .select()
    .single();
  if (error) throw error;
  updateConversationLast(conversationId, `${label}: ${safeTitle}`.slice(0, 120)).catch(() => {});
  return data as DmMessage;
}

export async function sendImageMessage(
  conversationId: string,
  senderId: string,
  imageUrl: string,
  imageStoragePath: string,
  viewMode: 'once' | '24h',
): Promise<DmMessage> {
  await assertClientRateLimit(`chat-image:${senderId}`, 6, 60_000);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: viewMode === 'once' ? 'One-time photo' : '24-hour photo',
      message_type: 'image',
      image_url: imageUrl,
      image_expires_at: expires,
      image_view_mode: viewMode,
      image_storage_path: imageStoragePath,
      client_tag: idempotencyKey(),
    })
    .select()
    .single();
  if (error) throw error;
  updateConversationLast(
    conversationId,
    viewMode === 'once' ? 'One-time photo' : '24-hour photo',
  ).catch(() => {});
  return data as DmMessage;
}

export async function markAsSeen(conversationId: string, myId: string): Promise<void> {
  await supabase
    .from('dm_messages')
    .update({ is_seen: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', myId)
    .eq('is_seen', false);
}

export async function markImageMessageOpened(messageId: string): Promise<DmMessage | null> {
  const { data, error } = await supabase.rpc('mark_dm_image_opened', { message_id: messageId });
  if (error) return null;
  return (Array.isArray(data) ? data[0] : data) as DmMessage | null;
}

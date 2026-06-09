export { getCurrentUserId, getMyProfile, registerOrUpdateUser, signUpWithEmail, signInWithEmail, signOut } from './api/chatAuthService';
export { getOrCreateConversation, getConversations, getMessages, subscribeToMessages, sendTextMessage, sendShareMessage, sendImageMessage, markAsSeen, markImageMessageOpened } from './api/chatMessageService';
export { fetchAvailableUsers, searchUsers, setOnlineStatus } from './api/chatPresenceService';
export { uploadChatImage, getSignedChatImageUrl } from './api/chatStorageService';
export { avatarColor, initials, formatTimeShort, normalizeUsername, CHAT_IMAGES_BUCKET, DISPLAY_NAME_KEY } from './model/chat.schema';
export type { ChatUser, Conversation, DmMessage, MessageType, SharedKind, ShareDraft } from './model/chat.schema';

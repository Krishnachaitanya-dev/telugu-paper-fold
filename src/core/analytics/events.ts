export type AnalyticsEvent =
  | { name: 'onboarding_completed'; props: { category: string } }
  | { name: 'news_opened'; props: { id: string; category: string; source?: string } }
  | { name: 'news_shared'; props: { id: string; channel: 'whatsapp' | 'native' | 'chat' } }
  | { name: 'news_bookmarked'; props: { id: string } }
  | { name: 'reel_watched'; props: { id: string; completed: boolean } }
  | { name: 'live_channel_opened'; props: { id: string; name: string } }
  | { name: 'chat_message_sent'; props: { type: 'text' | 'image' | 'share' } }
  | { name: 'reporter_followed'; props: { reporterId: string } }
  | { name: 'search_performed'; props: { query: string; resultCount: number } }
  | { name: 'breaking_news_tapped'; props: { id: string } };

export type EventName = AnalyticsEvent['name'];

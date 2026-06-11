import { supabase } from "@/integrations/supabase/client";

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  source_name: string | null;
  source_url: string | null;
  reporter_name: string | null;
  reporter_avatar_url: string | null;
  fact_check_status: string;
  created_at: string;
};

export type ReelItem = {
  id: string;
  title: string;
  channel: string;
  category: string;
  youtube_id: string;
  thumbnail_url: string | null;
  reporter_name: string | null;
  reporter_avatar_url: string | null;
  tag: string | null;
  created_at: string;
};

export type LiveChannel = {
  id: string;
  channel_name: string;
  channel_id: string;
  video_id: string | null;
  logo_url: string | null;
  logo_text: string;
  badge: string;
  description: string | null;
  official_url: string;
  is_active: boolean;
  sort_order: number;
};

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news_updates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as NewsItem[];
}

export async function fetchNewsById(id: string): Promise<NewsItem | null> {
  const { data, error } = await supabase
    .from("news_updates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as NewsItem | null;
}

export async function fetchReels(): Promise<ReelItem[]> {
  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []) as ReelItem[];
}

export async function fetchLiveChannels(): Promise<LiveChannel[]> {
  const { data, error } = await supabase
    .from("live_channels")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LiveChannel[];
}

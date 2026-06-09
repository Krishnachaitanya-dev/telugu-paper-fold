import { selectPublicRows } from "@/lib/repositories/publicContentRepository";
import type { NewsUpdate, Reel, LiveChannel } from "@/lib/supabase";

export const contentService = {
  fetchNews(category?: string, followedReporterIds: string[] = []) {
    const isReporterFilter = category === "Reporters";
    const isFollowingFilter = category === "Following";
    if (isFollowingFilter && followedReporterIds.length === 0) return Promise.resolve([] as NewsUpdate[]);
    // Only fetch last 24 hours — keeps feed fresh, never shows yesterday's news
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return selectPublicRows<NewsUpdate>("news_updates", {
      select: "id,title,description,category,image_url,source_url,source_name,created_at,reporter_id,reporter_name,reporter_avatar_url",
      order: "created_at.desc",
      limit: category && category !== "All" ? "100" : "150",
      created_at: `gte.${cutoff}`,
      ...(isReporterFilter
        ? { reporter_id: "not.is.null" }
        : isFollowingFilter
          ? { reporter_id: `in.(${followedReporterIds.join(",")})` }
          : category && category !== "All"
            ? { category: `ilike.${category}` }
            : {}),
    });
  },
  fetchReels() {
    return selectPublicRows<Reel>("reels", {
      select: "id,video_id,title,channel,tag,category,source_url,sort_order,created_at,is_short,aspect_ratio,duration_seconds,reporter_id,reporter_name,reporter_avatar_url",
      order: "created_at.desc",
      limit: "120",
    });
  },
  fetchNewsById(id: string) {
    return selectPublicRows<NewsUpdate>("news_updates", {
      select: "id,title,description,category,image_url,source_url,source_name,created_at,reporter_id,reporter_name,reporter_avatar_url",
      id: `eq.${id}`,
      limit: "1",
    }).then((rows) => rows[0] ?? null);
  },
  fetchLiveChannels() {
    return selectPublicRows<LiveChannel>("live_channels", {
      select: "id,channel_name,badge,description,video_id,official_url,logo_url,is_active,sort_order",
      order: "sort_order.asc",
      limit: "30",
    });
  },
};

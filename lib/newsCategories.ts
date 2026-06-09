import type { NewsUpdate } from "./supabase";

export const NEWS_CATEGORIES = [
  "All",
  "Speed",
  "Top",
  "Reporters",
  "Following",
  "Jobs",
  "Districts",
  "Movies",
  "TTD",
  "Exams",
  "Sports",
  "Politics",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

const CATEGORY_ALIASES: Record<string, NewsCategory> = {
  top: "Top",
  jobs: "Jobs",
  job: "Jobs",
  districts: "Districts",
  district: "Districts",
  movies: "Movies",
  movie: "Movies",
  cinema: "Movies",
  ttd: "TTD",
  exams: "Exams",
  exam: "Exams",
  sports: "Sports",
  sport: "Sports",
  politics: "Politics",
  political: "Politics",
};

export function getNewsCategory(article: NewsUpdate): NewsCategory {
  const rawCategory = article.category?.toLowerCase().trim() ?? "";
  return CATEGORY_ALIASES[rawCategory] ?? "Top";
}

export function filterNewsByCategory(
  articles: NewsUpdate[],
  category: NewsCategory | string,
  followedReporterIds: string[] = []
) {
  if (category === "All") return articles;
  if (category === "Speed") return articles;
  if (category === "Reporters") return articles.filter((article) => Boolean(article.reporter_id));
  if (category === "Following") {
    if (followedReporterIds.length === 0) return [];
    const followed = new Set(followedReporterIds);
    return articles.filter((article) => article.reporter_id && followed.has(article.reporter_id));
  }
  if (category === "Top") return articles.slice(0, 40);
  return articles.filter((article) => getNewsCategory(article) === category);
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock, Flame } from "lucide-react";
import { fetchNews, type NewsItem } from "@/lib/queries";
import { EmptyState, SkeletonCard } from "@/components/EmptyState";
import { cn, timeAgo } from "@/lib/utils";

const FALLBACK_CATS = ["అన్నీ", "రాజకీయాలు", "సినిమా", "క్రీడలు", "వ్యాపారం", "టెక్నాలజీ", "విదేశీ"];

export default function NewsFeed() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });
  const [active, setActive] = useState<string>("అన్నీ");

  const categories = useMemo(() => {
    const set = new Set<string>(["అన్నీ"]);
    (data ?? []).forEach((n) => n.category && set.add(n.category));
    const arr = Array.from(set);
    return arr.length > 1 ? arr : FALLBACK_CATS;
  }, [data]);

  const items = useMemo(() => {
    if (!data) return [];
    return active === "అన్నీ" ? data : data.filter((n) => n.category === active);
  }, [data, active]);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="pt-3">
      {/* Category chips */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-md -mx-0 px-4 py-2 border-b border-border">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all border",
                active === c
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_12px_-4px_oklch(0.68_0.13_190/0.5)]"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">
        {isLoading && (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        )}

        {isError && (
          <EmptyState
            title="వార్తలు లోడ్ కాలేదు"
            hint="ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            title="ఈ విభాగంలో వార్తలు లేవు"
            hint="తాజా అప్‌డేట్‌ల కోసం రిఫ్రెష్ చేయండి."
            onRetry={() => refetch()}
          />
        )}

        {featured && <FeaturedCard item={featured} />}
        {rest.map((n) => (
          <NewsCard key={n.id} item={n} />
        ))}

        {!isLoading && items.length > 0 && (
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full h-11 mt-2 rounded-full bg-card border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            {isFetching ? "Refreshing…" : "↻  మరిన్ని వార్తలు లోడ్ చేయండి"}
          </button>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/news/${item.id}`}
      className="block rise-in relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-elev)] group"
    >
      <div className="aspect-[16/10] w-full bg-card-elevated overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            loading="eager"
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
            <Flame className="h-3 w-3" /> Featured
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold backdrop-blur-sm">
            {item.category}
          </span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight line-clamp-3">
          {item.title}
        </h2>
        <div className="flex items-center gap-3 mt-3 text-white/75 text-xs font-semibold">
          {item.reporter_name && <span>· {item.reporter_name}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/news/${item.id}`}
      className="block rise-in rounded-2xl bg-card border border-border overflow-hidden hover:bg-card-elevated transition-colors"
    >
      <div className="flex gap-3 p-3">
        <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-card-elevated">
          {item.image_url && (
            <img src={item.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[10px] font-bold uppercase tracking-wide">
              {item.category}
            </span>
            {item.fact_check_status === "verified" && (
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
            )}
          </div>
          <h3 className="font-display text-sm sm:text-base font-bold leading-snug line-clamp-3 text-foreground">
            {item.title}
          </h3>
          <div className="mt-auto pt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-semibold">
            {item.reporter_avatar_url ? (
              <img src={item.reporter_avatar_url} alt="" className="h-4 w-4 rounded-full" />
            ) : null}
            {item.reporter_name && <span>{item.reporter_name}</span>}
            <span>·</span>
            <span>{timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

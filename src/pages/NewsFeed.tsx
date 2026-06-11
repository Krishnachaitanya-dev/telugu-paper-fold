import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock, ExternalLink, Share2, ChevronUp, RefreshCw } from "lucide-react";
import { fetchNews, type NewsItem } from "@/lib/queries";
import { EmptyState, ErrorState, SkeletonNewsFull } from "@/components/EmptyState";
import { cn, timeAgo } from "@/lib/utils";

const FALLBACK_CATS = ["అన్నీ"];

export default function NewsFeed() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });
  const [active, setActive] = useState<string>("అన్నీ");
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // reset position on category change
  useEffect(() => {
    setIdx(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [active]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const next = Math.round(el.scrollTop / el.clientHeight);
      setIdx(next);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  if (isLoading) {
    return (
      <div>
        <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-md px-4 py-2 border-b border-border flex gap-2 overflow-x-auto no-scrollbar">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="shrink-0 h-8 w-20 rounded-full bg-card animate-pulse" />
          ))}
        </div>
        <SkeletonNewsFull />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pt-6">
        <ErrorState
          title="వార్తలు లోడ్ కాలేదు"
          hint="ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          title="వార్తలు అందుబాటులో లేవు"
          hint="తాజా అప్‌డేట్‌ల కోసం రిఫ్రెష్ చేయండి."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Category chips */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-md px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
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
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
            className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* One-news-at-a-time vertical snap */}
      <div
        ref={containerRef}
        className="snap-reels h-[calc(100dvh-9.5rem)] overflow-y-scroll no-scrollbar"
      >
        {items.map((n, i) => (
          <NewsCardFull key={n.id} item={n} index={i} total={items.length} />
        ))}
      </div>

      {/* Position indicator */}
      <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-1.5">
        {items.slice(0, Math.min(items.length, 12)).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-all",
              i === idx ? "bg-primary h-4" : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Swipe-up hint on first card */}
      {idx === 0 && items.length > 1 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-muted-foreground animate-bounce">
          <ChevronUp className="h-4 w-4" />
          <span className="text-[10px] font-bold tracking-wide">SWIPE UP</span>
        </div>
      )}
    </div>
  );
}

function NewsCardFull({ item, index, total }: { item: NewsItem; index: number; total: number }) {
  const onShare = () => {
    const url = item.source_url || window.location.href;
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.description?.slice(0, 120), url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <section className="h-[calc(100dvh-9.5rem)] w-full overflow-hidden flex flex-col bg-background">
      {/* Image */}
      <div className="relative w-full h-[42%] shrink-0 bg-card-elevated overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            loading={index < 2 ? "eager" : "lazy"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
            {item.category}
          </span>
          {item.fact_check_status === "verified" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-[10px] font-bold">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-bold">
          {index + 1} / {total}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 px-5 pt-3 pb-4 flex flex-col">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight text-foreground line-clamp-3">
          {item.title}
        </h1>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-semibold">
          {item.reporter_avatar_url ? (
            <img src={item.reporter_avatar_url} alt="" className="h-5 w-5 rounded-full ring-1 ring-border" />
          ) : null}
          {item.reporter_name && <span>{item.reporter_name}</span>}
          {item.reporter_name && <span>·</span>}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(item.created_at)}
          </span>
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-foreground/85 font-body overflow-y-auto no-scrollbar pr-1 flex-1">
          {item.description}
        </p>

        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
          {item.source_url ? (
            <a
              href={item.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-xs font-bold text-foreground hover:bg-card-elevated"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {item.source_name || "మూలం"}
            </a>
          ) : null}
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-xs font-bold text-foreground hover:bg-card-elevated"
          >
            <Share2 className="h-3.5 w-3.5" /> షేర్
          </button>
          <Link
            to={`/news/${item.id}`}
            className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
          >
            పూర్తి కథనం →
          </Link>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, RefreshCw, Play } from "lucide-react";
import { fetchReels, type ReelItem } from "@/lib/queries";
import { ErrorState, EmptyState, SkeletonReel } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function Reels() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reels"],
    queryFn: fetchReels,
  });
  const [muted, setMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // IntersectionObserver — accurate active detection at snap boundaries
  useEffect(() => {
    if (!data || data.length === 0) return;
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          if (!isFinite(idx)) return;
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio)) {
            best = { idx, ratio: e.intersectionRatio };
          }
        });
        if (best) setActiveIdx(best.idx);
      },
      { root, threshold: [0.55, 0.75, 0.95] }
    );
    itemRefs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [data]);

  if (isLoading) {
    return (
      <div className="snap-reels h-[100dvh] overflow-y-scroll no-scrollbar bg-black">
        <SkeletonReel />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[100dvh] grid place-items-center bg-black">
        <ErrorState title="రీల్స్ లోడ్ కాలేదు" hint="ఇంటర్నెట్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి." tone="dark" onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[100dvh] grid place-items-center bg-black">
        <EmptyState title="రీల్స్ లేవు" hint="త్వరలో మరిన్ని రీల్స్ జోడించబడతాయి." tone="dark" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="snap-reels h-[100dvh] overflow-y-scroll no-scrollbar bg-black"
    >
      {data.map((r, i) => (
        <ReelItemView
          key={r.id}
          item={r}
          index={i}
          active={i === activeIdx}
          // preload neighbors (current ± 1) to keep transitions smooth
          preload={Math.abs(i - activeIdx) <= 1}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          registerRef={(el) => {
            if (el) itemRefs.current.set(i, el);
            else itemRefs.current.delete(i);
          }}
        />
      ))}
    </div>
  );
}

function ReelItemView({
  item,
  index,
  active,
  preload,
  muted,
  onToggleMute,
  registerRef,
}: {
  item: ReelItem;
  index: number;
  active: boolean;
  preload: boolean;
  muted: boolean;
  onToggleMute: () => void;
  registerRef: (el: HTMLElement | null) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  // Reset buffering state whenever we leave & re-enter
  useEffect(() => {
    if (!preload) setIframeReady(false);
  }, [preload]);

  const src = preload
    ? `https://www.youtube.com/embed/${item.youtube_id}?autoplay=${active ? 1 : 0}&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${item.youtube_id}&rel=0&iv_load_policy=3`
    : "";

  return (
    <section
      ref={registerRef}
      data-idx={index}
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-full w-full max-w-[480px] mx-auto bg-black">
          {/* Thumbnail layer — always rendered, fades out when iframe is ready & active */}
          {item.thumbnail_url && (
            <img
              src={item.thumbnail_url}
              alt=""
              loading={preload ? "eager" : "lazy"}
              className={cn(
                "absolute inset-0 h-full w-full object-cover reel-fade",
                active && iframeReady ? "opacity-0" : "opacity-100"
              )}
            />
          )}

          {/* Iframe — mounted for current ± 1 for smooth transitions */}
          {preload && (
            <iframe
              src={src}
              title={item.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              onLoad={() => setIframeReady(true)}
              className={cn(
                "absolute inset-0 h-full w-full reel-fade",
                active && iframeReady ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              style={{ border: 0 }}
            />
          )}

          {/* Buffering spinner while active iframe is loading */}
          {active && !iframeReady && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="h-12 w-12 rounded-full border-2 border-white/25 border-t-white animate-spin" />
            </div>
          )}

          {/* Play affordance hint (shown briefly when iframe not yet ready and no thumbnail) */}
          {active && !iframeReady && !item.thumbnail_url && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <Play className="h-14 w-14 text-white/60" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />
        </div>
      </div>

      {/* Right rail */}
      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5 text-white">
        <ActionBtn
          icon={Heart}
          active={liked}
          activeColor="text-accent"
          label="లైక్"
          onClick={() => setLiked((v) => !v)}
        />
        <ActionBtn icon={MessageCircle} label="కామెంట్" />
        <ActionBtn
          icon={Share2}
          label="షేర్"
          onClick={() =>
            navigator.share?.({ title: item.title, url: `https://youtu.be/${item.youtube_id}` }).catch(() => {})
          }
        />
        <ActionBtn
          icon={Bookmark}
          active={saved}
          activeColor="text-warning"
          label="సేవ్"
          onClick={() => setSaved((v) => !v)}
        />
        <button
          onClick={onToggleMute}
          className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md grid place-items-center hover:bg-white/25 transition"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-0 right-16 bottom-28 z-10 px-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          {item.reporter_avatar_url ? (
            <img src={item.reporter_avatar_url} className="h-8 w-8 rounded-full ring-2 ring-white/40" alt="" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center text-xs font-bold">
              {item.channel?.[0] ?? "N"}
            </div>
          )}
          <div className="font-bold text-sm">{item.reporter_name ?? item.channel}</div>
          {item.tag && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/90 text-[10px] font-bold uppercase">{item.tag}</span>
          )}
        </div>
        <p className="text-sm leading-snug font-semibold line-clamp-3 text-white/95 font-display">{item.title}</p>
        <div className="mt-2 text-[11px] text-white/70 font-semibold">#{item.category}</div>
      </div>

      {/* Refresh on active reel */}
      {active && (
        <button
          onClick={() => location.reload()}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-white/15 backdrop-blur-md grid place-items-center text-white hover:bg-white/25"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  active,
  activeColor,
}: {
  icon: React.ComponentType<{ className?: string; fill?: string; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <span className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-md grid place-items-center group-hover:bg-white/25 transition active:scale-90">
        <Icon
          className={cn("h-6 w-6 transition-colors", active ? activeColor : "text-white")}
          fill={active ? "currentColor" : "none"}
          strokeWidth={active ? 0 : 2}
        />
      </span>
      <span className="text-[10px] font-bold opacity-90">{label}</span>
    </button>
  );
}

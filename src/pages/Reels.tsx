import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { fetchReels, type ReelItem } from "@/lib/queries";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function Reels() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reels"],
    queryFn: fetchReels,
  });
  const [muted, setMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] grid place-items-center bg-black text-white">
        <div className="text-sm font-semibold opacity-70">Loading reels…</div>
      </div>
    );
  }
  if (isError || !data || data.length === 0) {
    return (
      <div className="h-[100dvh] grid place-items-center bg-black text-white">
        <EmptyState
          title="రీల్స్ లోడ్ కాలేదు"
          hint="తాజా రీల్స్ కోసం మళ్లీ ప్రయత్నించండి."
          onRetry={() => refetch()}
        />
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
          active={i === activeIdx}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
        />
      ))}
    </div>
  );
}

function ReelItemView({
  item,
  active,
  muted,
  onToggleMute,
}: {
  item: ReelItem;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const src = `https://www.youtube.com/embed/${item.youtube_id}?autoplay=${active ? 1 : 0}&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${item.youtube_id}&rel=0`;

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-full w-full max-w-[480px] mx-auto aspect-[9/16] bg-black">
          {active ? (
            <iframe
              key={item.id}
              src={src}
              title={item.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
            />
          ) : item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          ) : null}
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
        <ActionBtn icon={Share2} label="షేర్" onClick={() => navigator.share?.({ title: item.title, url: `https://youtu.be/${item.youtube_id}` })} />
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

      {/* Refresh on first reel */}
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <span className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-md grid place-items-center group-hover:bg-white/25 transition">
        <Icon className={cn("h-6 w-6 transition-colors", active ? activeColor : "text-white")} strokeWidth={active ? 0 : 2} fill={active ? "currentColor" : "none"} />
      </span>
      <span className="text-[10px] font-bold opacity-90">{label}</span>
    </button>
  );
}

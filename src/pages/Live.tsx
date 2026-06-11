import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ExternalLink } from "lucide-react";
import { fetchLiveChannels, type LiveChannel } from "@/lib/queries";
import { EmptyState, SkeletonCard } from "@/components/EmptyState";

export default function Live() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["live"],
    queryFn: fetchLiveChannels,
  });
  const [open, setOpen] = useState<LiveChannel | null>(null);

  return (
    <div className="px-4 pt-5 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">లైవ్ టీవీ</h1>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">24/7 తెలుగు న్యూస్ ఛానెళ్లు</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-live/15 text-live text-[10px] font-bold uppercase tracking-wider">
          <span className="relative h-2 w-2"><span className="live-dot" /><span className="absolute inset-0 rounded-full bg-live" /></span>
          On Air
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {isError && (
        <EmptyState title="ఛానెళ్లు లోడ్ కాలేదు" onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-3">
          {(data ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setOpen(c)}
              className="rise-in text-left rounded-2xl bg-card border border-border overflow-hidden hover:bg-card-elevated transition group"
            >
              <div className="aspect-video bg-card-elevated relative overflow-hidden">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary-soft to-card font-display text-xl font-extrabold text-primary">
                    {c.logo_text}
                  </div>
                )}
                <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 h-6 rounded-full bg-live text-white text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="relative h-1.5 w-1.5">
                    <span className="live-dot" />
                    <span className="absolute inset-0 rounded-full bg-white" />
                  </span>
                  {c.badge}
                </div>
              </div>
              <div className="p-3">
                <div className="font-display text-sm font-bold truncate">{c.channel_name}</div>
                {c.description && (
                  <div className="text-[11px] text-muted-foreground font-semibold line-clamp-1 mt-0.5">{c.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && <LivePlayer channel={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function LivePlayer({ channel, onClose }: { channel: LiveChannel; onClose: () => void }) {
  const src = channel.video_id
    ? `https://www.youtube.com/embed/${channel.video_id}?autoplay=1&mute=0&playsinline=1`
    : `https://www.youtube.com/embed/live_stream?channel=${channel.channel_id}&autoplay=1`;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 text-white">
        <div className="min-w-0">
          <div className="font-display font-extrabold truncate">{channel.channel_name}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">Live broadcast</div>
        </div>
        <button onClick={onClose} className="h-10 w-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 grid place-items-center px-2">
        <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-white/10">
          <iframe
            src={src}
            title={channel.channel_name}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
            style={{ border: 0 }}
          />
        </div>
      </div>
      <div className="p-4 text-center">
        <a
          href={channel.official_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/20"
        >
          అధికారిక ఛానెల్ <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

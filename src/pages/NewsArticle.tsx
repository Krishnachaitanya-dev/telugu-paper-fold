import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, ShieldCheck, ExternalLink, Clock } from "lucide-react";
import { fetchNewsById } from "@/lib/queries";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/utils";

export default function NewsArticle() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["news", id],
    queryFn: () => fetchNewsById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-64 bg-card rounded-2xl" />
        <div className="h-6 w-3/4 bg-card rounded" />
        <div className="h-4 w-full bg-card rounded" />
        <div className="h-4 w-5/6 bg-card rounded" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="వార్త దొరకలేదు" hint="ఈ కథనం తొలగించబడి ఉండవచ్చు." onRetry={() => refetch()} />;
  }

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: data.title, text: data.description, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("లింక్ కాపీ అయింది");
      }
    } catch {}
  };

  return (
    <article className="rise-in pb-10">
      <div className="relative">
        {data.image_url && (
          <div className="aspect-[16/10] w-full overflow-hidden">
            <img src={data.image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <Link
            to="/"
            className="h-10 w-10 grid place-items-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button
            onClick={onShare}
            className="h-10 w-10 grid place-items-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-4 relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full bg-primary-soft text-primary text-[10px] font-bold uppercase tracking-wider">
            {data.category}
          </span>
          {data.fact_check_status === "verified" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/15 text-success text-[10px] font-bold">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{data.title}</h1>

        <div className="flex items-center gap-3 mt-4 pb-4 border-b border-border">
          {data.reporter_avatar_url ? (
            <img src={data.reporter_avatar_url} className="h-9 w-9 rounded-full ring-1 ring-border" alt="" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-card grid place-items-center text-xs font-bold text-muted-foreground">
              {(data.reporter_name ?? "N")[0]}
            </div>
          )}
          <div className="text-xs leading-tight">
            <div className="font-bold text-foreground">{data.reporter_name ?? "Newsroom"}</div>
            <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" /> {timeAgo(data.created_at)}
            </div>
          </div>
        </div>

        <p className="mt-5 text-[15px] leading-7 text-foreground/90 whitespace-pre-line">{data.description}</p>

        {data.source_url && (
          <a
            href={data.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-card border border-border text-sm font-bold hover:bg-card-elevated"
          >
            మూలాన్ని చూడండి <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

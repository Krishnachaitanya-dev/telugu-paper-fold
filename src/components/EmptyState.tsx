import { RefreshCw, Inbox, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  hint,
  onRetry,
  icon: Icon = Inbox,
  tone = "default",
}: {
  title: string;
  hint?: string;
  onRetry?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "error" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", dark && "text-white")}>
      <div
        className={cn(
          "h-16 w-16 rounded-2xl grid place-items-center mb-4 ring-1",
          dark ? "bg-white/10 ring-white/20" : "bg-card ring-border"
        )}
      >
        <Icon className={cn("h-7 w-7", tone === "error" ? "text-accent" : dark ? "text-white/80" : "text-muted-foreground")} />
      </div>
      <h3 className="font-display text-lg font-bold mb-1">{title}</h3>
      {hint && <p className={cn("text-sm max-w-xs", dark ? "text-white/70" : "text-muted-foreground")}>{hint}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition"
        >
          <RefreshCw className="h-4 w-4" /> మళ్లీ ప్రయత్నించండి
        </button>
      )}
    </div>
  );
}

export function ErrorState(props: Omit<Parameters<typeof EmptyState>[0], "icon">) {
  return <EmptyState {...props} icon={AlertTriangle} tone={props.tone ?? "error"} />;
}

/* ───────── Skeletons ───────── */

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("relative overflow-hidden bg-card-elevated", className)}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
  </div>;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card overflow-hidden border border-border">
      <Shimmer className="h-48" />
      <div className="p-4 space-y-3">
        <Shimmer className="h-3 w-20 rounded" />
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function SkeletonNewsFull() {
  return (
    <section className="h-[calc(100dvh-9.5rem)] w-full flex flex-col bg-background">
      <Shimmer className="h-[42%] w-full" />
      <div className="flex-1 px-5 pt-4 space-y-3">
        <Shimmer className="h-6 w-11/12 rounded" />
        <Shimmer className="h-6 w-3/4 rounded" />
        <div className="flex gap-2 pt-1">
          <Shimmer className="h-5 w-5 rounded-full" />
          <Shimmer className="h-3 w-32 rounded" />
        </div>
        <div className="space-y-2 pt-3">
          <Shimmer className="h-3 w-full rounded" />
          <Shimmer className="h-3 w-full rounded" />
          <Shimmer className="h-3 w-10/12 rounded" />
          <Shimmer className="h-3 w-9/12 rounded" />
        </div>
        <div className="flex gap-2 pt-4">
          <Shimmer className="h-9 w-24 rounded-full" />
          <Shimmer className="h-9 w-20 rounded-full" />
          <Shimmer className="h-9 w-28 rounded-full ml-auto" />
        </div>
      </div>
    </section>
  );
}

export function SkeletonReel() {
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black grid place-items-center">
      <div className="relative h-full w-full max-w-[480px] mx-auto bg-neutral-900">
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
        <div className="absolute left-0 right-16 bottom-28 px-5 space-y-2">
          <div className="flex items-center gap-2">
            <Shimmer className="h-8 w-8 rounded-full" />
            <Shimmer className="h-3 w-24 rounded" />
          </div>
          <Shimmer className="h-4 w-11/12 rounded" />
          <Shimmer className="h-4 w-8/12 rounded" />
        </div>
        <div className="absolute right-3 bottom-32 flex flex-col gap-5">
          {[0,1,2,3].map(i => <Shimmer key={i} className="h-12 w-12 rounded-full" />)}
        </div>
      </div>
    </section>
  );
}

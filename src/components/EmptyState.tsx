import { RefreshCw, Inbox } from "lucide-react";

export function EmptyState({
  title,
  hint,
  onRetry,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  onRetry?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="h-16 w-16 rounded-2xl bg-card grid place-items-center mb-4 ring-1 ring-border">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-bold mb-1">{title}</h3>
      {hint && <p className="text-sm text-muted-foreground max-w-xs">{hint}</p>}
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

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card overflow-hidden border border-border animate-pulse">
      <div className="h-48 bg-card-elevated" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-card-elevated rounded" />
        <div className="h-4 w-full bg-card-elevated rounded" />
        <div className="h-4 w-3/4 bg-card-elevated rounded" />
      </div>
    </div>
  );
}

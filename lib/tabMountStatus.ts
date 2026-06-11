// Lightweight pub/sub used to confirm that the tab navigator actually mounted
// after the splash screen dismisses. RootLayout shows a fallback UI if no
// tab screen reports `mark()` within a small grace window.

type Status = "pending" | "mounted";

let status: Status = "pending";
const listeners = new Set<(s: Status) => void>();

export function markTabsMounted(source: string) {
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.log(`[Lifecycle] tab mounted: ${source}`);
  }
  if (status === "mounted") return;
  status = "mounted";
  listeners.forEach((l) => l(status));
}

export function getTabMountStatus(): Status {
  return status;
}

export function subscribeTabMountStatus(cb: (s: Status) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

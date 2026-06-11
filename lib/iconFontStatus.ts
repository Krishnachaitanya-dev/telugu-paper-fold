type Status = "loading" | "loaded" | "failed";

let status: Status = "loading";
const listeners = new Set<(s: Status) => void>();

export function getIconFontStatus(): Status {
  return status;
}

export function setIconFontStatus(next: Status) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l(status));
}

export function subscribeIconFontStatus(cb: (s: Status) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

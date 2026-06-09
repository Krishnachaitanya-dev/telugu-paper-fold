export function sanitizePlainText(input: string, maxLength = 1000): string {
  return input
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function isLikelySpam(input: string): boolean {
  const clean = input.trim();
  if (!clean) return true;
  if (clean.length > 2000) return true;
  const links = clean.match(/https?:\/\//gi)?.length ?? 0;
  if (links > 3) return true;
  const repeated = /(.)\1{12,}/.test(clean);
  return repeated;
}

export function assertSafeMessage(input: string): string {
  const sanitized = sanitizePlainText(input, 1000);
  if (isLikelySpam(sanitized)) {
    throw new Error("Message blocked by anti-spam controls.");
  }
  return sanitized;
}

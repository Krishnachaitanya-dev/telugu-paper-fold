import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "ఇప్పుడే";
  if (diff < 3600) return `${Math.floor(diff / 60)} నిమి`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} గం`;
  return `${Math.floor(diff / 86400)} రోజుల`;
}

import { runtimeConfig, hasSupabaseConfig } from "@/config/env";
import { requestJson } from "@/lib/api/apiClient";

const BASE_HEADERS = () => ({
  apikey: runtimeConfig.supabaseAnonKey,
  Authorization: `Bearer ${runtimeConfig.supabaseAnonKey}`,
  "Content-Type": "application/json",
});

export async function selectPublicRows<T>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  if (!hasSupabaseConfig) return [];
  const url = new URL(`${runtimeConfig.supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));
  return requestJson<T[]>(url.toString(), { headers: BASE_HEADERS() });
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type RssSource = {
  name: string;
  feed_url: string;
  category: string;
};

type NewsItem = {
  title: string;
  description: string | null;
  image_url: string | null;
  source_url: string;
  source_name: string;
  category: string;
};

const allowedOrigin = Deno.env.get("APP_CORS_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeEntities(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripHtml(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function pick(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeEntities(m[1]).trim() : null;
}

function pickAttr(xml: string, tag: string, attr: string) {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*\\/?>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(s: string, limit = 80) {
  const words = s.trim().split(/\s+/).filter(Boolean);
  return words.length <= limit ? s.trim() : words.slice(0, limit).join(" ");
}

function extractImage(itemXml: string) {
  const media = pickAttr(itemXml, "media:content", "url") || pickAttr(itemXml, "media:thumbnail", "url");
  if (media) return media;

  const enc = pickAttr(itemXml, "enclosure", "url");
  if (enc) return enc;

  const content = pick(itemXml, "content:encoded") || pick(itemXml, "description") || "";
  const img = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return img ? img[1] : null;
}

async function summarize80(text: string) {
  const clean = stripHtml(text).slice(0, 4000);
  if (!clean || wordCount(clean) <= 80) return clean;

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) return truncateWords(clean);

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text:
              "Summarize the following news text in 80 words or less. " +
              "Keep the same language as the input, preserve names and factual claims, " +
              "and return only the summary.\n\n" +
              clean,
          }],
        }],
        generationConfig: {
          maxOutputTokens: 140,
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini summarize failed", res.status, await res.text());
      return truncateWords(clean);
    }

    const data = await res.json();
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return summary ? truncateWords(summary) : truncateWords(clean);
  } catch (e) {
    console.error("Gemini summarize error", e);
    return truncateWords(clean);
  }
}

async function parseFeed(feedUrl: string, sourceName: string, category: string, limit: number) {
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TeluguENewspaperBot/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!res.ok) {
    console.error(`feed ${feedUrl} returned ${res.status}`);
    return [] as NewsItem[];
  }

  const xml = await res.text();
  const items: NewsItem[] = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  let m;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[0];
    const title = pick(block, "title");
    const link = pick(block, "link");
    const desc = pick(block, "content:encoded") || pick(block, "description");
    const image = extractImage(block);

    if (!title || !link) continue;

    items.push({
      title: stripHtml(title).slice(0, 280),
      description: desc ? await summarize80(desc) : null,
      image_url: image,
      source_url: link.trim(),
      source_name: sourceName,
      category,
    });

    if (items.length >= limit) break;
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const cronSecret = Deno.env.get("INGEST_CRON_SECRET");
    if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase server environment");

    const requestBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limitPerFeed = Math.max(1, Math.min(Number(requestBody.limitPerFeed ?? 25), 50));
    const dryRun = Boolean(requestBody.dryRun);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: sources, error: srcErr } = await supabase
      .from("rss_sources")
      .select("name, feed_url, category")
      .eq("is_active", true);

    if (srcErr) throw srcErr;

    const all: NewsItem[] = [];
    for (const source of (sources || []) as RssSource[]) {
      try {
        all.push(...await parseFeed(source.feed_url, source.name, source.category, limitPerFeed));
      } catch (e) {
        console.error("feed error", source.feed_url, e);
      }
    }

    const seen = new Set<string>();
    const unique = all.filter((item) => {
      if (!item.source_url || seen.has(item.source_url)) return false;
      seen.add(item.source_url);
      return true;
    });

    const urls = unique.map((i) => i.source_url);
    let existing = new Set<string>();
    if (urls.length) {
      const { data } = await supabase.from("news_updates").select("source_url").in("source_url", urls);
      existing = new Set((data || []).map((r: { source_url: string }) => r.source_url));
    }

    const fresh = unique.filter((item) => !existing.has(item.source_url));
    let inserted = 0;

    if (fresh.length && !dryRun) {
      const { error, count } = await supabase.from("news_updates").insert(fresh, { count: "exact" });
      if (error) throw error;
      inserted = count ?? fresh.length;
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (!dryRun) await supabase.from("news_updates").delete().lt("created_at", cutoff);

    return json({
      ok: true,
      feeds: sources?.length ?? 0,
      fetched: all.length,
      unique: unique.length,
      inserted,
      dryRun,
      summarizedBy: Deno.env.get("GEMINI_API_KEY") ? GEMINI_MODEL : "local-truncate-fallback",
    });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

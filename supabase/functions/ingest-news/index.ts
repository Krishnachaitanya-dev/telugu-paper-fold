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

type ExistingNewsRow = {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
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

function extractReadableText(html: string) {
  return stripHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer\b[\s\S]*?<\/footer>/gi, " "),
  );
}

function extractMetaDescription(html: string) {
  const meta =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  return meta ? stripHtml(meta[1]) : "";
}

function extractParagraphText(html: string) {
  const paragraphs = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  return paragraphs
    .map(stripHtml)
    .filter((text) => wordCount(text) >= 5)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyNavigationText(text: string) {
  const lower = text.toLowerCase();
  return (
    lower.includes("web stories") ||
    text.includes("వార్తలు ఆంధ్రప్రదేశ్ తెలంగాణ జాతీయం") ||
    text.includes("సినిమాలు సినిమా న్యూస్ స్పెషల్స్") ||
    text.includes("T20 వరల్డ్ కప్")
  );
}

async function fetchArticleText(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TeluguENewspaperBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const metaDescription = extractMetaDescription(html);
    const articleMatch =
      html.match(/<article\b[\s\S]*?<\/article>/i) ||
      html.match(/<main\b[\s\S]*?<\/main>/i);
    const scopedHtml = articleMatch?.[0] ?? html;
    const paragraphText = extractParagraphText(scopedHtml);
    if (wordCount(paragraphText) >= 40 && !isLikelyNavigationText(paragraphText)) {
      return paragraphText.slice(0, 8000);
    }

    if (articleMatch) {
      const articleText = extractReadableText(articleMatch[0]);
      if (wordCount(articleText) >= 40 && !isLikelyNavigationText(articleText)) {
        return articleText.slice(0, 8000);
      }
    }

    return isLikelyNavigationText(metaDescription) ? "" : metaDescription;
  } catch (e) {
    console.error("article fetch error", url, e);
    return "";
  }
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
              "Write a concise news summary in the same language as the input. " +
              "Use 75 to 80 words when the source has enough detail, and never exceed 80 words. " +
              "Preserve names, numbers, places, and factual claims. Do not invent missing details. " +
              "Return only the summary.\n\n" +
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

async function summarizeFromSource(sourceUrl: string, fallbackText: string | null, title?: string | null) {
  const fallback = fallbackText ? stripHtml(fallbackText) : "";
  const article = await fetchArticleText(sourceUrl);
  const safeFallback = isLikelyNavigationText(fallback) ? (title ?? "") : fallback;
  const sourceText = wordCount(article) >= 40 ? article : safeFallback;
  return sourceText ? await summarize80(sourceText) : null;
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
      description: await summarizeFromSource(link.trim(), desc, title),
      image_url: image,
      source_url: link.trim(),
      source_name: sourceName,
      category,
    });

    if (items.length >= limit) break;
  }

  return items;
}

async function backfillRecentSummaries(
  supabase: ReturnType<typeof createClient>,
  limit: number,
) {
  if (limit <= 0) return { checked: 0, updated: 0 };

  const { data, error } = await supabase
    .from("news_updates")
    .select("id, title, description, source_url")
    .not("source_url", "is", null)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  let updated = 0;
  for (const row of (data || []) as ExistingNewsRow[]) {
    const currentWords = wordCount(row.description ?? "");
    const isCleanTargetLength = currentWords >= 75 && currentWords <= 80;
    if (!row.source_url || (isCleanTargetLength && !isLikelyNavigationText(row.description ?? ""))) continue;

    const summary = await summarizeFromSource(row.source_url, row.description, row.title);
    if (!summary || summary === row.description) continue;

    const { error: updateError } = await supabase
      .from("news_updates")
      .update({ description: summary })
      .eq("id", row.id);

    if (updateError) throw updateError;
    updated += 1;
  }

  return { checked: data?.length ?? 0, updated };
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
    const backfillLimit = Math.max(0, Math.min(Number(requestBody.backfillLimit ?? 50), 200));
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

    const backfill = dryRun
      ? { checked: 0, updated: 0 }
      : await backfillRecentSummaries(supabase, backfillLimit);

    return json({
      ok: true,
      feeds: sources?.length ?? 0,
      fetched: all.length,
      unique: unique.length,
      inserted,
      backfill,
      dryRun,
      summarizedBy: Deno.env.get("GEMINI_API_KEY") ? GEMINI_MODEL : "local-truncate-fallback",
    });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

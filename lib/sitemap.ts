const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const restHeaders = hasSupabase
  ? {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
      accept: 'application/json',
    }
  : undefined;

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!hasSupabase) return null; // graceful no-op when env not configured
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: restHeaders as Record<string, string>,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: string;
  priority?: number;
};

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const base = APP_URL.replace(/\/$/, '');
  const entries: SitemapEntry[] = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/browse`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  if (hasSupabase) {
    const streams = await fetchJson<Array<{ slug: string; updated_at?: string }>>(
      'streams?select=slug,updated_at&visibility=eq.public'
    );
    if (Array.isArray(streams)) {
      for (const s of streams) {
        if (!s?.slug) continue;
        entries.push({
          url: `${base}/watch/${encodeURIComponent(s.slug)}`,
          lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
          changeFrequency: 'hourly',
          priority: 0.8,
        });
      }
    }

    const blogs = await fetchJson<Array<{ slug: string; updated_at?: string; published_at?: string }>>(
      'blogs?select=slug,updated_at,published_at&published=eq.true'
    );
    if (Array.isArray(blogs)) {
      for (const b of blogs) {
        if (!b?.slug) continue;
        entries.push({
          url: `${base}/blog/${encodeURIComponent(b.slug)}`,
          lastModified: b.updated_at
            ? new Date(b.updated_at)
            : b.published_at
            ? new Date(b.published_at)
            : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  }

  return entries;
}

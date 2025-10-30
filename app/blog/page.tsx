import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Blog – Inswinger',
  description: 'Latest articles, sports news and updates aggregated alongside internal posts.',
  alternates: { canonical: `${APP_URL}/blog` },
  openGraph: {
    title: 'Blog – Inswinger',
    description: 'Latest articles, sports news and updates.',
    url: `${APP_URL}/blog`,
    siteName: 'Inswinger',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog – Inswinger',
    description: 'Latest articles, sports news and updates.',
  },
};

export const revalidate = 300; // revalidate blog list every 5 minutes

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// REMOVE hard throw; gracefully degrade when env missing
const restHeaders = SUPABASE_URL && SUPABASE_ANON_KEY ? {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  accept: 'application/json',
} : undefined as any;

// If env missing, return [] so page still renders
async function fetchFromSupabase(path: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: restHeaders,
    // allow ISR instead of forcing no-store to reduce repeated DB calls
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error: ${res.status} ${text}`);
  }
  return res.json();
}

// lightweight RSS parser (server-side)
function sanitizeTitle(raw?: string | null) {
  if (!raw) return '';
  let t = String(raw).trim();
  t = t.replace(/<!\[CDATA\[(.*?)\]\]>/i, '$1');
  t = t.replace(/^[\u0022\u0027\u2018\u2019\u201C\u201D]+|[\u0022\u0027\u2018\u2019\u201C\u201D]+$/g, '').trim();
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#8217;': "'", '&#8216;': "'", '&#8220;': '"', '&#8221;': '"',
  };
  t = t.replace(/&[#A-Za-z0-9]+;/g, (m) => entities[m] ?? m);
  return t;
}

function parseRssSimple(xml: string, source = 'rss') {
  try {
    const items: { id: string; title: string; link?: string; pubDate?: string; snippet?: string; thumbnail?: string; source?: string }[] = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml))) {
      const block = match[1];
      const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(block);
      const linkMatch = /<link\b[^>]*>([\s\S]*?)<\/link>/i.exec(block);
      const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(block);
      const pubMatch = /<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i.exec(block) || /<dc:date\b[^>]*>([\s\S]*?)<\/dc:date>/i.exec(block);
      const descMatch = /<description\b[^>]*>([\s\S]*?)<\/description>/i.exec(block) || /<content:encoded\b[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(block);
      const enclosureMatch = /<enclosure[^>]*url=["']([^"']+)["']/i.exec(block);

      const rawTitle = titleMatch ? titleMatch[1].trim() : 'Untitled';
      const title = sanitizeTitle(rawTitle);
      const link = linkMatch ? linkMatch[1].trim() : guidMatch ? guidMatch[1].trim() : undefined;
      const pubDate = pubMatch ? new Date(pubMatch[1].trim()).toISOString() : undefined;
      let snippet = descMatch ? descMatch[1].trim() : undefined;
      if (snippet) snippet = snippet.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 320);
      const thumbnail = enclosureMatch ? enclosureMatch[1] : undefined;

      items.push({ id: (link || title).slice(0, 200), title, link, pubDate, snippet, thumbnail, source });
    }
    return items;
  } catch (e) {
    return [];
  }
}

export default async function BlogListPage() {
  // fetch internal blogs from Supabase (server REST)
  const dbPromise = fetchFromSupabase(
    'blogs?select=id,slug,title,excerpt,featured_image,published_at,author_id&published=eq.true&order=published_at.desc&limit=50'
  ).catch(() => []);

  // fetch external RSS feeds server-side to avoid CORS
  const rssFeeds = [
    { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport' },
    { url: 'https://www.theguardian.com/uk/sport/rss', source: 'The Guardian' },
    { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN' },
  ];

  const rssPromises = rssFeeds.map(async (f) => {
    try {
      const res = await fetch(f.url, { next: { revalidate: 3600 } }); // cache external feeds for 1 hour
      if (!res.ok) return [];
      const txt = await res.text();
      return parseRssSimple(txt, f.source);
    } catch {
      return [];
    }
  });

  const [dbRows, rssResults] = await Promise.all([dbPromise, Promise.all(rssPromises)]);
  const internal = Array.isArray(dbRows) ? dbRows.map((r: any) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? '',
    featured_image: r.featured_image ?? null,
    published_at: r.published_at ?? null,
    author_id: r.author_id ?? null,
    source: 'internal',
    isExternal: false,
    url: `/blog/${r.slug}`,
  })) : [];

  // flatten and dedupe external articles
  const externalFlat = ([] as any[]).concat(...rssResults).filter(it => it.link && it.title);
  const seen = new Set<string>();
  const external = externalFlat.filter((it) => {
    const key = (it.link || it.title).toString();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30).map(it => ({
    id: it.id,
    title: it.title,
    excerpt: it.snippet ?? '',
    featured_image: it.thumbnail ?? null,
    published_at: it.pubDate ?? null,
    source: it.source ?? 'External',
    isExternal: true,
    url: it.link,
  }));

  // Merge internal first, then external (alternatively you can interleave)
  const combined = [...internal, ...external];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-slate-600">Latest articles, news and updates — internal posts and curated external pieces.</p>
        </div>

        {combined.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-slate-600 mb-4">Check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combined.map((b: any) => (
              <Card key={b.id} className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <div className="relative aspect-video bg-slate-200 rounded-t overflow-hidden">
                  {b.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.featured_image}
                      alt={b.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-white opacity-80 font-semibold">{b.isExternal ? 'Article' : 'Article'}</span>
                    </div>
                  )}

                  <Link
                    href={b.isExternal ? b.url : `/blog/${b.slug}`}
                    target={b.isExternal ? '_blank' : undefined}
                    rel={b.isExternal ? 'noopener noreferrer' : undefined}
                    className="absolute inset-0 flex items-end justify-end p-4 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Read more about ${sanitizeTitle(b.title)}`}
                  >
                    <span className="bg-white/95 text-sm font-semibold text-slate-900 px-3 py-1 rounded shadow">
                      Read more
                    </span>
                  </Link>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">{sanitizeTitle(b.title)}</h3>

                  <div className="text-sm text-slate-600 mb-4">
                    {b.excerpt ? (
                      <div className="space-y-2" dangerouslySetInnerHTML={{ __html: sanitizeContent(b.excerpt) }} />
                    ) : (
                      <div className="text-slate-600">{b.source}</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      {b.published_at ? new Date(b.published_at).toLocaleDateString() : ''}
                      {b.source ? ` • ${b.source}` : ''}
                      {b.isExternal ? ' • External' : ''}
                    </div>
                    <Link
                      href={b.isExternal ? b.url : `/blog/${b.slug}`}
                      target={b.isExternal ? '_blank' : undefined}
                      rel={b.isExternal ? 'noopener noreferrer' : undefined}
                      className="ml-auto"
                      aria-label={b.isExternal ? `Read on source: ${sanitizeTitle(b.title)}` : `Read more about ${sanitizeTitle(b.title)}`}
                    >
                      <Button size="sm">{b.isExternal ? 'Read on source' : 'Read more'}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// minimal sanitizer for excerpts/snippets (keeps simple tags, escapes otherwise)
function sanitizeContent(input?: string | null) {
  if (!input) return '';
  const t = String(input);
  // if contains HTML tags, strip scripts and unsafe tags
  if (/[<][a-z][\s\S]*[>]/i.test(t)) {
    // remove script/style tags
    return t.replace(/<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/gi, '').trim();
  }
  // plain text -> convert newlines to <p> blocks
  const normalized = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const paragraphs = normalized.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
  return paragraphs.map(p => escapeHtml(p).replace(/\n/g, '<br/>')).map(p => `<p>${p}</p>`).join('');
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

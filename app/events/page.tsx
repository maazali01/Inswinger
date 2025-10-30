import Link from 'next/link';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Server page that aggregates upcoming sports events and news articles
 * from public RSS/JSON endpoints and displays a responsive events page.
 *
 * Notes:
 * - This is a simple aggregator for demo/dev purposes and does NOT
 *   replace proper APIs or scraping pipelines.
 * - Feeds/endpoints chosen are public RSS/JSON endpoints (ESPN + BBC + The Guardian).
 * - Parsing is intentionally lightweight and defensive.
 */

export const metadata: Metadata = {
  title: 'Events & Sports News – Inswinger',
  description: 'Upcoming sports events and latest articles aggregated from public sources.',
  alternates: { canonical: `${APP_URL}/events` },
  openGraph: {
    title: 'Events & Sports News – Inswinger',
    description: 'Upcoming sports events and latest articles.',
    url: `${APP_URL}/events`,
    siteName: 'Inswinger',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events & Sports News – Inswinger',
    description: 'Upcoming sports events and latest articles.',
  },
};

export const revalidate = 600; // cache events page for 10 minutes

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchFromSupabase(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      accept: 'application/json',
    },
    next: { revalidate: 600 }, // use ISR instead of no-store
  });
  if (!res.ok) {
    throw new Error(`Supabase REST error: ${res.status}`);
  }
  return res.json();
}

async function fetchJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 600 } }); // cache external JSON for 10m
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return res.json();
}

async function fetchText(url: string) {
  const res = await fetch(url, { next: { revalidate: 3600 } }); // RSS can be cached longer
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return res.text();
}

// lightweight RSS parser for server-side use: extracts <item> blocks with title/link/pubDate/description/enclosure
function parseRss(xml: string, source = 'rss'): ArticleItem[] {
  try {
    // normalize
    const items: ArticleItem[] = [];
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
      if (snippet) {
        // strip HTML tags lightly for snippet
        snippet = snippet.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 300);
      }
      const thumbnail = enclosureMatch ? enclosureMatch[1] : undefined;

      items.push({
        id: (link || title).slice(0, 200),
        title,
        link,
        pubDate,
        snippet,
        thumbnail,
        source,
      });
    }
    return items;
  } catch (e) {
    return [];
  }
}

// add: sanitize title helper (strip CDATA, trim quotes, decode common entities)
function sanitizeTitle(raw?: string | null) {
	 if (!raw) return '';
	 let t = String(raw).trim();

	 // unwrap CDATA if present
	 t = t.replace(/<!\[CDATA\[(.*?)\]\]>/i, '$1');

	 // remove surrounding quotes/apostrophes (straight and curly)
	 t = t.replace(/^[\u0022\u0027\u2018\u2019\u201C\u201D]+|[\u0022\u0027\u2018\u2019\u201C\u201D]+$/g, '').trim();

	 // decode a few common HTML entities
	 const entities: Record<string, string> = {
		 '&amp;': '&',
		 '&lt;': '<',
		 '&gt;': '>',
		 '&quot;': '"',
		 '&#39;': "'",
		 '&#8217;': "'",
		 '&#8216;': "'",
		 '&#8220;': '"',
		 '&#8221;': '"',
	 };
	 t = t.replace(/&[#A-Za-z0-9]+;/g, (m) => entities[m] ?? m);

	 return t;
}

// Add: readable date formatter
function formatEventDate(iso?: string) {
  if (!iso) return 'Date TBA';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(iso as string).toLocaleString();
  }
}

// parse ESPN scoreboard JSON for upcoming events (NFL example). The structure varies; be defensive.
function parseEspnScoreboardJson(json: any, sportLabel = 'ESPN') : EventItem[] {
  try {
    const events: EventItem[] = [];
    const competitions = json?.events || json?.competitions || [];
    // Some ESPN endpoints have events array, others nested; normalize
    const arr = Array.isArray(competitions) ? competitions : [];
    for (const ev of arr) {
      // competition may contain competitors, date, name
      const id = ev?.id || ev?.uid || (ev.name ? ev.name.slice(0, 64) : Math.random().toString(36));
      const title = ev?.name || ev?.shortName || [ev?.competitions?.[0]?.competitors?.map((c:any)=>c?.team?.displayName).join(' vs ')].join('') || 'Event';
      const link = Array.isArray(ev?.links) && ev?.links[0]?.href ? ev.links[0].href : ev?.links?.web?.href || undefined;
      const date = ev?.date || ev?.startDate || ev?.competitions?.[0]?.date || undefined;
      const league = json?.sport?.name || ev?.league?.name || undefined;
      const thumbnail = ev?.competitions?.[0]?.broadcast?.network?.logo || ev?.competitions?.[0]?.competitors?.[0]?.team?.logo || undefined;

      events.push({
        id: String(id),
        title: String(title),
        link,
        start: date ? new Date(date).toISOString() : undefined,
        league,
        thumbnail,
        source: sportLabel,
      });
    }
    return events;
  } catch (e) {
    return [];
  }
}

export default async function EventsPage() {
  const rssFeeds = [
    { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport - Football' },
    { url: 'https://www.theguardian.com/uk/sport/rss', source: 'The Guardian - Sport' },
    { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN - Soccer' },
  ];

  const espnEndpoints = [
    { url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', source: 'ESPN NFL' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', source: 'ESPN Soccer (EPL)' },
  ];

  // NEW: fetch custom events from database
  const customEventsPromise = fetchFromSupabase(
    'events?select=id,title,start_time,sport_type,event_url,thumbnail_url,description&order=start_time.asc&limit=200'
  ).catch(() => []);

  // perform fetches in parallel
  const rssPromises = rssFeeds.map(async (f) => {
    try {
      const txt = await fetchText(f.url);
      return parseRss(txt, f.source);
    } catch (e) {
      return [] as ArticleItem[];
    }
  });

  const espnPromises = espnEndpoints.map(async (e) => {
    try {
      const json = await fetchJson(e.url);
      return parseEspnScoreboardJson(json, e.source);
    } catch (err) {
      return [] as EventItem[];
    }
  });

  const [rssResults, espnResults, customEventsRows] = await Promise.all([
    Promise.all(rssPromises),
    Promise.all(espnPromises),
    customEventsPromise,
  ]);

  // flatten lists
  const articles: ArticleItem[] = ([] as ArticleItem[]).concat(...rssResults).slice(0, 80);
  const events: EventItem[] = ([] as EventItem[]).concat(...espnResults).filter(ev => !!ev.start).slice(0, 80);

  // sort events by start date ascending (upcoming first)
  events.sort((a, b) => {
    const da = a.start ? new Date(a.start).getTime() : 0;
    const db = b.start ? new Date(b.start).getTime() : 0;
    return da - db;
  });

  // simple dedupe by link/title
  const seenLinks = new Set<string>();
  const dedupArticles = articles.filter((it) => {
    const key = (it.link || it.title || '').toString();
    if (!key) return false;
    if (seenLinks.has(key)) return false;
    seenLinks.add(key);
    return true;
  }).slice(0, 20);

  // map custom events from DB to EventItem format
  const customEvents: EventItem[] = Array.isArray(customEventsRows) ? customEventsRows.map((e: any) => ({
    id: String(e.id),
    title: e.title ?? 'Event',
    link: e.event_url ?? undefined,
    start: e.start_time ? new Date(e.start_time).toISOString() : undefined,
    sport_type: e.sport_type ?? undefined,
    thumbnail: e.thumbnail_url ?? undefined,
    source: 'Inswinger (Custom)',
  })).filter(ev => !!ev.start) : [];

  // NEW: merge + keep only upcoming (>= now) and sort ascending so the closest date is on top
  const now = Date.now();
  const allEvents: EventItem[] = [...events, ...customEvents]
    .filter(ev => ev.start && new Date(ev.start).getTime() >= now)
    .sort((a, b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime());

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upcoming Sports — Events</h1>
          <p className="text-slate-600">Aggregated from public sources and custom StreamHub events.</p>
        </div>

        {/* Only Events column: single column layout */}
        <section className="grid grid-cols-1 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Upcoming Events</h2>
              <div className="text-sm text-slate-500">{allEvents.length} found</div>
            </div>

            <div className="space-y-4">
              {allEvents.length === 0 && (
                <div className="rounded-lg bg-white p-6 text-center text-slate-600">
                  No upcoming events found from sources.
                </div>
              )}

              {allEvents.map((ev) => (
                <article key={ev.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex gap-4">
                  <div className="w-24 h-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {ev.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.thumbnail} alt={sanitizeTitle(ev.title)} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        {ev.sport_type ?? ev.source ?? 'Event'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link
                      href={ev.link || '#'}
                      className="text-lg font-medium text-slate-900 hover:text-blue-600 line-clamp-2"
                      aria-label={`View details for ${sanitizeTitle(ev.title)}`}
                    >
                      {sanitizeTitle(ev.title)}
                    </Link>

                    <div className="mt-1 text-sm">
                      <span className="font-bold text-slate-900">{formatEventDate(ev.start)}</span>
                      {ev.sport_type ? <span className="ml-2 text-slate-600">• {ev.sport_type}</span> : null}
                      {ev.source ? <span className="ml-2 text-slate-600">• {ev.source}</span> : null}
                    </div>
                    <div className="mt-3 text-sm">
                      <Link
                        href={ev.link || '#'}
                        className="text-sm text-blue-600 hover:underline"
                        aria-label={`View details for ${sanitizeTitle(ev.title)}`}
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 text-center text-sm text-slate-500">
          <p>
            Aggregated feeds are fetched live from public sources for demo purposes. If you need
            tailored event feeds (schedules, fixtures), integrate official APIs (SportRadar, TheSportsDB, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}

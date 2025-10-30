import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { Play, Users, Eye } from 'lucide-react';
import HomeGate from '@/components/home/HomeGate';
import StreamsSplitView, { type StreamListItem } from '@/components/streams/StreamsSplitView';
import type { Metadata } from 'next';

const categories = [
  'NFL',
  'Football',
  'Basketball',
  'Cricket',
  'F1',
  'Tennis',
  'Boxing',
  'MMA',
  'Hockey',
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// add: server fetch helpers and mock streams
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type StreamRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  thumbnail_url: string | null;
  view_count: number;
  streamer?: { profile?: { full_name?: string | null } | null } | null;
};

const mockStreams = [
  { id: '1', title: 'NFL Sunday Night Football', streamer: 'NFL Official', viewers: 125000, thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=450&fit=crop', sport: 'NFL', isLive: true },
  { id: '2', title: 'Premier League Highlights', streamer: 'EPL Stream', viewers: 89000, thumbnail: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=450&fit=crop', sport: 'Football', isLive: false },
  { id: '3', title: 'NBA Finals Game 7', streamer: 'NBA Live', viewers: 200000, thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop', sport: 'Basketball', isLive: true },
  { id: '4', title: 'F1 Monaco Grand Prix', streamer: 'Formula1', viewers: 150000, thumbnail: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=450&fit=crop', sport: 'F1', isLive: true },
  { id: '5', title: 'Cricket World Cup Final', streamer: 'ICC', viewers: 300000, thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=450&fit=crop', sport: 'Cricket', isLive: true },
  { id: '6', title: 'Tennis Masters Final', streamer: 'ATP', viewers: 45000, thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=450&fit=crop', sport: 'Tennis', isLive: false },
];

async function fetchStreamsREST(category?: string, status?: string): Promise<StreamRow[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const params = new URLSearchParams();
  params.set('select', 'id,title,slug,category,status,thumbnail_url,view_count,streamer:streamers!inner(profile:profiles(full_name))');
  params.set('visibility', 'eq.public');
  if (category && category !== 'NFL' && category !== 'All') params.set('category', `eq.${category}`);
  if (category === 'NFL') params.set('category', 'eq.NFL');
  if (status && status !== 'all') params.set('status', `eq.${status}`);
  params.set('order', 'created_at.desc');
  params.set('limit', '50');

  // Use Next.js fetch caching (ISR) instead of no-store
  const res = await fetch(`${SUPABASE_URL}/rest/v1/streams?${params.toString()}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, accept: 'application/json' },
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export const metadata: Metadata = {
  title: 'Inswinger — Watch Live Sports',
  description: 'Watch live sports (NFL, Football, Basketball, Cricket, F1) from top streamers. Join the action live.',
  openGraph: {
    title: 'Inswinger — Watch Live Sports',
    description: 'Watch live sports from top streamers and teams. NFL, Football, Basketball and more.',
    url: APP_URL,
    siteName: 'Inswinger',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inswinger — Watch Live Sports',
    description: 'Watch live sports from top streamers and teams.',
  },
};

export const revalidate = 60; // ensure homepage is cached server-side

export default async function HomePage({ searchParams }: { searchParams?: { category?: string; status?: string; q?: string } }) {
  const category = searchParams?.category || 'All';
  const status = 'live'; // force only live streams on the homepage
  const q = (searchParams?.q || '').toLowerCase();

  let rows: StreamRow[] = [];
  try {
    rows = await fetchStreamsREST(category, status);
  } catch {
    rows = [];
  }
  const fetched = rows
    .filter((r) => r.status === 'live')
    .filter((r) => (q ? r.title.toLowerCase().includes(q) : true));
  const filteredMock = mockStreams
    .filter((s) => (category === 'All' ? true : s.sport === category))
    .filter((s) => s.isLive)
    .filter((s) => (q ? s.title.toLowerCase().includes(q) : true));
  const navCategories = ['All', 'NFL', 'Football', 'Basketball', 'Cricket', 'F1', 'Tennis', 'Boxing', 'MMA', 'Hockey'];

  // normalize items for split-view
  const splitItems: StreamListItem[] =
    (fetched.length ? fetched : filteredMock).map((s: any) => ({
      id: String(s.id),
      title: s.title,
      category: s.category ?? s.sport ?? 'Stream',
      status: s.status ?? (s.isLive ? 'live' : 'offline'),
      live: (s.status ? s.status === 'live' : s.isLive) ?? false,
      thumbnail: s.thumbnail_url || s.thumbnail || '/placeholder.png',
      streamerName: s.streamer?.profile?.full_name ?? s.streamer ?? undefined,
      viewers: s.view_count ?? s.viewers ?? 0,
      slug: s.slug ? `/watch/${s.slug}` : s.id ? `/stream/${s.id}` : undefined,
    }));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HomeGate />

      {/* Placeholder shown first to avoid guest flash; hidden by HomeGate ASAP */}
      <div id="home-placeholder" className="py-20 sm:py-28 text-center text-slate-500">
        <div className="inline-flex items-center gap-3">
          <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>

      {/* Guest hero (hidden by default; shown by HomeGate if not logged in) */}
      <section id="hero-guest" className="hidden relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
              <Play className="w-3 h-3 mr-1" />
              Now Live: 1,234 Streams
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Watch Live Sports
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                From Anywhere
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with top streamers broadcasting NFL, Football, Basketball, Cricket, and more.
              Join thousands of fans watching live right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/signup">Start Watching Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/signup/streamer">Become a Streamer</Link>
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>50K+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                <span>1M+ Streams</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer visible only for guests */}
        <footer className="bg-slate-900 text-slate-300 py-12 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-white mb-4">StreamHub</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  The premier platform for live sports streaming and entertainment.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/#streams" className="hover:text-white transition-colors">Browse Streams</Link></li>
                  <li><Link href="/events" className="hover:text-white transition-colors">Events</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">For Streamers</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/signup/streamer" className="hover:text-white transition-colors">Become a Streamer</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-sm text-slate-400 text-center">
              <p>&copy; 2025 Inswinger. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </section>

      {/* Authed content (hidden by default, shown when logged in) */}
      <div id="authed-content" className="hidden">
        {/* Sticky, mobile-friendly secondary sports navbar */}
        <div className="sticky top-16 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <nav aria-label="Sports categories" className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
            <div className="relative">
              {/* edge fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:left-4" aria-hidden />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:right-4" aria-hidden />
              <div className="flex gap-2 overflow-x-auto py-2 px-4 sm:px-0 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navCategories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}#streams`}
                    className={`snap-start min-w-max text-sm px-3 py-2 rounded-full border whitespace-nowrap ${
                      category === cat
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:text-blue-700'
                    }`}
                    prefetch={false}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* Streams list section */}
        <section id="streams" className="py-16 sm:py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Live Streams</h2>
              <div className="text-sm text-slate-500">{splitItems.length} live</div>
            </div>

            {/* replace timeline with split view */}
            <StreamsSplitView items={splitItems} />
          </div>
        </section>
      </div>
    </div>
  );
}

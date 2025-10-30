'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Users, Eye, Search, X } from 'lucide-react';
import StreamsSplitView, { type StreamListItem } from '@/components/streams/StreamsSplitView';

const CATEGORIES = ['All', 'NFL', 'Football', 'Basketball', 'Cricket', 'F1', 'Tennis', 'Boxing', 'MMA', 'Hockey', 'Other'];

// Mock stream data (sports)
const mockStreams = [
  {
    id: '1',
    title: 'NFL Sunday Night Football',
    streamer: 'NFL Official',
    viewers: 125000,
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=450&fit=crop',
    // changed: ensure category matches filter token
    sport: 'NFL',
    isLive: true,
  },
  {
    id: '2',
    title: 'Premier League Highlights',
    streamer: 'EPL Stream',
    viewers: 89000,
    thumbnail: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=450&fit=crop',
    sport: 'Football',
    isLive: false,
  },
  {
    id: '3',
    title: 'NBA Finals Game 7',
    streamer: 'NBA Live',
    viewers: 200000,
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',
    sport: 'Basketball',
    isLive: true,
  },
  {
    id: '4',
    title: 'F1 Monaco Grand Prix',
    streamer: 'Formula1',
    viewers: 150000,
    thumbnail: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=450&fit=crop',
    // changed: ensure category matches filter token
    sport: 'F1',
    isLive: true,
  },
  {
    id: '5',
    title: 'Cricket World Cup Final',
    streamer: 'ICC',
    viewers: 300000,
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=450&fit=crop',
    sport: 'Cricket',
    isLive: true,
  },
  {
    id: '6',
    title: 'Tennis Masters Final',
    streamer: 'ATP',
    viewers: 45000,
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=450&fit=crop',
    sport: 'Tennis',
    isLive: false,
  },
];

interface Stream {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  thumbnail_url: string | null;
  view_count: number;
  streamer: {
    profile_id: string;
    profile: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [statusFilter, setStatusFilter] = useState('all');

  // NEW: selection state for split view
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // SEO: runtime head tags for client page
  useEffect(() => {
    const title = 'Browse Streams – StreamHub';
    const desc = 'Discover live and upcoming sports streams across NFL, Football, Basketball, Cricket, F1, and more.';
    const canonicalHref =
      typeof window !== 'undefined'
        ? `${location.origin}/browse${location.search || ''}`
        : '/browse';

    document.title = title;

    function upsertMeta(name: string, content: string) {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }
    function upsertLink(rel: string, href: string) {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    }

    upsertMeta('description', desc);
    upsertMeta('robots', 'index, follow');
    upsertLink('canonical', canonicalHref);
  }, [selectedCategory, statusFilter, search]);

  const fetchStreams = useCallback(async () => {
    setLoading(true);
    setUseMock(false);
    try {
      let query = supabase
        .from('streams')
        .select(`
          id,
          title,
          slug,
          category,
          status,
          thumbnail_url,
          view_count,
          streamer:streamers!inner(
            profile_id,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }
      if (statusFilter === 'live') {
        query = query.eq('status', 'live');
      } else if (statusFilter === 'scheduled') {
        query = query.eq('status', 'scheduled');
      }

      const { data, error } = await query;

      // changed: fall back to mock if error OR empty result set
      if (error || !data || data.length === 0) {
        setUseMock(true);
        setStreams([]);
      } else {
        setStreams((data ?? []) as any);
        setUseMock(false);
      }
    } catch {
      setUseMock(true);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, statusFilter]);

  useEffect(() => {
    fetchStreams();
    // reset selection on filter change
    setSelectedId(null);
  }, [fetchStreams, selectedCategory, statusFilter]);

  const filteredStreams = streams.filter((stream) =>
    stream.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMockStreams = mockStreams
    .filter((s) => (selectedCategory === 'All' ? true : s.sport === selectedCategory))
    .filter((s) => (statusFilter === 'all' ? true : statusFilter === 'live' ? s.isLive : !s.isLive))
    .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  // NEW: normalize list (real or mock) to a common UI shape
  type ListItemUI = {
    id: string;
    title: string;
    category: string;
    status: string;
    live: boolean;
    thumbnail: string;
    streamerName?: string;
    viewers?: number;
    slug?: string;
  };

  const showingMock = useMock || (filteredStreams.length === 0 && filteredMockStreams.length > 0);

  const listUI: ListItemUI[] = showingMock
    ? filteredMockStreams.map((s) => ({
        id: String(s.id),
        title: s.title,
        category: s.sport,
        status: s.isLive ? 'live' : 'offline',
        live: s.isLive,
        thumbnail: s.thumbnail,
        streamerName: s.streamer,
        viewers: s.viewers,
        slug: `/stream/${s.id}`,
      }))
    : filteredStreams.map((s) => ({
        id: String(s.id),
        title: s.title,
        category: s.category,
        status: s.status,
        live: s.status === 'live',
        thumbnail: s.thumbnail_url || '/placeholder.png',
        streamerName: s.streamer?.profile?.full_name || undefined,
        viewers: s.view_count,
        slug: `/watch/${s.slug}`,
      }));

  const selected = selectedId ? listUI.find((it) => it.id === selectedId) || null : null;

  // small mock generator (same shape as StreamsSplitView)
  const getMock = (it: any) => {
    if (!it) return null;
    const seed = Number([...it.id].reduce((s: number, c: string) => s + c.charCodeAt(0), 0)) || 1;
    return {
      home: { name: it.streamerName ?? 'Home', score: (seed % 3) + (it.live ? 1 : 0) },
      away: { name: it.category ?? 'Away', score: (seed + 1) % 4 },
      time: `${30 + (seed % 30)}'`,
      possession: `${45 + (seed % 11)}%`,
      shots: { home: 6 + (seed % 6), away: 4 + ((seed + 3) % 5) },
      lineupHome: Array.from({ length: 11 }).map((_, i) => `Player ${i + 1}`),
      lineupAway: Array.from({ length: 11 }).map((_, i) => `Opponent ${i + 1}`),
      h2h: [
        { date: '2025-03-12', result: '1-2', competition: 'League' },
        { date: '2024-11-02', result: '2-0', competition: 'Cup' },
      ],
      standings: [{ team: it.streamerName ?? 'Home', pts: 62, pos: 1 }, { team: it.category ?? 'Away', pts: 58, pos: 2 }],
      metrics: { avgWatchTime: 420 + (seed % 300), peakViewers: it.viewers ?? 0 + (seed % 500), chatMessages: 10 + (seed % 100) },
    };
  };

  const selDetails = getMock(selected);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Streams</h1>
          <p className="text-slate-600">Discover live and upcoming sports streams</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search streams..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stream status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="live">Live Now</SelectItem>
                <SelectItem value="scheduled">Upcoming</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile-friendly chips row */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent sm:hidden" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent sm:hidden" aria-hidden />
          <div className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`snap-start min-w-max text-sm px-3 py-2 rounded-full border ${
                  selectedCategory === category
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* simple line skeletons for timeline */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-md shadow-sm animate-pulse" />
            ))}
          </div>
        ) : !showingMock && filteredStreams.length === 0 ? (
          <div className="text-center py-16">
            <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No streams found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your filters or check back later</p>
            <Button asChild>
              <Link href="/signup/streamer">Become a Streamer</Link>
            </Button>
          </div>
        ) : (
          // NEW: split view layout; full-width list when no selection
          <div className="grid md:grid-cols-12 gap-6">
            {/* Left: list (timeline) */}
            <div className={selected ? 'md:col-span-5' : 'md:col-span-12'}>
              <ol className="relative pl-8 before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
                {listUI.map((it) => {
                  const active = selectedId === it.id;
                  return (
                    <li
                      key={it.id}
                      className={`relative pl-6 py-4 group rounded-md border cursor-pointer transition-colors ${
                        active ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedId((prev) => (prev === it.id ? null : it.id))}
                    >
                      <span
                        className={`absolute left-2 top-6 -translate-y-1/2 w-3 h-3 rounded-full ring-4 ring-white ${
                          it.live ? 'bg-red-600' : 'bg-slate-400'
                        }`}
                      />
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.thumbnail}
                            alt={it.title}
                            className="w-28 h-16 object-cover rounded border"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {it.live && <Badge className="bg-red-600 text-white">LIVE</Badge>}
                            <Badge variant="secondary" className="text-xs">{it.category}</Badge>
                          </div>
                          <h3 className="font-semibold text-slate-900 truncate">{it.title}</h3>
                          <div className="mt-1 text-sm text-slate-600 flex items-center gap-3">
                            {it.streamerName && <span>{it.streamerName}</span>}
                            {typeof it.viewers === 'number' && (
                              <span className="inline-flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {it.viewers.toLocaleString()}
                              </span>
                            )}
                            <span className="capitalize">{it.status}</span>
                          </div>
                        </div>
                        {/* removed per request: inline Watch button in list row */}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Right: details panel (shown only when a stream is selected) */}
            {selected && (
              <aside className="md:col-span-7">
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 sm:p-6 border-b flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {selected.live && (
                          <Badge className="bg-red-600 text-white">
                            <span className="animate-pulse mr-1">●</span>
                            LIVE
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">{selected.category}</Badge>
                      </div>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">{selected.title}</h2>
                      <div className="mt-1 text-xs text-slate-600 flex items-center gap-3">
                        {selected.streamerName && <span>{selected.streamerName}</span>}
                        {typeof selected.viewers === 'number' && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {selected.viewers.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" asChild>
                        {selected.slug ? (
                          <Link href={selected.slug}>Watch</Link>
                        ) : (
                          <a href={`/stream/${selected.id}`} className="inline-flex items-center">
                            <Play className="w-4 h-4 mr-1" />
                            Watch
                          </a>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* New: display mock summary + lineups + h2h + standings */}
                    {selDetails ? (
                      <>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 border rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-slate-500">Match</div>
                                <div className="text-lg font-semibold">{selDetails.home.name} vs {selDetails.away.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold">{selDetails.home.score} — {selDetails.away.score}</div>
                                <div className="text-xs text-slate-500">{selDetails.time}</div>
                              </div>
                            </div>
                            <div className="mt-3 text-sm text-slate-600">
                              Possession: <strong>{selDetails.possession}</strong> • Shots: <strong>{selDetails.shots.home}-{selDetails.shots.away}</strong>
                            </div>
                          </div>

                          <div className="p-3 border rounded">
                            <h4 className="text-sm font-semibold mb-2">Quick Metrics</h4>
                            <div className="text-sm">Peak viewers: <strong>{selDetails.metrics.peakViewers.toLocaleString()}</strong></div>
                            <div className="text-sm mt-1">Avg watch time: <strong>{Math.round(selDetails.metrics.avgWatchTime/60)}m</strong></div>
                            <div className="text-sm mt-1">Chat: <strong>{selDetails.metrics.chatMessages}</strong></div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 border rounded">
                            <h5 className="font-semibold mb-2">Lineup — {selDetails.home.name}</h5>
                            <ol className="list-decimal pl-5 text-sm space-y-1">
                              {selDetails.lineupHome.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ol>
                          </div>
                          <div className="p-3 border rounded">
                            <h5 className="font-semibold mb-2">Lineup — {selDetails.away.name}</h5>
                            <ol className="list-decimal pl-5 text-sm space-y-1">
                              {selDetails.lineupAway.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ol>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-3 border rounded">
                            <h5 className="font-semibold mb-2">Recent H2H</h5>
                            <ul className="text-sm space-y-2">
                              {selDetails.h2h.map((m: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span>{m.date} • {m.competition}</span>
                                  <span className="font-medium">{m.result}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 border rounded">
                            <h5 className="font-semibold mb-2">Standings (Top)</h5>
                            <table className="w-full text-sm">
                              <tbody>
                                {selDetails.standings.map((s: any, i: number) => (
                                  <tr key={i} className="border-t">
                                    <td className="py-2 w-8">{s.pos}</td>
                                    <td className="py-2">{s.team}</td>
                                    <td className="py-2 text-right">{s.pts}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-700">Stream summary and details will appear here.</div>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

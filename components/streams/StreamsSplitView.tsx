'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Users, Play } from 'lucide-react';

export type StreamListItem = {
  id: string;
  title: string;
  category?: string;
  status?: string;
  live?: boolean;
  thumbnail: string;
  streamerName?: string;
  viewers?: number;
  slug?: string; // final href if exists (e.g. /watch/slug)
};

export default function StreamsSplitView({ items }: { items: StreamListItem[] }) {
  const initialId = items[0]?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId);

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) ?? items[0],
    [selectedId, items]
  );

  // Mock data generator for summary/stats/lineups/form/standings
  const getMockDetails = (it: StreamListItem | undefined) => {
    if (!it) return null;
    const seed = Number([...it.id].reduce((s, c) => s + c.charCodeAt(0), 0)) || 1;
    const home = { name: it.streamerName ?? 'Home', score: (seed % 3) + (it.live ? 1 : 0) };
    const away = { name: it.category ?? 'Away', score: (seed + 1) % 4 };
    const time = `${30 + (seed % 30)}'`;
    const possession = `${45 + (seed % 11)}%`;
    const shots = { home: 6 + (seed % 6), away: 4 + ((seed + 3) % 5) };
    const lineupHome = Array.from({ length: 11 }).map((_, i) => `Player ${i + 1}`);
    const lineupAway = Array.from({ length: 11 }).map((_, i) => `Opponent ${i + 1}`);
    const h2h = [
      { date: '2025-03-12', result: '1-2', competition: 'League' },
      { date: '2024-11-02', result: '2-0', competition: 'Cup' },
      { date: '2024-06-21', result: '0-0', competition: 'Friendly' },
    ];
    const standings = [
      { team: home.name, pts: 62, pos: 1 },
      { team: away.name, pts: 58, pos: 2 },
      { team: 'Rivals', pts: 47, pos: 3 },
    ];
    const metrics = {
      avgWatchTime: 420 + (seed % 300),
      peakViewers: it.viewers ?? 0 + (seed % 500),
      chatMessages: 10 + (seed % 100),
    };
    return { home, away, time, possession, shots, lineupHome, lineupAway, h2h, standings, metrics };
  };

  const details = getMockDetails(selected);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-12 gap-6">
      {/* Left: timeline list */}
      <div className="md:col-span-5">
        <ol className="relative pl-8 before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
          {items.map((it) => {
            const active = it.id === selected?.id;
            return (
              <li
                key={it.id}
                className={`relative pl-6 py-4 group cursor-pointer rounded-md border transition-colors ${
                  active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedId(it.id)}
              >
                <span
                  className={`absolute left-2 top-6 -translate-y-1/2 w-3 h-3 rounded-full ring-4 ring-white ${
                    it.live ? 'bg-red-600' : 'bg-slate-400'
                  }`}
                />
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {/* replaced raw img with next/image for better performance */}
                    <Image
                      src={it.thumbnail || '/placeholder.png'}
                      alt={it.title}
                      width={112}
                      height={64}
                      className="w-28 h-16 object-cover rounded border"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {it.live && <Badge className="bg-red-600 text-white">LIVE</Badge>}
                      {it.category && <Badge variant="secondary" className="text-xs">{it.category}</Badge>}
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{it.title}</h3>
                    <div className="mt-1 text-sm text-slate-600 flex items-center gap-3">
                      {it.streamerName && <span>{it.streamerName}</span>}
                      {typeof it.viewers === 'number' && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {it.viewers.toLocaleString()}
                        </span>
                      )}
                      {it.status && <span className="capitalize">{it.status}</span>}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Right: details panel */}
      <div className="md:col-span-7">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selected?.live && (
                  <Badge className="bg-red-600 text-white">
                    <span className="animate-pulse mr-1">●</span>
                    LIVE
                  </Badge>
                )}
                {selected?.category && (
                  <Badge variant="secondary" className="text-xs">
                    {selected.category}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {(selected?.viewers ?? 0).toLocaleString()
                }
              </div>
            </div>

            <div className="mt-3 flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={selected?.thumbnail || '/placeholder.png'}
                alt={selected?.title ?? 'thumbnail'}
                width={112}
                height={64}
                className="w-28 h-16 object-cover rounded border hidden sm:block"
                loading="lazy"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-900">{selected?.title}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selected?.streamerName ?? 'Anonymous'}
                </p>
              </div>
              <div className="ml-auto">
                <Button size="sm" asChild>
                  {selected?.slug ? (
                    <Link href={selected.slug}>Watch</Link>
                  ) : (
                    <a href={`/stream/${selected?.id}`} className="inline-flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      Watch
                    </a>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="lineups">Lineups</TabsTrigger>
                <TabsTrigger value="form">Form/H2H</TabsTrigger>
                <TabsTrigger value="standings">Standings</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4 text-sm text-slate-700">
                {/* Summary: score, time, possession, shots */}
                {details ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-slate-500">Match</div>
                          <div className="text-lg font-semibold">{details.home.name} vs {details.away.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{details.home.score} — {details.away.score}</div>
                          <div className="text-xs text-slate-500">{details.time}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
                        <div>
                          <div className="font-semibold">{details.possession}</div>
                          <div className="text-xs">Possession</div>
                        </div>
                        <div>
                          <div className="font-semibold">{details.shots.home + details.shots.away}</div>
                          <div className="text-xs">Shots (total)</div>
                        </div>
                        <div>
                          <div className="font-semibold">{details.metrics.peakViewers.toLocaleString()}</div>
                          <div className="text-xs">Peak viewers</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <h4 className="text-sm font-medium mb-2">Quick Metrics</h4>
                      <ul className="text-sm space-y-2">
                        <li>Avg watch time: <strong>{Math.round(details.metrics.avgWatchTime / 60)}m {details.metrics.avgWatchTime % 60}s</strong></li>
                        <li>Chat messages: <strong>{details.metrics.chatMessages}</strong></li>
                        <li>Viewers now: <strong>{(details.metrics.peakViewers - 50).toLocaleString()}</strong></li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>Stream summary and description will appear here. This is a placeholder panel.</div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-4 text-sm text-slate-700">
                {details ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <h4 className="font-semibold text-sm mb-2">Team Stats</h4>
                      <div className="flex justify-between text-sm"><span>{details.home.name}</span><span>Shots: {details.shots.home}</span></div>
                      <div className="flex justify-between text-sm"><span>{details.away.name}</span><span>Shots: {details.shots.away}</span></div>
                      <div className="flex justify-between text-sm"><span>Possession</span><span>{details.possession}</span></div>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-semibold text-sm mb-2">Engagement</h4>
                      <div className="text-sm">Peak viewers: <strong>{details.metrics.peakViewers.toLocaleString()}</strong></div>
                      <div className="text-sm mt-2">Avg watch time: <strong>{Math.round(details.metrics.avgWatchTime/60)}m</strong></div>
                      <div className="text-sm mt-2">Chat messages: <strong>{details.metrics.chatMessages}</strong></div>
                    </div>
                  </div>
                ) : (
                  <div>Live stats are not available for this demo.</div>
                )}
              </TabsContent>

              <TabsContent value="lineups" className="mt-4 text-sm text-slate-700">
                {details ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <h4 className="font-semibold mb-2">{details.home.name} — Lineup</h4>
                      <ol className="list-decimal pl-5 text-sm space-y-1">
                        {details.lineupHome.map((p, i) => <li key={i}>{p}</li>)}
                      </ol>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-semibold mb-2">{details.away.name} — Lineup</h4>
                      <ol className="list-decimal pl-5 text-sm space-y-1">
                        {details.lineupAway.map((p, i) => <li key={i}>{p}</li>)}
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div>Lineups or participants will appear here.</div>
                )}
              </TabsContent>

              <TabsContent value="form" className="mt-4 text-sm text-slate-700">
                {details ? (
                  <div>
                    <h4 className="font-semibold mb-2">Recent H2H / Form</h4>
                    <ul className="space-y-2 text-sm">
                      {details.h2h.map((m, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{m.date} • {m.competition}</span>
                          <span className="font-medium">{m.result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>Recent form / H2H data placeholder.</div>
                )}
              </TabsContent>

              <TabsContent value="standings" className="mt-4 text-sm text-slate-700">
                {details ? (
                  <div>
                    <h4 className="font-semibold mb-2">Standings (Top)</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500">
                          <th>Pos</th><th>Team</th><th>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.standings.map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2">{s.pos}</td>
                            <td className="py-2">{s.team}</td>
                            <td className="py-2">{s.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div>Standings table placeholder.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

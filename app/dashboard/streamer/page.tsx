'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Users, Eye, TrendingUp, Plus, Trash } from 'lucide-react';

// helper to compute a deterministic numeric seed from an id (avoids spread+reduce typing issues)
function computeSeed(id?: string | number) {
  const s = String(id ?? '');
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum || 1;
}

export default function StreamerDashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [streamerData, setStreamerData] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalFollowers: 0,
    totalStreams: 0,
    liveStreams: 0,
    eventsCount: 0,      // total events in the DB (admin metric)
    allStreamsCount: 0,  // total streams in the DB (admin metric)
  });

  // fetch global admin counts: events and all streams
  const fetchCounts = useCallback(async () => {
    try {
      // use head + exact count to avoid returning all rows
      const eventsRes = await supabase.from('events').select('id', { count: 'exact', head: true });
      const streamsRes = await supabase.from('streams').select('id', { count: 'exact', head: true });
      setStats((prev) => ({
        ...prev,
        eventsCount: eventsRes.count ?? 0,
        allStreamsCount: streamsRes.count ?? 0,
      }));
    } catch {
      // ignore errors; keep defaults
    }
  }, []);

  const fetchStreamerData = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('streamers')
      .select(`
        id,
        bio,
        verified,
        total_followers,
        total_views,
        subscription_plan_id,
        subscription_status,
        subscription_plan:subscription_plans(name, price)
      `)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (data) {
      setStreamerData(data);
      setStats((prev) => ({
        ...prev,
        totalViews: data.total_views || 0,
        totalFollowers: data.total_followers || 0,
      }));
    }
  }, [user?.id]);

  const fetchStreams = useCallback(async () => {
    if (!user?.id) return;
    const { data: streamer } = await supabase
      .from('streamers')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (streamer) {
      const { data } = await supabase
        .from('streams')
        .select('*')
        .eq('streamer_id', streamer.id)
        .order('created_at', { ascending: false });

      if (data) {
        setStreams(data);
        setStats((prev) => ({
          ...prev,
          totalStreams: data.length,
          liveStreams: data.filter((s: any) => s.status === 'live').length,
        }));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'streamer')) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'streamer') {
      fetchStreamerData();
      fetchStreams();
      fetchCounts();
    }
  }, [user, profile, fetchStreamerData, fetchStreams]);

  const deleteStream = async (id: string) => {
    if (!confirm('Delete this stream? This action cannot be undone.')) return;
    const { error } = await supabase.from('streams').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    fetchStreams();
  };

  // SEO: private streamer dashboard - noindex
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Streamer Dashboard – StreamHub';
      const upsert = (name: string, content: string) => {
        let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
        if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
        el.setAttribute('content', content);
      };
      upsert('robots', 'noindex, nofollow');
      // canonical
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
      link.href = `${location.origin}/dashboard/streamer`;
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'streamer') {
    return null;
  }

  // small helper for compact mock stats
  const makeCompact = (stream: any) => {
    const seed = computeSeed(stream.id);
    return {
      score: `${(seed % 3) + (stream.status === 'live' ? 1 : 0)} - ${((seed + 1) % 4)}`,
      minute: `${30 + (seed % 30)}'`,
      viewers: (stream.view_count ?? 0) + (seed % 200),
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Streamer Dashboard</h1>
            <p className="text-slate-600">Manage your streams and track performance</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/streamer/new-stream">
              <Plus className="w-4 h-4 mr-2" />
              New Stream
            </Link>
          </Button>
        </div>

        {streamerData && (
          <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{profile.full_name}</h2>
                  <p className="text-blue-100 mb-4">{streamerData.bio || 'No bio yet'}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                      {streamerData.subscription_plan?.name || 'No Plan'}
                    </Badge>
                    {streamerData.verified && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="secondary" asChild>
                  <Link href="/settings">Edit Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Lifetime views</p>
            </CardContent>
          </Card>

          {/* Replaced: Followers -> Events count (admin metric) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Users className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.eventsCount ?? 0).toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">Total events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <Video className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStreams}</div>
              <p className="text-xs text-slate-600 mt-1">Your streams</p>
            </CardContent>
          </Card>

          {/* Replaced: Live Now -> All Streams (global streams count) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Streams</CardTitle>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.allStreamsCount ?? 0).toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">All streams</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="streams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="streams">My Streams</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="streams" className="space-y-4">
            {streams.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No streams yet</h3>
                  <p className="text-slate-600 mb-4">Create your first stream to get started</p>
                  <Button asChild>
                    <Link href="/dashboard/streamer/new-stream">Create Stream</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {streams.map((stream) => (
                  <Card key={stream.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 bg-slate-200 rounded flex-shrink-0">
                          {stream.thumbnail_url && (
                            <img
                              src={stream.thumbnail_url}
                              alt={stream.title}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{stream.title}</h3>
                              <p className="text-sm text-slate-600">{stream.category}</p>
                              {/* NEW: compact mock summary */}
                              <div className="text-sm text-slate-500 mt-1">
                                {(() => {
                                  const c = makeCompact(stream);
                                  return <span>{c.score} • {c.minute} • {c.viewers.toLocaleString()} viewers</span>;
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={stream.status === 'live' ? 'destructive' : 'secondary'}
                                className={stream.status === 'live' ? 'animate-pulse' : ''}
                              >
                                {stream.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {(stream.view_count ?? 0).toLocaleString()} views
                            </div>
                            <div>{stream.created_at ? new Date(stream.created_at).toLocaleDateString() : ''}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={() => deleteStream(stream.id)}>
                            <Trash className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardContent className="py-16 text-center">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-slate-600">Detailed analytics and insights will be available here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

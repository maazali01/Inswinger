'use client';

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Play, Clock, Heart, User as UserIcon } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // wrap fetchFollowing in useCallback
  const fetchFollowing = useCallback(async () => {
    const { data } = await supabase
      .from('followers')
      .select(`
        id,
        streamer:streamers(
          id,
          profile:profiles(
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', user?.id);

    if (data) setFollowing(data);
  }, [user?.id]);

  // wrap fetchWatchHistory in useCallback
  const fetchWatchHistory = useCallback(async () => {
    const { data } = await supabase
      .from('watch_history')
      .select(`
        id,
        watch_time_seconds,
        last_position_seconds,
        stream:streams(
          id,
          title,
          slug,
          thumbnail_url,
          category
        )
      `)
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (data) setWatchHistory(data);
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      // call stable callbacks
      fetchWatchHistory();
      fetchFollowing();
    }
  }, [user, fetchWatchHistory, fetchFollowing]);

  // SEO: private dashboard should not be indexed
  useEffect(() => {
    document.title = 'Dashboard – StreamHub';
    const canonicalHref =
      typeof window !== 'undefined' ? `${location.origin}/dashboard` : '/dashboard';

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

    upsertMeta('robots', 'noindex, nofollow');
    upsertLink('canonical', canonicalHref);
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

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{profile.full_name || 'User'}</h1>
              <p className="text-slate-600">{profile.email}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watch History</CardTitle>
              <Clock className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{watchHistory.length}</div>
              <p className="text-xs text-slate-600 mt-1">Streams watched</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Following</CardTitle>
              <Heart className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{following.length}</div>
              <p className="text-xs text-slate-600 mt-1">Streamers followed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account</CardTitle>
              <UserIcon className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile.role}</div>
              <p className="text-xs text-slate-600 mt-1">Account type</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Watch History</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {watchHistory.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Play className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No watch history yet</h3>
                  <p className="text-slate-600 mb-4">Start watching streams to build your history</p>
                  <Button asChild>
                    <Link href="/browse">Browse Streams</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {watchHistory.map((item: any) => (
                  <Link key={item.id} href={`/watch/${item.stream?.slug}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-video bg-slate-200 rounded-t-lg">
                        {item.stream?.thumbnail_url && (
                          <Image
                            src={item.stream.thumbnail_url}
                            alt={item.stream.title}
                            width={280}
                            height={160}
                            className="object-cover w-full h-full"
                            priority={false}
                          />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2">{item.stream?.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{item.stream?.category}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {following.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Not following anyone yet</h3>
                  <p className="text-slate-600 mb-4">Follow streamers to see their updates here</p>
                  <Button asChild>
                    <Link href="/browse">Find Streamers</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {item.streamer?.profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{item.streamer?.profile?.full_name}</h3>
                        <p className="text-sm text-slate-600">Streamer</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

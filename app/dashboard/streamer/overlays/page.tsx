'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash } from 'lucide-react';
import Link from 'next/link';

export default function OverlaysListPage() {
  const { user, profile, loading } = useAuth();

  // SEO: overlays list (private) - noindex
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Overlays – StreamHub';
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
      link.href = `${location.origin}/dashboard/streamer/overlays`;
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

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Overlays</h1>
              <p className="text-slate-600">Manage your stream overlays</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/streamer/overlays/new">
                <Plus className="w-4 h-4 mr-2" />
                New Overlay
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Map through overlays data and display cards */}
          {/* Placeholder card for demo */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">Overlay Name</h3>
                      <p className="text-sm text-slate-600">Category</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      1,234 views
                    </div>
                    <div>Last updated: 2025-10-10</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* CHANGED: remove View/Edit links — only keep Delete */}
                  <Button variant="destructive" size="sm">
                    <Trash className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
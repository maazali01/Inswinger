'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, X } from 'lucide-react';
import Link from 'next/link';

export default function OverlayViewPage() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Overlay Details – StreamHub';
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Overlay Details</h1>
            <p className="text-slate-600">Manage your stream overlays and settings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => {}}>
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overlay Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="text-sm block mb-1">Overlay Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g. NFL Game Overlay"
                />
              </div>

              <div>
                <label className="text-sm block mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Describe your overlay"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {}}
                >
                  <Trash className="w-4 h-4 mr-1" />
                  Delete Overlay
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 200);
}

export default function OverlayEditPage() {
  const { user, profile, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [status, setStatus] = useState<'scheduled' | 'live' | 'recorded'>('scheduled');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Edit Overlay – StreamHub';
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
    }
  }, []);

  useEffect(() => {
    // redirect non-authenticated users away
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!user || !profile) {
      setError('Authentication required.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setLoadingSubmit(true);

    try {
      // fetch streamer id for this profile
      const { data: streamerRow, error: stErr } = await supabase
        .from('streamers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (stErr) throw stErr;
      if (!streamerRow || !streamerRow.id) {
        throw new Error('Streamer profile not found. Please create a streamer profile first.');
      }

      const updatePayload: any = {
        title: title.trim(),
        description: description || null,
        category: selectedType.name,
        status: status,
        visibility: visibility,
        thumbnail_url: thumbnailUrl || null,
      };

      const { error: updateErr } = await supabase.from('streams').update(updatePayload).eq('id', streamId);

      if (updateErr) throw updateErr;

      // success -> go back to streamer dashboard
      router.push('/dashboard/streamer');
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the stream.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Overlay</h1>
            <p className="text-sm text-slate-600">Update the details of your overlay.</p>
          </div>
          <div>
            <Link href="/dashboard/streamer" className="text-sm text-slate-600 hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overlay Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm text-red-600">{error}</div>}

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <select id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="w-full border rounded px-3 py-2">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select id="status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full border rounded px-3 py-2">
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="recorded">Recorded</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input id="thumbnail" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loadingSubmit}>
                  {loadingSubmit ? 'Updating...' : 'Update Overlay'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => router.push('/dashboard/streamer')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```
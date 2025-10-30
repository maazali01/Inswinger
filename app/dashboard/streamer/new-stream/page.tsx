'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

export default function NewStreamPage() {
  // SEO: new stream page - noindex
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Create New Stream – StreamHub';
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
      link.href = `${location.origin}/dashboard/streamer/new-stream`;
    }
  }, []);

  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [streamTypes, setStreamTypes] = useState<{ id: string; name: string; slug: string; start_time?: string | null; end_time?: string | null }[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [status, setStatus] = useState<'scheduled' | 'live' | 'recorded'>('scheduled');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from('stream_types')
        .select('id, name, slug, start_time, end_time')
        .eq('active', true)
        .order('name', { ascending: true });

      if (!error && data) {
        setStreamTypes(data);
        if (data.length && !selectedTypeId) setSelectedTypeId(data[0].id);
      }
    };
    fetchTypes();
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
    if (!selectedTypeId) {
      setError('Please select a stream type provided by admin.');
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

      // get selected stream type to obtain admin slug and times
      const selectedType = streamTypes.find((t) => t.id === selectedTypeId);
      if (!selectedType) throw new Error('Selected stream type not found.');

      // derive slug from admin-provided stream_type.slug and add short suffix to avoid collisions
      let baseSlug = selectedType.slug || slugify(title);
      const suffix = Math.random().toString(36).slice(2, 6);
      let finalSlug = `${baseSlug}-${suffix}`;

      // Ensure slug uniqueness (quick check)
      const { data: existing } = await supabase.from('streams').select('id').eq('slug', finalSlug).limit(1);
      if (existing && existing.length > 0) {
        finalSlug = `${baseSlug}-${Date.now().toString(36).slice(-6)}`;
      }

      const insertPayload: any = {
        streamer_id: streamerRow.id,
        title: title.trim(),
        slug: finalSlug,
        description: description || null,
        category: selectedType.name,
        status: status,
        visibility: visibility,
        thumbnail_url: thumbnailUrl || null,
      };

      // Use admin-defined times if present
      if (selectedType.start_time) insertPayload.start_time = selectedType.start_time;
      if (selectedType.end_time) insertPayload.end_time = selectedType.end_time;

      const { error: insertErr } = await supabase.from('streams').insert(insertPayload);

      if (insertErr) throw insertErr;

      // success -> go back to streamer dashboard
      router.push('/dashboard/streamer');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the stream.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create New Stream</h1>
            <p className="text-sm text-slate-600">Create a new live/recorded stream. The admin defines slug and default time.</p>
          </div>
          <div>
            <Link href="/dashboard/streamer" className="text-sm text-slate-600 hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stream Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm text-red-600">{error}</div>}

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="type">Stream Type (admin-provided)</Label>
                <select
                  id="type"
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select type...</option>
                  {streamTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.start_time ? `• starts ${new Date(t.start_time).toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
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
                  {loadingSubmit ? 'Creating...' : 'Create Stream'}
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

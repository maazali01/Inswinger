'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash, Plus, ToggleLeft } from 'lucide-react';
import Link from 'next/link';

type StreamType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string;
};

export default function AdminStreamsPage() {
  const [items, setItems] = useState<StreamType[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Admin — Stream Types';
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
      link.href = `${location.origin}/admin/streams`;
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stream_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setItems([]);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  };

  const addType = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return alert('Name is required');
    if (!slug.trim()) return alert('Slug is required');

    const payload: any = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || null,
      active: true,
    };
    payload.start_time = startTime ? new Date(startTime).toISOString() : null;
    payload.end_time = endTime ? new Date(endTime).toISOString() : null;

    const { error } = await supabase.from('stream_types').insert(payload);
    if (error) return alert(error.message);
    setName(''); setSlug(''); setDescription(''); setStartTime(''); setEndTime('');
    fetchTypes();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('stream_types').update({ active: !current }).eq('id', id);
    if (error) return alert(error.message);
    fetchTypes();
  };

  const deleteType = async (id: string) => {
    if (!confirm('Delete this stream type?')) return;
    const { error } = await supabase.from('stream_types').delete().eq('id', id);
    if (error) return alert(error.message);
    fetchTypes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stream Types</h1>
          <p className="text-sm text-slate-600">Define allowed stream types that streamers can select when creating streams. Admin defines the slug and default time.</p>
        </div>
        <div>
          <Link href="/admin" className="text-sm text-slate-600 hover:underline">
            Back to admin
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Add Stream Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addType} className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Football Match" />
              </div>
              <div>
                <label className="text-sm block mb-1">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="football-match" />
              </div>
              <div>
                <label className="text-sm block mb-1">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div>
                <label className="text-sm block mb-1">Default Start Time (admin-defined)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm block mb-1">Default End Time (optional)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" asChild>
                  <button className="inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create
                  </button>
                </Button>
                <Button variant="ghost" onClick={() => { setName(''); setSlug(''); setDescription(''); setStartTime(''); setEndTime(''); }}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Types</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-slate-600">No stream types yet.</div>
              ) : (
                <ul className="space-y-3">
                  {items.map((t) => (
                    <li key={t.id} className="flex items-center justify-between p-3 bg-white border rounded">
                      <div>
                        <div className="font-semibold">{t.name} <span className="text-xs text-slate-500">({t.slug})</span></div>
                        {t.description && <div className="text-sm text-slate-600">{t.description}</div>}
                        {(t.start_time || t.end_time) && (
                          <div className="text-xs text-slate-500 mt-1">
                            {t.start_time ? `Start: ${new Date(t.start_time).toLocaleString()}` : ''}
                            {t.end_time ? ` • End: ${new Date(t.end_time).toLocaleString()}` : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          title={t.active ? 'Active' : 'Inactive'}
                          onClick={() => toggleActive(t.id, !!t.active)}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded border"
                        >
                          <ToggleLeft className="w-4 h-4" />
                          <Badge variant={t.active ? undefined : 'secondary'}>{t.active ? 'Active' : 'Inactive'}</Badge>
                        </button>

                        <Button variant="destructive" size="sm" onClick={() => deleteType(t.id)}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

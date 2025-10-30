'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('blogs').insert([{
      title, slug, content, published, published_at: published ? new Date().toISOString() : null
    }]);
    setLoading(false);
    if (error) return alert(error.message);
    alert('Blog created');
    router.push('/admin/blogs');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Blog</h1>
      <form onSubmit={create} className="space-y-3 max-w-2xl">
        <div>
          <label className="block text-sm">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="block text-sm">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="block text-sm">Content (HTML)</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full border rounded px-2 py-1 h-40" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span>Published</span>
        </div>
        <div>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</Button>
        </div>
      </form>
    </div>
  );
}

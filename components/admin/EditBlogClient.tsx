'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function EditBlogClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const id = String(initialData.id);
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<any>(initialData);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('blogs').update({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      published: blog.published,
      published_at: blog.published ? new Date().toISOString() : null,
    }).eq('id', id);
    setLoading(false);
    if (error) return alert(error.message);
    alert('Blog updated');
    router.push('/admin/blogs');
  };

  const remove = async () => {
    if (!confirm('Delete this blog?')) return;
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) return alert(error.message);
    alert('Deleted');
    router.push('/admin/blogs');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Blog</h1>
      <form onSubmit={save} className="space-y-3 max-w-2xl">
        <div>
          <label className="block text-sm">Title</label>
          <input value={blog.title} onChange={(e) => setBlog({ ...blog, title: e.target.value })} className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="block text-sm">Slug</label>
          <input value={blog.slug} onChange={(e) => setBlog({ ...blog, slug: e.target.value })} className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="block text-sm">Content (HTML)</label>
          <textarea value={blog.content} onChange={(e) => setBlog({ ...blog, content: e.target.value })} className="w-full border rounded px-2 py-1 h-40" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!blog.published} onChange={(e) => setBlog({ ...blog, published: e.target.checked })} />
          <span>Published</span>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          <Button variant="destructive" onClick={remove}>Delete</Button>
        </div>
      </form>
    </div>
  );
}

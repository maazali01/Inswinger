'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Blog = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  published_at: string | null;
  updated_at: string | null;
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    const { data } = await supabase.from('blogs').select('id, title, slug, published, published_at, updated_at').order('updated_at', { ascending: false });
    setBlogs(data ?? []);
    setLoading(false);
  };

  const deleteBlog = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) return alert(error.message);
    alert('Blog deleted');
    fetchBlogs();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Blogs</h1>
        <Link href="/admin/blogs/new"><Button>Create New Blog</Button></Link>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-2">
          {blogs.map((b) => (
            <div key={b.id} className="p-4 bg-white border rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.title}</div>
                <div className="text-xs text-slate-600">{b.slug} • {b.published ? 'Published' : 'Draft'}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/blogs/${b.id}/edit`}><Button>Edit</Button></Link>
                <Button variant="destructive" onClick={() => deleteBlog(b.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

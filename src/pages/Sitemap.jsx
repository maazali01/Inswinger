import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Sitemap() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    const baseUrl = window.location.origin;
    const now = new Date().toISOString();

    // Fetch dynamic content
    const [streamsRes, blogsRes, eventsRes] = await Promise.all([
      supabase.from('streams').select('id, updated_at').limit(100),
      supabase.from('blogs').select('id, slug, updated_at').limit(100),
      supabase.from('upcoming_events').select('id, updated_at').limit(100),
    ]);

    const streams = streamsRes.data || [];
    const blogs = blogsRes.data || [];
    const events = eventsRes.data || [];

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/login', priority: '0.8', changefreq: 'monthly' },
      { loc: '/signup', priority: '0.8', changefreq: 'monthly' },
      { loc: '/home', priority: '0.9', changefreq: 'hourly' },
      { loc: '/blogs', priority: '0.9', changefreq: 'daily' },
      { loc: '/events', priority: '0.9', changefreq: 'daily' },
    ];

    const streamPages = streams.map(s => ({
      loc: `/stream/${s.id}`,
      lastmod: s.updated_at || now,
      priority: '0.7',
      changefreq: 'hourly',
    }));

    const blogPages = blogs.map(b => ({
      loc: `/blogs/${b.slug || b.id}`,
      lastmod: b.updated_at || now,
      priority: '0.8',
      changefreq: 'weekly',
    }));

    const eventPages = events.map(e => ({
      loc: `/events/${e.id}`,
      lastmod: e.updated_at || now,
      priority: '0.7',
      changefreq: 'daily',
    }));

    const allPages = [...staticPages, ...streamPages, ...blogPages, ...eventPages];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    setXml(sitemapXml);
  };

  useEffect(() => {
    if (xml) {
      // Set content type for XML
      document.querySelector('meta[http-equiv="Content-Type"]')?.remove();
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Type';
      meta.content = 'application/xml; charset=utf-8';
      document.head.appendChild(meta);
    }
  }, [xml]);

  return (
    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', fontSize: '12px' }}>
      {xml || 'Generating sitemap...'}
    </pre>
  );
}

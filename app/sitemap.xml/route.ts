export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = 3600;

import { getSitemapEntries } from '@/lib/sitemap';

function buildXml(entries: Array<{ url: string; lastModified?: string | Date; changeFrequency?: string; priority?: number }>) {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const e of entries) {
    parts.push('<url>');
    parts.push(`<loc>${e.url}</loc>`);
    if (e.lastModified) parts.push(`<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>`);
    if (e.changeFrequency) parts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
    if (typeof e.priority === 'number') parts.push(`<priority>${e.priority}</priority>`);
    parts.push('</url>');
  }
  parts.push('</urlset>');
  return parts.join('');
}

export async function GET() {
  const entries = await getSitemapEntries();
  const xml = buildXml(entries);

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}

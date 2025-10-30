import type { MetadataRoute } from 'next';

// Make this metadata route static-export friendly
export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ __metadata_id__: [] as string[] }];
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api', '/_next', '/private'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL.replace(/\/$/, ''),
  };
}

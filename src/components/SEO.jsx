import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function SEO({
  title = 'Inswinger+ | Live Sports Streaming Platform',
  description = 'Watch live sports streams, follow your favorite teams, and connect with sports fans worldwide on Inswinger+',
  keywords = 'sports streaming, live sports, football, cricket, basketball, tennis, sports events, watch sports online',
  canonical,
  image = '/og-image.jpg',
  schema,
  noindex = false,
}) {
  const location = useLocation();
  const siteUrl = window.location.origin;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : `${siteUrl}${location.pathname}`;

  // Force helmet to update on route change
  useEffect(() => {
    // This ensures the helmet updates when location changes
    document.title = title;
  }, [title, location.pathname]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:site_name" content="Inswinger+" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${siteUrl}${image}`} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

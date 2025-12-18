import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { generateSEOMetadata } from '../lib/gemini';

export default function DynamicSEO({
  pageType,
  content,
  sport,
  title: pageTitle,
  fallbackTitle,
  fallbackDescription,
  fallbackKeywords,
  canonical,
  image = '/og-image.jpg',
  schema,
  noindex = false,
  useAI = true,
}) {
  const [seoData, setSeoData] = useState({
    title: fallbackTitle || 'Inswinger+ | Live Sports Streaming',
    description: fallbackDescription || 'Watch live sports on Inswinger+',
    keywords: fallbackKeywords || 'sports streaming, live sports',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!useAI) {
      return;
    }

    setLoading(true);

    const generateSEO = async () => {
      try {
        const generated = await generateSEOMetadata({
          pageType,
          content,
          sport,
          title: pageTitle,
        });
        
        console.log('SEO loaded:', generated);
        setSeoData(generated);
      } catch (error) {
        console.error('Failed to generate SEO:', error);
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };

    generateSEO();
  }, [pageType, pageTitle]); // Only regenerate when page type or title changes

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://inswinger.netlify.app';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : siteUrl;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : currentUrl;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="title" content={seoData.title} />
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Inswinger+" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={seoData.title} />
      <meta property="twitter:description" content={seoData.description} />
      <meta property="twitter:image" content={imageUrl} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {/* Debug indicator */}
      {!loading && (
        <meta name="seo-cached" content="true" />
      )}
    </Helmet>
  );
}

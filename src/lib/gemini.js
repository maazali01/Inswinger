import { supabase } from './supabase';

// Helper function to detect if we're in production (Netlify) or development
const isProduction = import.meta.env.PROD;

// In development, check if we're running on Netlify Dev (port 8888) or regular Vite (port 5173)
const getAPIBase = () => {
  if (isProduction) {
    return '/.netlify/functions';
  }
  
  // Check if we're on Netlify Dev port
  if (typeof window !== 'undefined' && window.location.port === '8888') {
    return '/.netlify/functions';
  }
  
  // Fallback to localhost:8888 for Vite dev server
  return 'http://localhost:8888/.netlify/functions';
};

const API_BASE = getAPIBase();

/**
 * Generate blog content using Groq AI
 */
export const generateBlogContent = async (title) => {
  try {
    const response = await fetch(`${API_BASE}/generate-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate content';
      
      const responseClone = response.clone();
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        try {
          const text = await responseClone.text();
          if (text.includes('Not Found') || response.status === 404) {
            errorMessage = 'AI service is not available. Please ensure you are running "npm run netlify:dev"';
          } else {
            errorMessage = `Server error: ${response.status}`;
          }
        } catch (textError) {
          errorMessage = `Server error: ${response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.content) {
      throw new Error('No content generated');
    }

    return data.content;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(error.message || 'Failed to generate blog content. Please try again.');
  }
};

/**
 * Generate event description using Groq AI
 */
export const generateEventDescription = async (eventTitle) => {
  try {
    const response = await fetch(`${API_BASE}/generate-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventTitle }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate description';
      
      const responseClone = response.clone();
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        try {
          const text = await responseClone.text();
          if (text.includes('Not Found') || response.status === 404) {
            errorMessage = 'AI service is not available. Please ensure you are running "npm run netlify:dev"';
          } else {
            errorMessage = `Server error: ${response.status}`;
          }
        } catch (textError) {
          errorMessage = `Server error: ${response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.description) {
      throw new Error('No description generated');
    }

    return data.description;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(error.message || 'Failed to generate event description. Please try again.');
  }
};

/**
 * Get cached SEO or generate new one using Groq AI
 */
export const generateSEOMetadata = async ({ pageType, content, sport, title }) => {
  try {
    // Create a unique identifier for this page
    const pageIdentifier = (() => {
      switch (pageType) {
        case 'homepage':
          return 'homepage';
        case 'stream':
        case 'blog':
        case 'event':
          return title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : pageType;
        default:
          return pageType;
      }
    })();

    // Check cache first
    const { data: cachedSEO, error: cacheError } = await supabase
      .from('seo_cache')
      .select('title, description, keywords, created_at')
      .eq('page_type', pageType)
      .eq('page_identifier', pageIdentifier)
      .single();

    // If cached and less than 7 days old, return it
    if (cachedSEO && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedSEO.created_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (cacheAge < sevenDays) {
        console.log('Using cached SEO for:', pageType, pageIdentifier);
        return {
          title: cachedSEO.title,
          description: cachedSEO.description,
          keywords: cachedSEO.keywords
        };
      }
    }

    // Generate new SEO
    console.log('Generating new SEO for:', pageType, pageIdentifier);
    const response = await fetch(`${API_BASE}/generate-seo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pageType, content, sport, title }),
    });

    if (!response.ok) {
      throw new Error('SEO generation failed');
    }

    const data = await response.json();
    
    if (!data.title || !data.description || !data.keywords) {
      throw new Error('Incomplete SEO data');
    }

    // Save to cache
    try {
      await supabase
        .from('seo_cache')
        .upsert({
          page_type: pageType,
          page_identifier: pageIdentifier,
          title: data.title,
          description: data.description,
          keywords: data.keywords,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_type,page_identifier'
        });
      
      console.log('SEO cached successfully');
    } catch (cacheWriteError) {
      console.warn('Failed to cache SEO:', cacheWriteError);
    }

    return data;
  } catch (error) {
    console.error('SEO generation error:', error);
    // Return fallback based on page type
    const fallbacks = {
      homepage: {
        title: 'Inswinger+ | Live Sports Streaming Platform',
        description: 'Watch live sports streams including football, cricket, basketball, tennis, and more on Inswinger+.',
        keywords: 'live sports streaming, watch sports online, football live, cricket streams, basketball games'
      },
      stream: {
        title: `${title || 'Live Stream'} | Inswinger+`,
        description: `Watch ${title || 'live sports'} on Inswinger+. HD quality streaming with real-time updates.`,
        keywords: `${sport?.toLowerCase() || 'sports'} live, watch online, sports streaming`
      },
      blog: {
        title: `${title || 'Sports Blog'} | Inswinger+`,
        description: `${content?.substring(0, 155) || 'Read sports news and analysis on Inswinger+'}`,
        keywords: `sports blog, ${sport?.toLowerCase() || 'sports'} news, analysis`
      },
      event: {
        title: `${title || 'Sports Event'} | Inswinger+`,
        description: `${content?.substring(0, 155) || 'Upcoming sports event on Inswinger+'}`,
        keywords: `sports event, ${sport?.toLowerCase() || 'sports'} schedule, upcoming`
      }
    };
    
    return fallbacks[pageType] || fallbacks.homepage;
  }
};

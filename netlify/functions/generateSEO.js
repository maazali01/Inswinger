import { GoogleGenerativeAI } from '@google/generative-ai';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBGCU9lsdSWHgZrPduaPYyLb0L0IbvNeTQ';

  try {
    const { slug, title, sport } = JSON.parse(event.body);

    if (!slug && !title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Slug or title is required' }),
      };
    }

    const cleanTitle = title || slug.replace(/-/g, ' ');
    const cleanSport = sport || 'Sports';

    // Check if API key exists
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found, using fallback SEO');
      return generateFallbackSEO(slug, cleanTitle, cleanSport);
    }

    const prompt = `Generate SEO metadata for a live sports stream page on Inswinger+ (sports streaming platform).

Stream Details:
- Title: "${cleanTitle}"
- Sport: ${cleanSport}
- URL Slug: ${slug}

Please generate:
1. SEO Title (50-60 characters, optimized for search engines, include keywords)
2. Meta Description (150-160 characters, compelling with call-to-action)
3. SEO Keywords (10-15 relevant keywords, comma-separated)

Requirements:
- Title must be clickable and include the stream name
- Description should highlight HD quality, live streaming, and platform features
- Keywords should cover the sport, stream name, and related search terms

Format the response as JSON:
{
  "title": "...",
  "description": "...",
  "keywords": "..."
}`;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), 20000);
      });

      const geminiPromise = (async () => {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini API response received');

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const seoData = JSON.parse(jsonMatch[0]);
          
          // Validate the data
          if (!seoData.title || !seoData.description || !seoData.keywords) {
            throw new Error('Incomplete SEO data from AI');
          }

          return seoData;
        }

        throw new Error('No JSON found in response');
      })();

      const seoData = await Promise.race([geminiPromise, timeoutPromise]);

      console.log('Successfully generated AI-powered SEO');

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(seoData),
      };
    } catch (apiError) {
      console.error('Gemini API error:', apiError.message);
      console.log('Using fallback SEO generation');
      return generateFallbackSEO(slug, cleanTitle, cleanSport);
    }
  } catch (error) {
    console.error('Generate SEO error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate SEO' }),
    };
  }
};

function generateFallbackSEO(slug, cleanTitle, cleanSport) {
  const titleCase = cleanTitle
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const seoData = {
    title: `Watch ${titleCase} Live | Inswinger+ ${cleanSport} Streaming`,
    description: `Watch ${titleCase} live streaming in HD quality on Inswinger+. ${cleanSport} live with real-time updates, expert commentary, and community chat. Join thousands of sports fans now!`,
    keywords: `${slug}, ${cleanSport} live stream, watch ${cleanSport} online, ${titleCase}, live ${cleanSport}, sports streaming, HD stream, ${cleanSport.toLowerCase()} match online, watch sports free, ${cleanSport.toLowerCase()} live streaming, ${titleCase} live, sports online, inswinger plus`,
  };

  console.log('Generated fallback SEO:', seoData.title);

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(seoData),
  };
}
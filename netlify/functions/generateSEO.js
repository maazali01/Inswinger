import Groq from 'groq-sdk';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

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

      const groqPromise = (async () => {
        const groq = new Groq({ apiKey: GROQ_API_KEY });

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an SEO expert who generates optimized metadata for sports streaming pages. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          max_tokens: 300,
          response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0]?.message?.content || '';
        console.log('Groq API response received');

        // Parse JSON from response
        const seoData = JSON.parse(responseText);
        
        // Validate the data
        if (!seoData.title || !seoData.description || !seoData.keywords) {
          throw new Error('Incomplete SEO data from AI');
        }

        return seoData;
      })();

      const seoData = await Promise.race([groqPromise, timeoutPromise]);

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
      console.error('Groq API error:', apiError.message);
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
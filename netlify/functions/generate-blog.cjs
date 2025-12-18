const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBGCU9lsdSWHgZrPduaPYyLb0L0IbvNeTQ';

  try {
    const { title } = JSON.parse(event.body);

    if (!title) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Title is required' })
      };
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 25000);
    });

    // Create Gemini API request using official SDK
    const geminiPromise = (async () => {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Write a well-structured sports blog post about: "${title}". 

Requirements:
- Include 2-3 section headings (use simple text headings, not markdown)
- Each section should be 50-80 words
- Total length: 150-200 words
- Be engaging and informative
- Write in plain text without markdown formatting
- Do not include the main title in the response
- Format headings as plain text followed by a blank line

Example format:
Introduction paragraph here...

Key Highlights
Content about highlights here...

What to Expect
Content about expectations here...`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    })();

    try {
      const output = await Promise.race([geminiPromise, timeoutPromise]);

      if (output && output.length > 50) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ content: output.trim() })
        };
      }
    } catch (aiError) {
      console.log('AI generation failed or timed out:', aiError.message);
    }

    // Enhanced template response with headings
    const templateContent = `${title} has become a major talking point in the sports world, capturing the attention of fans and analysts alike. This exciting development showcases the evolution of modern sports, where skill, strategy, and determination come together to create unforgettable moments.

The Competition Heats Up

The intensity is rising as athletes push their limits, demonstrating the peak of human performance and dedication. Spectators can expect thrilling action, tactical brilliance, and the kind of drama that makes sports truly captivating.

What Fans Can Expect

From seasoned veterans to emerging talents, every participant brings their unique style and passion to the arena. Whether you've been following the sport for years or are just discovering its appeal, ${title} offers entertainment and excitement that transcends borders. Stay connected for all the latest updates, highlights, and analysis as this sporting spectacle continues to unfold.`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        content: templateContent,
        note: 'Generated using enhanced template (AI took too long to respond)'
      })
    };

  } catch (error) {
    console.error('Error generating blog:', error);
    
    const { title } = JSON.parse(event.body);
    const templateContent = `${title} has become a major talking point in the sports world, capturing the attention of fans and analysts alike. This exciting development showcases the evolution of modern sports, where skill, strategy, and determination come together to create unforgettable moments.

The Competition Heats Up

The intensity is rising as athletes push their limits, demonstrating the peak of human performance and dedication. Spectators can expect thrilling action, tactical brilliance, and the kind of drama that makes sports truly captivating.

What Fans Can Expect

From seasoned veterans to emerging talents, every participant brings their unique style and passion to the arena. Whether you've been following the sport for years or are just discovering its appeal, ${title} offers entertainment and excitement that transcends borders. Stay connected for all the latest updates, highlights, and analysis as this sporting spectacle continues to unfold.`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        content: templateContent,
        note: 'Generated using template (error occurred)'
      })
    };
  }
};
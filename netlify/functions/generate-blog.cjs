const Groq = require('groq-sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

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

    // Create Groq API request
    const groqPromise = (async () => {
      const groq = new Groq({ apiKey: GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional sports writer who creates engaging, informative blog posts. Write in plain text without markdown formatting."
          },
          {
            role: "user",
            content: `Write a well-structured sports blog post about: "${title}". 

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
Content about expectations here...`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || '';
    })();

    try {
      const output = await Promise.race([groqPromise, timeoutPromise]);

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
const Groq = require('groq-sdk');

exports.handler = async (event) => {
  // Only allow POST requests
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
    const { eventTitle } = JSON.parse(event.body);

    if (!eventTitle) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Event title is required' })
      };
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), 20000); // 20 second timeout
    });

    // Create Groq API request
    const groqPromise = (async () => {
      const groq = new Groq({ apiKey: GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a sports event promoter who writes exciting, engaging descriptions. Keep it brief and enthusiastic."
          },
          {
            role: "user",
            content: `Write a brief 1-2 sentence exciting description for this sports event: "${eventTitle}". Be engaging and enthusiastic. No markdown.`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        max_tokens: 100,
      });

      return completion.choices[0]?.message?.content || '';
    })();

    // Race between AI request and timeout
    try {
      const output = await Promise.race([groqPromise, timeoutPromise]);

      if (output && output.length > 20) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ description: output.trim() })
        };
      }
    } catch (aiError) {
      console.log('AI generation failed or timed out:', aiError.message);
    }

    // Enhanced template with variety
    const templates = [
      `${eventTitle} promises to deliver world-class sporting action featuring elite athletes competing at the pinnacle of their sport. Don't miss this spectacular showcase of skill, speed, and determination!`,
      `Get ready for ${eventTitle} - an unmissable sporting event bringing together the finest competitors for an unforgettable display of athletic excellence and competitive spirit.`,
      `${eventTitle} is set to captivate audiences worldwide with thrilling performances, intense competition, and memorable moments that define championship-level sports.`,
      `Experience the excitement of ${eventTitle}, where top athletes battle for glory in a high-stakes competition that celebrates the very best of sporting achievement.`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        description: randomTemplate,
        note: 'Generated using template (AI took too long)'
      })
    };

  } catch (error) {
    console.error('Error generating event description:', error);
    
    const { eventTitle } = JSON.parse(event.body);
    const templates = [
      `${eventTitle} promises to deliver world-class sporting action featuring elite athletes competing at the pinnacle of their sport. Don't miss this spectacular showcase of skill, speed, and determination!`,
      `Get ready for ${eventTitle} - an unmissable sporting event bringing together the finest competitors for an unforgettable display of athletic excellence and competitive spirit.`,
      `${eventTitle} is set to captivate audiences worldwide with thrilling performances, intense competition, and memorable moments that define championship-level sports.`,
      `Experience the excitement of ${eventTitle}, where top athletes battle for glory in a high-stakes competition that celebrates the very best of sporting achievement.`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        description: randomTemplate,
        note: 'Generated using template (error occurred)'
      })
    };
  }
};
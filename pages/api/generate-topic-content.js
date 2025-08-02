export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, content, geminiApiKey } = req.body;
  
  if (!topic || !content || !geminiApiKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] Generate Topic Content API request for topic:`, topic.title);

  const prompt = `Generate detailed content for the specified topic to provide comprehensive information for students.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "topicContent": {
    "detailedDescription": "Comprehensive explanation of the topic...",
    "keyPoints": [
      "Important point 1",
      "Important point 2",
      "Important point 3"
    ],
    "examples": [
      {
        "title": "Example 1",
        "description": "Detailed explanation of the example"
      }
    ],
    "commonMisconceptions": [
      {
        "misconception": "Common mistake students make",
        "correction": "Correct understanding"
      }
    ],
    "studyTips": [
      "Tip for studying this topic effectively"
    ],
    "examTips": [
      "Tip for answering questions on this topic"
    ],
    "relatedConcepts": [
      {
        "concept": "Related concept name",
        "relationship": "How it relates to this topic"
      }
    ],
    "practiceQuestions": [
      {
        "question": "Sample practice question",
        "answer": "Correct answer",
        "explanation": "Why this is correct"
      }
    ]
  }
}

Guidelines:
- Provide comprehensive, detailed information
- Include practical examples and applications
- Address common misconceptions
- Give specific study and exam tips
- Show relationships with other concepts
- Include sample practice questions
- Make content engaging and educational

Topic: ${JSON.stringify(topic, null, 2)}
Original content: ${content}`;

  try {
    console.log(`[${requestId}] Making Gemini API request for Topic Content generation`);
    const startTime = Date.now();
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const endTime = Date.now();
    console.log(`[${requestId}] Gemini API response time:`, endTime - startTime, 'ms');

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[${requestId}] Gemini API error:`, errorData);
      return res.status(500).json({ error: `Gemini API error: ${response.status} - ${errorData}` });
    }

    const data = await response.json();
    let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log(`[${requestId}] Raw Gemini response length:`, responseText.length);
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(responseText);
      }
      console.log(`[${requestId}] Successfully parsed JSON response`);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse JSON response:`, parseError);
      console.error(`[${requestId}] Raw response:`, responseText);
      return res.status(500).json({ error: 'Invalid JSON response from AI' });
    }

    console.log(`[${requestId}] Successfully generated topic content`);
    return res.status(200).json({ topicContent: parsedResponse.topicContent });

  } catch (error) {
    console.error(`[${requestId}] Generate Topic Content API request error:`, error);
    res.status(500).json({ error: `Failed to process request: ${error.message}` });
  }
} 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, content, geminiApiKey } = req.body;
  
  if (!topic || !content || !geminiApiKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] Generate Question Bank API request for topic:`, topic.title);

  const prompt = `Generate a comprehensive question bank for the specified topic. Create a mix of multiple choice questions (MCQ) and text-based questions.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "questionBank": [
    {
      "id": "q1",
      "question": "What is the main concept being tested?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why this is correct",
      "difficulty": "easy",
      "topic": "Topic name"
    },
    {
      "id": "q2", 
      "question": "Explain the key concept in your own words.",
      "type": "text",
      "correctAnswer": "Expected response that demonstrates understanding",
      "explanation": "Explanation of what constitutes a good answer",
      "difficulty": "medium",
      "topic": "Topic name"
    }
  ]
}

Guidelines:
- Generate 10-15 questions per topic
- Mix of MCQ (60%) and text questions (40%)
- Vary difficulty levels: 40% easy, 40% medium, 20% hard
- For MCQ: Include 4 options, one correct answer
- For text: Provide expected response and explanation
- Focus on key concepts from the topic
- Ensure questions are clear and unambiguous

Topic: ${JSON.stringify(topic, null, 2)}
Original content: ${content}`;

  try {
    console.log(`[${requestId}] Making Gemini API request for Question Bank generation`);
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

    console.log(`[${requestId}] Successfully generated question bank with ${parsedResponse.questionBank?.length || 0} questions`);
    return res.status(200).json({ questionBank: parsedResponse.questionBank });

  } catch (error) {
    console.error(`[${requestId}] Generate Question Bank API request error:`, error);
    res.status(500).json({ error: `Failed to process request: ${error.message}` });
  }
} 
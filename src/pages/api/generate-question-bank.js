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

  const prompt = `Generate a comprehensive question bank for the specified topic using proven learning strategies. Create a diverse mix of question types that promote active recall, spaced repetition, and metacognitive awareness.

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
      "topic": "Topic name",
      "learningStrategy": "active_recall"
    },
    {
      "id": "q2", 
      "question": "Explain the key concept in your own words.",
      "type": "text",
      "correctAnswer": "Expected response that demonstrates understanding",
      "explanation": "Explanation of what constitutes a good answer",
      "difficulty": "medium",
      "topic": "Topic name",
      "learningStrategy": "elaboration"
    },
    {
      "id": "q3",
      "question": "Compare and contrast two related concepts.",
      "type": "text",
      "correctAnswer": "Expected comparison showing understanding of both concepts",
      "explanation": "Explanation of key differences and similarities",
      "difficulty": "hard",
      "topic": "Topic name",
      "learningStrategy": "comparison"
    }
  ]
}

Learning Strategy Guidelines:
1. **Active Recall (40%)**: Questions that force students to retrieve information from memory
2. **Elaboration (30%)**: Questions requiring students to explain concepts in their own words
3. **Comparison (20%)**: Questions asking students to compare/contrast related concepts
4. **Application (10%)**: Questions requiring students to apply concepts to new situations

Question Type Distribution:
- MCQ: 50% (for quick assessment and confidence building)
- Text: 50% (for deeper understanding and metacognitive development)

Difficulty Distribution:
- Easy: 40% (build confidence and foundational knowledge)
- Medium: 40% (challenge understanding)
- Hard: 20% (promote deeper thinking)

Additional Guidelines:
- Include questions that test different levels of Bloom's Taxonomy
- Create questions that encourage metacognitive reflection
- Ensure questions are clear and unambiguous
- Focus on key concepts and their relationships
- Include questions that test both factual knowledge and conceptual understanding
- Generate 12-15 questions per topic for optimal learning

Topic: ${JSON.stringify(topic, null, 2)}
Original content: ${content}`;

  try {
    console.log(`[${requestId}] Making Gemini API request for Question Bank generation`);
    const startTime = Date.now();
    const model = 'gemini-3-flash-preview';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const responseTimeMs = Date.now() - startTime;
    console.log(`[${requestId}] Gemini API response time:`, responseTimeMs, 'ms');

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
    return res.status(200).json({ 
      questionBank: parsedResponse.questionBank,
      usageMetadata: data.usageMetadata || null,
      responseTimeMs,
      model,
      promptType: 'generateQuestionBank'
    });

  } catch (error) {
    console.error(`[${requestId}] Generate Question Bank API request error:`, error);
    res.status(500).json({ error: `Failed to process request: ${error.message}` });
  }
} 
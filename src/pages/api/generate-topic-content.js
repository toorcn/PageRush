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
    "detailedDescription": "Comprehensive explanation of the topic with clear structure, key concepts, and practical applications. Include both theoretical foundations and real-world relevance.",
    "keyPoints": [
      "Concise, actionable key point that can stand alone",
      "Another essential concept or principle",
      "Important practical application or implication",
      "Critical understanding or insight",
      "Key takeaway or summary point"
    ],
    "examples": [
      {
        "title": "Clear, descriptive example title",
        "description": "Detailed explanation of the example with context, application, and learning value"
      },
      {
        "title": "Another practical example",
        "description": "Comprehensive example that demonstrates the concept in action"
      }
    ],
    "commonMisconceptions": [
      {
        "misconception": "Specific, clear description of a common mistake or misunderstanding",
        "correction": "Detailed explanation of the correct understanding with reasoning"
      },
      {
        "misconception": "Another common error students make",
        "correction": "Clear correction with explanation of why the misconception is wrong"
      }
    ],
    "studyTips": [
      "Specific, actionable study strategy or technique",
      "Practical tip for understanding or memorizing this topic",
      "Effective learning approach or method",
      "Time-saving or efficiency tip",
      "Memory or retention strategy"
    ],
    "examTips": [
      "Specific strategy for answering questions on this topic",
      "Common exam question types and how to approach them",
      "Time management tip for this topic",
      "Key things to remember during exams",
      "How to apply this knowledge in test situations"
    ],
    "relatedConcepts": [
      {
        "concept": "Name of related concept or topic",
        "relationship": "Clear explanation of how this concept relates to the main topic, including connections and differences"
      },
      {
        "concept": "Another related concept",
        "relationship": "Detailed explanation of the relationship and its significance"
      }
    ],
    "practiceQuestions": [
      {
        "question": "Clear, specific practice question that tests understanding",
        "answer": "Concise, accurate answer",
        "explanation": "Detailed explanation of why this answer is correct, including key concepts and reasoning"
      },
      {
        "question": "Another practice question covering different aspects",
        "answer": "Correct answer with context",
        "explanation": "Comprehensive explanation of the answer and related concepts"
      }
    ]
  }
}

CONTENT QUALITY REQUIREMENTS:
- Each item should be self-contained and meaningful
- Provide specific, actionable information rather than vague statements
- Include both theoretical and practical aspects
- Ensure content works well in different display formats (tables, cards, lists)
- Make information easily scannable and digestible
- Balance depth with accessibility

STRUCTURED CONTENT GUIDELINES:
- Key Points: 5-7 essential, memorable points that summarize the topic
- Examples: 2-3 practical, real-world examples with clear explanations
- Misconceptions: 2-3 common errors with detailed corrections
- Study Tips: 5-7 specific, actionable strategies for learning this topic
- Exam Tips: 5-7 practical strategies for test-taking on this topic
- Related Concepts: 2-3 connected topics with clear relationship explanations
- Practice Questions: 2-3 questions that test different aspects of understanding

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
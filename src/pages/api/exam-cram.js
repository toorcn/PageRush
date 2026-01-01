export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, content, topicBreakdown, topic, difficulty, question, userAnswer, geminiApiKey } = req.body;
  
  if (!action || !geminiApiKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Add request logging
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] Exam Cram API request:`, { action, timestamp: new Date().toISOString() });

  let prompt = '';
  
  switch (action) {
    case 'generateTopicBreakdown':
      prompt = `Analyze the following educational content and create a comprehensive topic breakdown for exam preparation.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "topics": [
    {
      "id": "unique_id_1",
      "title": "Topic Title",
      "description": "Brief description of the topic",
      "priority": "high|medium|low",
      "difficultyLevel": "beginner|intermediate|advanced",
      "estimatedStudyTime": 15,
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "learningObjectives": ["objective1", "objective2", "objective3"],
      "relatedTopics": ["related1", "related2"]
    }
  ]
}

Guidelines:
- Extract 6-10 main topics from the content
- Assign priority based on importance and complexity
- Estimate study time in minutes (5-30 minutes per topic)
- Include 3-5 key concepts per topic
- Include 2-3 learning objectives per topic
- Identify related topics for cross-referencing

Content to analyze:
${content}`;
      break;

    case 'generateReadinessAssessment':
      prompt = `Based on the provided topic breakdown, create a comprehensive readiness assessment for exam preparation.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "overallScore": 75,
  "overallAssessment": "You have a solid foundation but need to focus on specific areas",
  "totalTopics": 8,
  "masteredTopics": 3,
  "weakTopics": 2,
  "estimatedStudyTime": 4,
  "categoryScores": [
    {
      "name": "Conceptual Understanding",
      "score": 80,
      "description": "Good grasp of fundamental concepts"
    }
  ],
  "knowledgeGaps": [
    {
      "topic": "Topic Name",
      "topicId": "topic_id",
      "description": "Description of the gap",
      "missingConcepts": ["concept1", "concept2"]
    }
  ],
  "strengths": [
    {
      "topic": "Topic Name",
      "description": "Description of strength"
    }
  ],
  "topicAnalysis": [
    {
      "name": "Topic Name",
      "score": 75,
      "difficulty": "intermediate",
      "assessment": "Good understanding with room for improvement",
      "keyConcepts": [
        {
          "name": "Concept Name",
          "mastered": true
        }
      ]
    }
  ],
  "studyPlan": [
    {
      "name": "Phase 1: Foundation Review",
      "duration": "2 hours",
      "description": "Review fundamental concepts",
      "topics": [
        {
          "name": "Topic Name",
          "id": "topic_id"
        }
      ]
    }
  ],
  "priorityAreas": [
    {
      "topic": "Topic Name",
      "topicId": "topic_id",
      "reason": "Reason for priority",
      "suggestedActions": ["action1", "action2"]
    }
  ],
  "examTips": [
    {
      "title": "Tip Title",
      "description": "Tip description"
    }
  ]
}

Guidelines:
- Assess overall readiness (0-100 score)
- Identify knowledge gaps and strengths
- Provide topic-by-topic analysis
- Create a structured study plan
- Suggest priority focus areas
- Include practical exam tips

Topic breakdown for reference:
${JSON.stringify(topicBreakdown, null, 2)}`;
      break;

    case 'generateReviewContent':
      prompt = `Create comprehensive review content for the specified topic to help students understand the key concepts before practice.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "reviewContent": {
    "title": "Review: Topic Name",
    "content": [
      {
        "heading": "Key Concepts",
        "text": "Explanation of key concepts..."
      },
      {
        "heading": "Important Definitions",
        "text": "Key definitions and terms..."
      },
      {
        "heading": "Key Points to Remember",
        "text": "Important points for exam..."
      }
    ]
  }
}

Guidelines:
- Create 3-4 sections covering different aspects
- Use clear, concise explanations
- Focus on exam-relevant information
- Include practical examples where helpful

Topic to review:
${JSON.stringify(topic, null, 2)}

Original content for reference:
${content}`;
      break;

    case 'generatePracticeQuestion':
      prompt = `Generate a practice question for the specified topic at the given difficulty level.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "question": {
    "question": "What is the main concept being tested?",
    "type": "mcq|text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Correct answer or expected response",
    "explanation": "Explanation of why this is correct",
    "difficulty": "easy|medium|hard",
    "topic": "Topic name"
  }
}

Guidelines:
- Create questions appropriate for the difficulty level
- For MCQ: Include 4 options, one correct answer
- For text: Expect 1-2 sentence responses
- Provide clear explanations
- Focus on key concepts from the topic

Topic: ${JSON.stringify(topic, null, 2)}
Difficulty: ${difficulty}
Original content: ${content}`;
      break;

    case 'generateTopicContent':
      prompt = `Generate detailed content for the specified topic to provide comprehensive information for students.

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
      break;

    case 'gradeAnswer':
      prompt = `Grade the user's answer for the given question. Provide detailed feedback and explanation.

IMPORTANT: Return ONLY a valid JSON object, no markdown formatting, no code blocks, no additional text.

The response should have this exact structure:
{
  "isCorrect": true,
  "correctAnswer": "The correct answer",
  "explanation": "Detailed explanation of why the answer is correct or incorrect",
  "feedback": "Constructive feedback for improvement",
  "score": 0.8
}

Guidelines:
- Be lenient but accurate in grading
- Provide helpful explanations
- Give constructive feedback
- Score from 0.0 to 1.0

Question: ${JSON.stringify(question, null, 2)}
User Answer: ${userAnswer}`;
      break;

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    console.log(`[${requestId}] Making Gemini API request for Exam Cram:`, action);
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

    // Return the appropriate data based on action
    let result;
    switch (action) {
      case 'generateTopicBreakdown':
        result = { breakdown: parsedResponse };
        break;
      case 'generateReadinessAssessment':
        result = { assessment: parsedResponse };
        break;
      case 'generateReviewContent':
        result = { reviewContent: parsedResponse.reviewContent };
        break;
      case 'generatePracticeQuestion':
        result = { question: parsedResponse.question };
        break;
      case 'generateTopicContent':
        result = { topicContent: parsedResponse.topicContent };
        break;
      case 'gradeAnswer':
        result = parsedResponse;
        break;
      default:
        result = parsedResponse;
    }

    console.log(`[${requestId}] Successfully processed ${action} request`);
    return res.status(200).json(result);

  } catch (error) {
    console.error(`[${requestId}] Exam Cram API request error:`, error);
    res.status(500).json({ error: `Failed to process request: ${error.message}` });
  }
} 
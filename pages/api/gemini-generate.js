export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, promptType, geminiApiKey, topics, questionCount, knowledgeType, questionTypes, performanceSummary } = req.body;
  
  if (!text || !promptType || !geminiApiKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let prompt = '';
  switch (promptType) {
    case 'extractTopics':
      prompt = `Analyze the following text and extract 6-15 main topics, concepts, or themes that would be suitable for creating educational content.

INSTRUCTIONS:
1. Identify key concepts, definitions, processes, theories, principles, and important subject areas
2. Look for both broad topics and specific subtopics
3. Consider different levels of complexity (basic to advanced)
4. Include both theoretical and practical concepts
5. Extract topics that would make good quiz/exam questions
6. Look for recurring themes and central ideas

ANALYSIS APPROACH:
- Scan for headings, titles, and emphasized text
- Identify key terms and their definitions
- Look for lists, enumerations, and structured content
- Find cause-and-effect relationships
- Identify processes, steps, and procedures
- Extract main arguments and supporting points
- Look for comparisons and contrasts
- Identify examples and case studies

CRITICAL: Return ONLY a valid JSON array of strings, no markdown formatting, no code blocks, no additional text.

Example format:
["Basic Concept", "Advanced Theory", "Key Process", "Important Definition", "Main Principle", "Practical Application", "Core Theory", "Essential Process", "Fundamental Concept", "Key Application"]

Each topic should be 2-8 words, descriptive, and clearly identifiable for educational purposes.

Text to analyze:\n\n${text}`;
      break;
    case 'studyGuide':
      prompt = `Create a comprehensive study guide from the following text. Organize the content into clear sections with proper headings and structure.

INSTRUCTIONS:
1. Use markdown headers (# ## ###) to organize content hierarchically
2. Include main topics as level 1 headers (# Main Topic)
3. Use level 2 headers (##) for subtopics
4. Use level 3 headers (###) for specific concepts
5. Include key definitions, concepts, and important points
6. Use **bold text** to highlight important terms and concepts
7. Create bullet points for lists of related information
8. Include numbered lists for processes, steps, or sequences
9. Add brief explanations and context for each concept
10. Focus on information that would be useful for studying and review

STRUCTURED CONTENT REQUIREMENTS:
- Create content that can be displayed in multiple formats (sections, tables, cards)
- Each section should have a clear, descriptive title
- Include concise summaries that work well in table previews
- Structure information for easy scanning and comparison
- Use consistent formatting patterns throughout

FORMAT REQUIREMENTS:
- Start with a main title using # 
- Use ## for major sections (aim for 4-8 main sections)
- Use ### for subsections (2-4 per main section)
- Use **bold** for key terms and important concepts
- Use bullet points (- or *) for lists of related information
- Use numbered lists (1. 2. 3.) for processes, steps, or sequences
- Include brief explanations for each concept
- Make content scannable and well-organized

CONTENT ORGANIZATION:
- Group related concepts together
- Use clear, descriptive section titles
- Include both theoretical and practical information
- Balance depth with accessibility
- Ensure each section has meaningful content

Example structure:
# [Main Topic Title]
## [Key Concept 1]
**Important Term**: Clear definition and explanation
- Supporting point 1
- Supporting point 2
- Additional context

## [Key Concept 2]
### [Subconcept A]
**Term**: Definition
1. First step in process
2. Second step in process
3. Final step

### [Subconcept B]
**Another Term**: Definition
- Related information
- Additional details

## [Key Concept 3]
**Core Concept**: Explanation
- Key point 1
- Key point 2
- Key point 3

Text to create study guide from:\n\n${text}`;
      break;
    case 'flashcards':
      prompt = `Generate flashcards (question and answer pairs) from the following text.\n\nReturn ONLY a valid JSON array of objects, no markdown formatting, no code blocks, no extra text.\n\nEach object must have a 'question' and an 'answer' field. The 'answer' should be a concise answer to the 'question'. The 'question' is the front of the card, the 'answer' is the back.\n\nExample format:\n[\n  {\n    \"question\": \"What is the capital of France?\",\n    \"answer\": \"Paris\"\n  },\n  {\n    \"question\": \"What is 2 + 2?\",\n    \"answer\": \"4\"\n  }\n]\n\nText to use:\n\n${text}`;
      break;
    case 'quiz':
      const topicFilter = topics && topics.length > 0 ? `Focus specifically on these topics: ${topics.join(', ')}. ` : '';
      const knowledgeTypeFilter = knowledgeType && knowledgeType.trim() ? `Test the user's knowledge specifically on: ${knowledgeType}. ` : '';
      const count = questionCount || 10;
      prompt = `Create ${count} multiple-choice questions based on the following text. ${topicFilter}${knowledgeTypeFilter}Each question must have exactly 4 answer options and one correct answer.

IMPORTANT: Return ONLY a JSON array, no markdown formatting, no code blocks, no additional text.

Each question object should have this exact structure:
{
  "question": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The correct option (must be one of the options)",
  "explanation": "Brief explanation of why this answer is correct"
}

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "answer": "Paris",
    "explanation": "Paris is the capital city of France."
  }
]

Text to base questions on:\n\n${text}`;
      break;
    case 'exam':
      const examTopicFilter = topics && topics.length > 0 ? `Focus specifically on these topics: ${topics.join(', ')}. ` : '';
      const examKnowledgeTypeFilter = knowledgeType && knowledgeType.trim() ? `Test the user's knowledge specifically on: ${knowledgeType}. ` : '';
      const performanceFilter = performanceSummary && performanceSummary.trim() ? `\n\nSTUDENT PERFORMANCE CONTEXT:\n${performanceSummary}\n\nUse this performance data to create questions that specifically target the student's weak areas and help them improve. Focus on topics and concepts where they struggled. ` : '';
      
      // Build question type specifications
      let questionTypeSpecs = '';
      if (questionTypes && Array.isArray(questionTypes)) {
        questionTypeSpecs = questionTypes.map(({ type, count }) => {
          switch (type) {
            case 'mcq':
              return `${count} multiple choice questions with 4 options each`;
            case 'shortAnswer':
              return `${count} short answer questions (1-2 sentences expected)`;
            case 'discuss':
              return `${count} discussion questions (paragraph-length responses expected)`;
            case 'describe':
              return `${count} description questions (detailed explanations expected)`;
            case 'fillBlanks':
              return `${count} fill-in-the-blank questions`;
            default:
              return '';
          }
        }).filter(spec => spec).join(', ');
      }

      prompt = `Create a comprehensive exam with the following question types: ${questionTypeSpecs || '5 multiple choice, 3 short answer, 2 discussion questions'}.

${examTopicFilter}${examKnowledgeTypeFilter}${performanceFilter}

IMPORTANT: Return ONLY a valid JSON array, no markdown formatting, no code blocks, no additional text.

Each question object must have this exact structure:
{
  "question": "The question text here",
  "type": "mcq|shortAnswer|discuss|describe|fillBlanks",
  "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ type
  "answer": "The correct answer or expected response",
  "explanation": "Brief explanation or assessment criteria",
  "points": 1 // Points for this question
}

For different question types:
- MCQ: Include 4 options, one correct answer
- Short Answer: Expect 1-2 sentence responses
- Discuss: Expect paragraph-length responses explaining concepts
- Describe: Expect detailed descriptions
- Fill Blanks: Provide sentence with blank(s) to fill

Assessment criteria:
- MCQ: Exact match with correct option
- Short Answer: Key terms and concepts present
- Discuss: Main points covered, logical flow
- Describe: Essential details included
- Fill Blanks: Exact word/phrase match

Example format:
[
  {
    "question": "What is the capital of France?",
    "type": "mcq",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "answer": "Paris",
    "explanation": "Paris is the capital city of France.",
    "points": 1
  },
  {
    "question": "Explain the concept of photosynthesis.",
    "type": "discuss",
    "answer": "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This process occurs in chloroplasts and is essential for plant growth and oxygen production.",
    "explanation": "Response should include: process description, inputs/outputs, location, importance",
    "points": 3
  }
]

Text to base questions on:\n\n${text}`;
      break;
    default:
      return res.status(400).json({ error: 'Invalid prompt type' });
  }

  try {
    console.log('Making Gemini API request with prompt type:', promptType);
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return res.status(500).json({ error: `Gemini API error: ${response.status} - ${errorData}` });
    }

    const data = await response.json();
    console.log('Gemini API successful response:', JSON.stringify(data, null, 2));
    res.status(200).json({ result: data });
  } catch (error) {
    console.error('Gemini API request error:', error);
    res.status(500).json({ error: `Failed to call Gemini API: ${error.message}` });
  }
} 
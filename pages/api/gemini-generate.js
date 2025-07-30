export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, promptType, geminiApiKey, topics, questionCount } = req.body;
  
  if (!text || !promptType || !geminiApiKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let prompt = '';
  switch (promptType) {
    case 'extractTopics':
      prompt = `Analyze the following text and extract 6-8 main topics or themes that would be suitable for creating quiz questions. 

Focus on:
- Key concepts and definitions
- Important processes or procedures
- Main theories or principles
- Significant facts or data points
- Core subject areas

CRITICAL: You must return ONLY a valid JSON array of strings, no markdown formatting, no code blocks, no additional text.

Example format:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"]

Each topic should be 2-6 words and clearly identifiable.

Text to analyze:\n\n${text}`;
      break;
    case 'studyGuide':
      prompt = `Summarize the following text into detailed study notes, organized by topic and subtopic:\n\n${text}`;
      break;
    case 'flashcards':
      prompt = `Generate flashcards (question and answer pairs) from the following text:\n\n${text}`;
      break;
    case 'quiz':
      const topicFilter = topics && topics.length > 0 ? `Focus specifically on these topics: ${topics.join(', ')}. ` : '';
      const count = questionCount || 10;
      prompt = `Create ${count} multiple-choice questions based on the following text. ${topicFilter}Each question must have exactly 4 answer options and one correct answer.

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
      prompt = `Generate a custom exam (10-20 questions, mix of MCQ and short answer) from the following text. Provide correct answers and explanations:\n\n${text}`;
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
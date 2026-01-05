export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, lessonType, geminiApiKey } = req.body;

  if (!text || !lessonType || !geminiApiKey) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('Making Gemini API request for focus mode lesson type:', lessonType);

    let prompt = '';
    
    switch (lessonType) {
      case 'key_concepts':
        prompt = `Based on the following text, extract and explain the 5 most important key concepts. Present them in a clear, structured format that's easy to understand and remember. Focus on the core ideas that are essential for understanding the topic.

Text: ${text}

Please provide:
1. A brief introduction to the key concepts
2. 5 key concepts with clear explanations
3. A brief summary of why these concepts matter

Format the response in a clean, readable way with bullet points or numbered lists.`;
        break;
        
      case 'quick_quiz':
        prompt = `Based on the following text, create 3 multiple-choice questions that test understanding of the key concepts. Make the questions engaging and educational, not just factual recall.

Text: ${text}

For each question:
- Ask about understanding, not just memorization
- Provide 4 answer choices (A, B, C, D)
- Make sure there's one clearly correct answer
- Include brief explanations for why the correct answer is right

Format as:
1. [Question]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]

[Brief explanation of the correct answer]`;
        break;
        
      case 'summary':
        prompt = `Create a concise, well-structured summary of the following text. Focus on the main ideas and key takeaways. Make it easy to understand and remember.

Text: ${text}

Please provide:
1. A brief overview of the main topic
2. Key points and insights
3. Important takeaways or conclusions
4. How this information connects to broader concepts

Keep it concise but comprehensive, using clear language and logical flow.`;
        break;
        
      case 'flashcards':
        prompt = `Based on the following text, create 5 flashcards with key terms or concepts and their definitions. Focus on important vocabulary and concepts that would be useful to memorize.

Text: ${text}

Format each flashcard as:
Term: [Key term or concept]
Definition: [Clear, concise explanation]

Choose terms that are:
- Important for understanding the topic
- Likely to appear in exams or discussions
- Useful for building knowledge foundation

Make the definitions clear and memorable.`;
        break;
        
      default:
        prompt = `Based on the following text, create a focused learning lesson that helps the reader understand the key concepts and main ideas.

Text: ${text}

Please provide:
1. An overview of the main topic
2. Key concepts and their explanations
3. Important points to remember
4. Practical applications or examples

Make it engaging, clear, and easy to follow.`;
    }

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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return res.status(500).json({ error: `Gemini API error: ${response.status} - ${errorData}` });
    }

    const data = await response.json();
    console.log('Gemini API successful response for focus mode:', JSON.stringify(data, null, 2));
    res.status(200).json({ 
      result: data,
      usageMetadata: data.usageMetadata || null,
      responseTimeMs,
      model,
      promptType: lessonType
    });

  } catch (error) {
    console.error('Focus mode generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate focus mode content',
      details: error.message 
    });
  }
} 
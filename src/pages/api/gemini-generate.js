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
      prompt = `Create a comprehensive, well-structured study guide from the following text. Every section MUST contain meaningful content - no empty sections allowed.

CRITICAL RULES:
1. EVERY section (## or ###) MUST have at least 2-3 bullet points or a paragraph of content
2. NEVER create a header without content beneath it
3. Include visual diagrams using Mermaid syntax where helpful
4. Use **Term**: Definition format for key concepts

STRUCTURE REQUIREMENTS:
- Use # for the main title
- Use ## for major sections (4-8 sections)
- Use ### for subsections within major sections
- Each section MUST have substantive content (definitions, explanations, lists)

CONTENT FOR EACH SECTION MUST INCLUDE:
- Clear explanations of concepts (2-4 sentences minimum)
- Key terms with definitions using **Term**: Definition format
- Bullet points listing important details
- Examples or applications where relevant

DIAGRAM REQUIREMENTS (include 1-2 per study guide where appropriate):
Use Mermaid syntax in code blocks for:
- Flowcharts for processes/procedures
- Mind maps for concept relationships
- Sequence diagrams for step-by-step processes

Example Mermaid flowchart:
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

Example Mermaid mind map:
\`\`\`mermaid
mindmap
  root((Main Concept))
    Branch 1
      Detail A
      Detail B
    Branch 2
      Detail C
      Detail D
\`\`\`

FORMAT EXAMPLE:
# Study Guide: [Topic Name]

## Overview
[2-3 sentences introducing the topic and its importance]

**Key Concept**: Clear definition here
- Important point 1
- Important point 2
- Important point 3

## [Major Topic 1]
[Introductory paragraph explaining this topic]

**Term 1**: Definition and explanation
**Term 2**: Definition and explanation

### [Subtopic 1.1]
[Detailed explanation of this subtopic]
- Detail point 1
- Detail point 2
- Detail point 3

### [Subtopic 1.2]
[Content explaining this subtopic]
1. Step one of process
2. Step two of process
3. Step three of process

## [Major Topic 2]
[Introduction to this section]

\`\`\`mermaid
flowchart LR
    A[Concept A] --> B[Concept B]
    B --> C[Concept C]
\`\`\`

**Important Term**: Detailed definition
- Supporting detail 1
- Supporting detail 2

## Key Takeaways
- Summary point 1
- Summary point 2
- Summary point 3

REMEMBER: Every single section header MUST be followed by actual content. No empty sections!

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
      
      // Build question type specifications with exact counts
      let questionTypeSpecs = '';
      let totalQuestionCount = 0;
      const questionBreakdown = [];
      
      if (questionTypes && Array.isArray(questionTypes)) {
        questionTypes.forEach(({ type, count }) => {
          if (count > 0) {
            totalQuestionCount += count;
            switch (type) {
              case 'mcq':
                questionBreakdown.push(`- EXACTLY ${count} multiple choice questions (type: "mcq") with 4 options each`);
                break;
              case 'shortAnswer':
                questionBreakdown.push(`- EXACTLY ${count} short answer questions (type: "shortAnswer") expecting 1-2 sentence responses`);
                break;
              case 'discuss':
                questionBreakdown.push(`- EXACTLY ${count} discussion questions (type: "discuss") expecting paragraph-length responses`);
                break;
              case 'describe':
                questionBreakdown.push(`- EXACTLY ${count} description questions (type: "describe") expecting detailed explanations`);
                break;
              case 'fillBlanks':
                questionBreakdown.push(`- EXACTLY ${count} fill-in-the-blank questions (type: "fillBlanks")`);
                break;
            }
          }
        });
        questionTypeSpecs = questionBreakdown.join('\n');
      }
      
      // Fallback if no question types specified
      if (!questionTypeSpecs) {
        questionTypeSpecs = `- EXACTLY 5 multiple choice questions (type: "mcq") with 4 options each
- EXACTLY 3 short answer questions (type: "shortAnswer") expecting 1-2 sentence responses
- EXACTLY 2 discussion questions (type: "discuss") expecting paragraph-length responses`;
        totalQuestionCount = 10;
      }

      prompt = `Create an exam with EXACTLY ${totalQuestionCount} questions total. You MUST follow these EXACT question counts:

${questionTypeSpecs}

CRITICAL: The total number of questions MUST be exactly ${totalQuestionCount}. Do NOT add extra questions or skip any. Count your questions before returning.

${examTopicFilter}${examKnowledgeTypeFilter}${performanceFilter}

IMPORTANT: Return ONLY a valid JSON array, no markdown formatting, no code blocks, no additional text.

Each question object must have this exact structure:
{
  "question": "The question text here",
  "type": "mcq|shortAnswer|discuss|describe|fillBlanks",
  "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ type
  "answer": "The correct answer or expected response",
  "explanation": "Brief explanation or assessment criteria",
  "points": 1 // Points for this question (MCQ=1, shortAnswer=2, discuss=3, describe=3, fillBlanks=1)
}

Question type requirements:
- mcq: MUST include exactly 4 options array, one correct answer, points=1
- shortAnswer: NO options array, expect 1-2 sentence responses, points=2
- discuss: NO options array, expect paragraph-length responses, points=3
- describe: NO options array, expect detailed descriptions, points=3
- fillBlanks: NO options array, provide sentence with _____ for blank(s), points=1

VERIFICATION CHECKLIST before returning:
1. Count total questions = ${totalQuestionCount}
2. Verify each question type count matches the requirements above
3. Ensure MCQ questions have exactly 4 options
4. Ensure non-MCQ questions do NOT have options array

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
    case 'structuredUnderstanding':
      prompt = `You are an expert tutor. A learner has this question (and possibly their own answer and the correct answer).

Your goal is to give them a **structured understanding** of the concept, not just the correct answer.

Create a concise, learner-friendly explanation using markdown formatting. Keep it under 300 words total.

STRUCTURE (use markdown formatting):
1. Start with ## Core Concept - a 1–2 sentence plain-language summary
2. Add ## Key Points - use bullet points (-) for 3–5 essential pieces of knowledge
3. Add ## Common Mistakes - use bullet points for 2–3 misconceptions to avoid
4. End with ## Practice Ideas - use bullet points for 2–3 short practice prompts

FORMATTING REQUIREMENTS:
- Use ## for main section headings (Core Concept, Key Points, Common Mistakes, Practice Ideas)
- Use - for bullet points (not * or numbers)
- Use **bold** for important terms
- Keep each bullet point to 1 sentence
- Keep sections concise - maximum 3–5 bullets per section
- Do NOT use code blocks, JSON, or other complex formatting
- Return ONLY markdown-formatted text, no additional explanation

QUESTION:
${text}

Now provide the structured explanation in markdown format.`;
      break;
    case 'whyThisAnswer':
      prompt = `You are an expert tutor. A learner wants to understand WHY the correct answer is right for this question.

Provide a clear, focused explanation of why the correct answer is the best choice. Keep it under 250 words.

STRUCTURE (use markdown formatting):
1. ## Why This Answer - Direct explanation of why this is correct (2-3 sentences)
2. ## Breaking It Down - Step-by-step reasoning (3-4 bullet points)
3. ## Why Not The Others - Brief explanation of why other options are wrong (if applicable)

FORMATTING REQUIREMENTS:
- Use ## for section headings
- Use - for bullet points
- Use **bold** for key terms
- Be direct and specific to THIS question
- Return ONLY markdown-formatted text

QUESTION AND ANSWER:
${text}

Explain why this answer is correct.`;
      break;
    case 'stepByStep':
      prompt = `You are an expert tutor. A learner wants a step-by-step breakdown of how to solve or understand this question.

Provide a clear, methodical walkthrough. Keep it under 300 words.

STRUCTURE (use markdown formatting):
1. ## The Approach - Brief overview of the method (1-2 sentences)
2. ## Step-by-Step Solution - Numbered steps walking through the reasoning
3. ## Key Insight - The main takeaway or "aha moment" (1-2 sentences)

FORMATTING REQUIREMENTS:
- Use ## for section headings
- Use numbered lists (1. 2. 3.) for steps
- Use **bold** for important terms
- Make each step clear and actionable
- Return ONLY markdown-formatted text

QUESTION:
${text}

Provide the step-by-step breakdown.`;
      break;
    case 'realWorldExample':
      prompt = `You are an expert tutor. A learner wants to see how this concept applies in the real world.

Provide practical, relatable examples that make the concept concrete. Keep it under 250 words.

STRUCTURE (use markdown formatting):
1. ## Real-World Connection - How this concept appears in everyday life (1-2 sentences)
2. ## Practical Examples - 2-3 specific, relatable examples with brief explanations
3. ## Why It Matters - The practical importance of understanding this (1-2 sentences)

FORMATTING REQUIREMENTS:
- Use ## for section headings
- Use - for bullet points
- Use **bold** for key terms
- Make examples relatable and memorable
- Return ONLY markdown-formatted text

QUESTION:
${text}

Provide real-world examples.`;
      break;
    case 'memoryTips':
      prompt = `You are an expert tutor. A learner wants memory aids and tricks to remember this concept.

Provide creative, effective memorization techniques. Keep it under 250 words.

STRUCTURE (use markdown formatting):
1. ## Quick Memory Hook - A catchy phrase, acronym, or mental image (1-2 sentences)
2. ## Memory Techniques - 2-3 specific tricks to remember this
3. ## Association Tips - How to connect this to things they already know

FORMATTING REQUIREMENTS:
- Use ## for section headings
- Use - for bullet points
- Use **bold** for key terms and memory hooks
- Be creative and make it stick
- Return ONLY markdown-formatted text

QUESTION:
${text}

Provide memory tips and tricks.`;
      break;
    case 'relatedTopics':
      prompt = `You are an expert tutor. A learner wants to understand how this concept connects to related topics.

Show the bigger picture and connections. Keep it under 250 words.

STRUCTURE (use markdown formatting):
1. ## Where This Fits - How this concept fits into the broader subject (1-2 sentences)
2. ## Related Concepts - 3-4 connected topics with brief explanations of the connection
3. ## What to Learn Next - Suggested topics to explore after mastering this

FORMATTING REQUIREMENTS:
- Use ## for section headings
- Use - for bullet points
- Use **bold** for topic names
- Show clear connections between concepts
- Return ONLY markdown-formatted text

QUESTION:
${text}

Show related topics and connections.`;
      break;
    case 'simplifyIt':
      prompt = `You are an expert tutor. A learner is struggling and needs this concept explained in the simplest possible terms.

Break it down to the basics. Keep it under 200 words.

STRUCTURE (use markdown formatting):
1. ## In Simple Terms - Explain like they're a complete beginner (2-3 sentences, no jargon)
2. ## Think of It Like... - A simple analogy or comparison to something familiar
3. ## The Basics - 2-3 fundamental points to remember

FORMATTING REQUIREMENTS:
- Use ## for section headings
- Use - for bullet points
- Use **bold** sparingly
- Avoid technical jargon
- Use everyday language
- Return ONLY markdown-formatted text

QUESTION:
${text}

Simplify this concept.`;
      break;
    case 'chatHelp':
      prompt = `You are a friendly, expert tutor helping a student understand a quiz/exam question. Your goal is to BUILD UNDERSTANDING, not give away the answer.

CONTEXT:
${text}

TEACHING APPROACH - Use these evidence-based learning techniques:
1. **Elaborative Interrogation**: Ask "why" and "how" questions to deepen thinking
2. **Concrete Examples**: Connect abstract concepts to real-world scenarios
3. **Storytelling**: Share brief origin stories or historical context when relevant
4. **Analogies**: Compare to familiar concepts ("Think of it like...")
5. **Chunking**: Break complex ideas into digestible pieces
6. **Spaced Retrieval Cues**: Give hints that help them recall, not answers
7. **Dual Coding**: Use visual descriptions or mental imagery

RESPONSE GUIDELINES:
- Keep responses concise (150-200 words max)
- Format with clear structure using line breaks
- Use **bold** for key terms
- Use bullet points for lists
- Include a thought-provoking question at the end to guide their thinking
- If they ask directly for the answer, redirect with a helpful hint instead
- Reference the answer options indirectly to help them eliminate wrong choices through understanding

FORMATTING EXAMPLE:
**The Core Idea**
[1-2 sentence explanation of the concept]

**Think of it like...**
[Relatable analogy or real-world example]

**Key insight:** [memorable takeaway]

💭 *Consider this: [guiding question to help them arrive at the answer]*

DO NOT:
- Directly state which option is correct
- Say "the answer is..." or "option X is correct"
- Be condescending or overly academic

Respond naturally and helpfully:`;
      break;
    case 'generateQuestionSuggestions':
      prompt = `Given this quiz/exam question, generate 3-4 short questions a student might ask to better UNDERSTAND the topic (not just get the answer).

QUESTION: ${text}

Generate questions that:
1. Help the student understand the underlying concept
2. Encourage critical thinking, not answer-seeking
3. Are short (under 8 words each)
4. Cover different learning angles:
   - "Why does this work this way?"
   - "How does this connect to...?"
   - "What's the key principle here?"
   - "Can you give me an analogy?"

Good examples:
- "Why is this concept important?"
- "How does this actually work?"
- "What's the key idea here?"
- "Can you explain it simply?"
- "What's a real-world example?"

Bad examples (too answer-focused):
- "What's the correct answer?"
- "Is it A or B?"
- "Tell me the answer"

Return ONLY a JSON array of strings, no markdown, no explanation.`;
      break;
    default:
      return res.status(400).json({ error: 'Invalid prompt type' });
  }

  try {
    console.log('Making Gemini API request with prompt type:', promptType);
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
    console.log('Gemini API successful response:', JSON.stringify(data, null, 2));
    
    // Include usage metadata and timing in response
    res.status(200).json({ 
      result: data,
      usageMetadata: data.usageMetadata || null,
      responseTimeMs,
      model,
      promptType
    });
  } catch (error) {
    console.error('Gemini API request error:', error);
    res.status(500).json({ error: `Failed to call Gemini API: ${error.message}` });
  }
} 
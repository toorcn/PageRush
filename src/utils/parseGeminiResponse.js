export function parseTopics(response) {
  console.log('Raw response for topic parsing:', response);
  
  // Check if response has the expected structure
  if (!response || !response.result || !response.result.candidates || !response.result.candidates[0]) {
    console.error('Invalid response structure:', response);
    return ['General Concepts', 'Key Definitions', 'Important Processes', 'Main Topics'];
  }
  
  // Handle different possible response structures
  let text;
  try {
    text = response.result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Could not extract text from response structure:', error);
    console.log('Response structure:', JSON.stringify(response, null, 2));
    return ['General Concepts', 'Key Definitions', 'Important Processes', 'Main Topics'];
  }
  
  console.log('Extracted text for topic parsing:', text);
  
  // Try to parse as JSON first
  try {
    const topics = JSON.parse(text);
    console.log('Successfully parsed topics as JSON:', topics);
    if (Array.isArray(topics)) {
      const filteredTopics = topics.filter(topic => typeof topic === 'string' && topic.trim().length > 0);
      console.log('Filtered topics:', filteredTopics);
      return filteredTopics;
    }
  } catch (error) {
    console.log('Failed to parse topics as JSON, trying text parsing:', error);
    console.log('Raw text that failed JSON parsing:', text);
  }

  // Fallback: parse topics from text
  const lines = text.split('\n').filter(line => line.trim());
  const topics = [];
  
  lines.forEach(line => {
    // Look for numbered lists, bullet points, or standalone topics
    const cleanLine = line.replace(/^[\d\-\.\s]+/, '').trim();
    if (cleanLine && cleanLine.length > 2 && cleanLine.length < 50) {
      topics.push(cleanLine);
    }
  });
  
  console.log('Topics extracted from text parsing:', topics);
  // return topics.slice(0, 8); // Limit to 8 topics
  return topics;
}

export function parseFlashcards(response) {
  // Try to parse as JSON, fallback to line-based parsing
  try {
    const text = response.result.candidates[0].content.parts[0].text;
    const cards = JSON.parse(text);
    if (Array.isArray(cards)) return cards;
  } catch {}
  // Fallback: parse Q/A pairs from text
  const text = response.result.candidates[0].content.parts[0].text;
  const lines = text.split('\n').filter(Boolean);
  const cards = [];
  let q = '', a = '';
  lines.forEach(line => {
    if (/^Q[:\-]/i.test(line)) q = line.replace(/^Q[:\-]?/i, '').trim();
    else if (/^A[:\-]/i.test(line)) a = line.replace(/^A[:\-]?/i, '').trim();
    if (q && a) { cards.push({ question: q, answer: a }); q = ''; a = ''; }
  });
  return cards;
}

export function parseQuiz(response) {
  let text = response.result.candidates[0].content.parts[0].text;
  console.log('Raw Gemini response for quiz:', text);
  
  // Try to parse as JSON first
  try {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    const quiz = JSON.parse(text);
    console.log('Parsed JSON quiz:', quiz);
    
    if (Array.isArray(quiz)) {
      // Validate and clean each question
      const cleanedQuiz = quiz.map((q, index) => {
        // Handle different possible JSON structures
        const question = q.question || q.Question || q.text || `Question ${index + 1}`;
        const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : 
                      Array.isArray(q.Options) && q.Options.length >= 2 ? q.Options :
                      Array.isArray(q.choices) && q.choices.length >= 2 ? q.choices :
                      ['Option A', 'Option B', 'Option C', 'Option D'];
        const answer = q.answer || q.Answer || q.correct || q.correct_answer || options[0];
        const explanation = q.explanation || q.Explanation || q.reason || `The correct answer is "${answer}" based on the study materials.`;
        
        return {
          question: question.replace(/^```json\s*/, '').replace(/\s*```$/, ''), // Remove markdown code blocks
          options: options.map(opt => opt.replace(/^```json\s*/, '').replace(/\s*```$/, '')),
          answer: answer.replace(/^```json\s*/, '').replace(/\s*```$/, ''),
          explanation: explanation.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        };
      });
      
      console.log('Cleaned quiz:', cleanedQuiz);
      return cleanedQuiz;
    }
  } catch (error) {
    console.log('Failed to parse quiz as JSON, trying text parsing:', error);
  }

  // Fallback: parse MCQs from text
  const questions = [];
  const blocks = text.split(/\n\n+/);
  
  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length < 3) return; // Need at least question + 2 options
    
    let question = lines[0].replace(/^\d+\.\s*/, '').trim();
    // Remove markdown code blocks
    question = question.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    const options = [];
    let answer = '';
    let explanation = '';
    
    // Parse options and find answer
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^[A-D]\./)) {
        const option = line.replace(/^[A-D]\.\s*/, '').trim();
        options.push(option.replace(/^```json\s*/, '').replace(/\s*```$/, ''));
      } else if (line.toLowerCase().includes('answer') || line.toLowerCase().includes('correct')) {
        answer = line.replace(/.*answer.*?:\s*/i, '').replace(/.*correct.*?:\s*/i, '').trim();
        answer = answer.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        if (!answer && options.length > 0) {
          answer = options[0]; // Default to first option if no answer found
        }
      } else if (line.toLowerCase().includes('explanation') || line.toLowerCase().includes('because')) {
        explanation = line.replace(/.*explanation.*?:\s*/i, '').replace(/.*because.*?:\s*/i, '').trim();
        explanation = explanation.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
    }
    
    // Ensure we have at least 2 options
    if (options.length < 2) {
      options.push('Option A', 'Option B', 'Option C', 'Option D');
    }
    
    // Ensure we have an answer
    if (!answer && options.length > 0) {
      answer = options[0];
    }
    
    if (question && options.length >= 2 && answer) {
      questions.push({
        question,
        options,
        answer,
        explanation: explanation || `The correct answer is "${answer}" based on the study materials.`
      });
    }
  });
  
  console.log('Parsed questions from text:', questions);
  return questions;
}

export function parseExam(response) {
  console.log('Raw Gemini response for exam:', response);
  
  // Check if response has the expected structure
  if (!response || !response.result || !response.result.candidates || !response.result.candidates[0]) {
    console.error('Invalid response structure:', response);
    return [];
  }
  
  let text;
  try {
    text = response.result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Could not extract text from response structure:', error);
    return [];
  }
  
  console.log('Extracted text for exam parsing:', text);
  
  // Try to parse as JSON first
  try {
    const exam = JSON.parse(text);
    console.log('Successfully parsed exam as JSON:', exam);
    
    if (Array.isArray(exam)) {
      // Validate and clean each question
      const cleanedExam = exam.map((q, index) => {
        const question = q.question || q.Question || `Question ${index + 1}`;
        const type = q.type || 'mcq';
        const options = type === 'mcq' && Array.isArray(q.options) ? q.options : [];
        const answer = q.answer || q.Answer || q.correct || '';
        const explanation = q.explanation || q.Explanation || q.reason || '';
        const points = q.points || 1;
        
        return {
          question: question.replace(/^```json\s*/, '').replace(/\s*```$/, ''),
          type: type,
          options: options.map(opt => opt.replace(/^```json\s*/, '').replace(/\s*```$/, '')),
          answer: answer.replace(/^```json\s*/, '').replace(/\s*```$/, ''),
          explanation: explanation.replace(/^```json\s*/, '').replace(/\s*```$/, ''),
          points: points
        };
      });
      
      console.log('Cleaned exam:', cleanedExam);
      return cleanedExam;
    }
  } catch (error) {
    console.log('Failed to parse exam as JSON, trying text parsing:', error);
  }

  // Fallback: parse mixed questions from text
  const questions = [];
  const blocks = text.split(/\n\n+/);
  
  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length < 2) return;
    
    let question = lines[0].replace(/^\d+\.\s*/, '').trim();
    question = question.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // Try to determine question type
    let type = 'mcq';
    if (question.toLowerCase().includes('discuss') || question.toLowerCase().includes('explain')) {
      type = 'discuss';
    } else if (question.toLowerCase().includes('describe')) {
      type = 'describe';
    } else if (question.toLowerCase().includes('fill') || question.toLowerCase().includes('blank')) {
      type = 'fillBlanks';
    } else if (question.length > 100) {
      type = 'shortAnswer';
    }
    
    const options = [];
    let answer = '';
    let explanation = '';
    
    // Parse options for MCQ
    if (type === 'mcq') {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^[A-D]\./)) {
          const option = line.replace(/^[A-D]\.\s*/, '').trim();
          options.push(option.replace(/^```json\s*/, '').replace(/\s*```$/, ''));
        } else if (line.toLowerCase().includes('answer') || line.toLowerCase().includes('correct')) {
          answer = line.replace(/.*answer.*?:\s*/i, '').replace(/.*correct.*?:\s*/i, '').trim();
          answer = answer.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (line.toLowerCase().includes('explanation')) {
          explanation = line.replace(/.*explanation.*?:\s*/i, '').trim();
          explanation = explanation.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
      }
    } else {
      // For non-MCQ questions, look for answer and explanation
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes('answer') || line.toLowerCase().includes('correct')) {
          answer = line.replace(/.*answer.*?:\s*/i, '').replace(/.*correct.*?:\s*/i, '').trim();
          answer = answer.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (line.toLowerCase().includes('explanation')) {
          explanation = line.replace(/.*explanation.*?:\s*/i, '').trim();
          explanation = explanation.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
      }
    }
    
    // Ensure we have an answer
    if (!answer && options.length > 0) {
      answer = options[0];
    }
    
    if (question && (type === 'mcq' ? options.length >= 2 : true) && answer) {
      questions.push({
        question,
        type,
        options,
        answer,
        explanation: explanation || `Expected response for ${type} question.`,
        points: 1
      });
    }
  });
  
  console.log('Parsed questions from text:', questions);
  return questions;
} 
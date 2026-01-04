import type { GeminiResponse, Flashcard, QuizQuestion, ExamQuestion } from '@/types';

const DEFAULT_TOPICS = ['General Concepts', 'Key Definitions', 'Important Processes', 'Main Topics'];

/**
 * Extract text content from Gemini API response
 */
function extractText(response: GeminiResponse): string | null {
  try {
    return response?.result?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

/**
 * Clean markdown code blocks from text
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}

/**
 * Parse topics from Gemini response
 */
export function parseTopics(response: GeminiResponse): string[] {
  const text = extractText(response);
  if (!text) return DEFAULT_TOPICS;

  const cleanedText = cleanMarkdown(text);

  // Try JSON parsing first
  try {
    const topics = JSON.parse(cleanedText);
    if (Array.isArray(topics)) {
      const filtered = topics
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && t.length <= 50);
      
      if (filtered.length > 0) return filtered;
    }
  } catch {
    // Continue to text parsing
  }

  // Text-based parsing fallback
  const lines = cleanedText.split('\n').filter((line) => line.trim());
  const topics: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let cleanLine = line
      .replace(/^[\d\-.\s•]+/, '')
      .replace(/^["']/, '')
      .replace(/["']$/, '')
      .replace(/^[-–—]\s*/, '')
      .trim();

    if (cleanLine && cleanLine.length >= 2 && cleanLine.length <= 50) {
      const lower = cleanLine.toLowerCase();
      if (!seen.has(lower)) {
        const words = cleanLine.split(/\s+/);
        if (words.length >= 1 && words.length <= 8) {
          topics.push(cleanLine);
          seen.add(lower);
        }
      }
    }
  }

  return topics.length >= 4 ? topics : DEFAULT_TOPICS;
}

/**
 * Parse flashcards from Gemini response
 */
export function parseFlashcards(response: GeminiResponse): Flashcard[] {
  const text = extractText(response);
  if (!text) return [];

  // Try JSON parsing first
  try {
    const cards = JSON.parse(cleanMarkdown(text));
    if (Array.isArray(cards) && cards.every((c) => c.question && c.answer)) {
      return cards.map((c) => ({
        question: String(c.question),
        answer: String(c.answer),
        topic: c.topic ? String(c.topic) : undefined,
      }));
    }
  } catch {
    // Continue to text parsing
  }

  // Text-based parsing fallback
  const lines = text.split('\n').filter(Boolean);
  const cards: Flashcard[] = [];
  let q = '', a = '';

  for (const line of lines) {
    if (/^Q[:\-]/i.test(line) || /^Term[:\-]/i.test(line)) {
      q = line.replace(/^(Q|Term)[:\-]?/i, '').trim();
    } else if (/^A[:\-]/i.test(line) || /^Definition[:\-]/i.test(line)) {
      a = line.replace(/^(A|Definition)[:\-]?/i, '').trim();
    }

    if (q && a) {
      cards.push({ question: q, answer: a });
      q = '';
      a = '';
    }
  }

  return cards;
}

/**
 * Parse quiz questions from Gemini response
 */
export function parseQuiz(response: GeminiResponse): QuizQuestion[] {
  const text = extractText(response);
  if (!text) return [];

  const cleanedText = cleanMarkdown(text);

  // Try JSON parsing first
  try {
    const quiz = JSON.parse(cleanedText);
    if (Array.isArray(quiz)) {
      return quiz.map((q, i) => ({
        question: String(q.question || q.Question || q.text || `Question ${i + 1}`),
        options: Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map(String)
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: String(q.answer || q.Answer || q.correct || q.correct_answer || ''),
        explanation: q.explanation || q.Explanation || undefined,
        topic: q.topic ? String(q.topic) : undefined,
      }));
    }
  } catch {
    // Continue to text parsing
  }

  // Text-based parsing fallback
  const questions: QuizQuestion[] = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 3) continue;

    const question = lines[0].replace(/^\d+\.\s*/, '').trim();
    const options: string[] = [];
    let answer = '';
    let explanation = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^[A-D]\./.test(line)) {
        options.push(line.replace(/^[A-D]\.\s*/, '').trim());
      } else if (/answer|correct/i.test(line)) {
        answer = line.replace(/.*answer.*?:\s*/i, '').replace(/.*correct.*?:\s*/i, '').trim();
      } else if (/explanation|because/i.test(line)) {
        explanation = line.replace(/.*explanation.*?:\s*/i, '').replace(/.*because.*?:\s*/i, '').trim();
      }
    }

    if (question && options.length >= 2) {
      questions.push({
        question,
        options,
        answer: answer || options[0],
        explanation: explanation || undefined,
      });
    }
  }

  return questions;
}

/**
 * Parse exam questions from Gemini response
 */
export function parseExam(response: GeminiResponse): ExamQuestion[] {
  const text = extractText(response);
  if (!text) return [];

  const cleanedText = cleanMarkdown(text);

  // Try JSON parsing first
  try {
    const exam = JSON.parse(cleanedText);
    if (Array.isArray(exam)) {
      return exam.map((q, i) => {
        const type = q.type || 'multiple-choice';
        return {
          question: String(q.question || q.Question || `Question ${i + 1}`),
          answer: String(q.answer || q.Answer || q.correct || ''),
          type: type === 'mcq' ? 'multiple-choice' : type,
          options: type === 'mcq' || type === 'multiple-choice'
            ? (Array.isArray(q.options) ? q.options.map(String) : undefined)
            : undefined,
          maxPoints: q.points || q.maxPoints || 1,
          topic: q.topic ? String(q.topic) : undefined,
        };
      });
    }
  } catch {
    // Continue to text parsing
  }

  // Text-based parsing fallback
  const questions: ExamQuestion[] = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 2) continue;

    const question = lines[0].replace(/^\d+\.\s*/, '').trim();
    
    // Determine question type
    let type: ExamQuestion['type'] = 'multiple-choice';
    if (/discuss|explain/i.test(question)) {
      type = 'essay';
    } else if (/describe|short/i.test(question) || question.length > 100) {
      type = 'short-answer';
    }

    const options: string[] = [];
    let answer = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^[A-D]\./.test(line)) {
        options.push(line.replace(/^[A-D]\.\s*/, '').trim());
      } else if (/answer|correct/i.test(line)) {
        answer = line.replace(/.*answer.*?:\s*/i, '').replace(/.*correct.*?:\s*/i, '').trim();
      }
    }

    if (question && answer) {
      questions.push({
        question,
        answer,
        type,
        options: type === 'multiple-choice' && options.length >= 2 ? options : undefined,
        maxPoints: 1,
      });
    }
  }

  return questions;
}

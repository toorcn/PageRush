import { api } from './client';
import type { 
  GeminiResponse, 
  StudyFeature, 
  PerformanceSummary,
  QuizQuestion,
  QuizResult 
} from '@/types';

interface GenerateParams {
  text: string;
  promptType: StudyFeature;
  apiKey: string;
  topics?: string[];
  questionCount?: number;
  knowledgeType?: string;
  questionTypes?: string[];
  performanceSummary?: PerformanceSummary;
}

interface GradeQuizParams {
  userAnswers: Record<number, string> | string[];
  quiz: QuizQuestion[];
  apiKey: string;
}

export const geminiApi = {
  /**
   * Generate study content using Gemini AI
   */
  generate: async (params: GenerateParams): Promise<GeminiResponse> => {
    return api.post<GeminiResponse>('/api/gemini-generate', {
      text: params.text,
      promptType: params.promptType,
      geminiApiKey: params.apiKey,
      topics: params.topics,
      questionCount: params.questionCount,
      knowledgeType: params.knowledgeType,
      questionTypes: params.questionTypes,
      performanceSummary: params.performanceSummary,
    });
  },

  /**
   * Grade a quiz submission
   */
  gradeQuiz: async (params: GradeQuizParams): Promise<QuizResult> => {
    return api.post<QuizResult>('/api/grade-quiz', {
      userAnswers: params.userAnswers,
      quiz: params.quiz,
      geminiApiKey: params.apiKey,
    });
  },

  /**
   * Generate topic content for exam cram
   */
  generateTopicContent: async (
    topic: string,
    documentText: string,
    apiKey: string
  ): Promise<GeminiResponse> => {
    return api.post<GeminiResponse>('/api/generate-topic-content', {
      topic,
      documentText,
      geminiApiKey: apiKey,
    });
  },

  /**
   * Generate exam cram content
   */
  generateExamCram: async (
    text: string,
    apiKey: string
  ): Promise<GeminiResponse> => {
    return api.post<GeminiResponse>('/api/exam-cram', {
      text,
      geminiApiKey: apiKey,
    });
  },

  /**
   * Generate focus mode content
   */
  generateFocusMode: async (
    text: string,
    apiKey: string
  ): Promise<GeminiResponse> => {
    return api.post<GeminiResponse>('/api/focus-mode-generate', {
      text,
      geminiApiKey: apiKey,
    });
  },

  /**
   * Generate question bank
   */
  generateQuestionBank: async (
    text: string,
    topics: string[],
    apiKey: string
  ): Promise<GeminiResponse> => {
    return api.post<GeminiResponse>('/api/generate-question-bank', {
      text,
      topics,
      geminiApiKey: apiKey,
    });
  },
};

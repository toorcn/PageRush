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

// Callback type for metrics tracking
type MetricsCallback = (metrics: {
  endpoint: string;
  promptType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTimeMs: number;
  estimatedCost: number;
  model: string;
}) => void;

let metricsCallback: MetricsCallback | null = null;

export function setMetricsCallback(callback: MetricsCallback | null) {
  metricsCallback = callback;
}

function trackMetrics(response: GeminiResponse & { responseTimeMs?: number; model?: string; promptType?: string }, endpoint: string) {
  if (!metricsCallback) return;
  
  const usageMetadata = response.usageMetadata || response.result?.usageMetadata;
  if (!usageMetadata) return;

  const promptTokens = usageMetadata.promptTokenCount || 0;
  const completionTokens = usageMetadata.candidatesTokenCount || 0;
  const totalTokens = usageMetadata.totalTokenCount || promptTokens + completionTokens;
  const model = response.model || 'gemini-3-flash-preview';
  
  // Calculate cost based on Gemini pricing
  const pricing = {
    'gemini-3-flash-preview': { input: 0.5, output: 3.00 },
    'gemini-2.5-flash': { input: 0.3, output: 2.5 },
    'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 }
  };
  const modelPricing = pricing[model as keyof typeof pricing] || pricing['gemini-3-flash-preview'];
  const estimatedCost = (promptTokens / 1_000_000) * modelPricing.input + (completionTokens / 1_000_000) * modelPricing.output;

  metricsCallback({
    endpoint,
    promptType: response.promptType || endpoint,
    promptTokens,
    completionTokens,
    totalTokens,
    responseTimeMs: response.responseTimeMs || 0,
    estimatedCost,
    model,
  });
}

export const geminiApi = {
  /**
   * Generate study content using Gemini AI
   */
  generate: async (params: GenerateParams): Promise<GeminiResponse> => {
    const response = await api.post<GeminiResponse>('/api/gemini-generate', {
      text: params.text,
      promptType: params.promptType,
      geminiApiKey: params.apiKey,
      topics: params.topics,
      questionCount: params.questionCount,
      knowledgeType: params.knowledgeType,
      questionTypes: params.questionTypes,
      performanceSummary: params.performanceSummary,
    });
    trackMetrics(response, 'gemini-generate');
    return response;
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
    const response = await api.post<GeminiResponse>('/api/generate-topic-content', {
      topic,
      documentText,
      geminiApiKey: apiKey,
    });
    trackMetrics(response, 'generate-topic-content');
    return response;
  },

  /**
   * Generate exam cram content
   */
  generateExamCram: async (
    text: string,
    apiKey: string
  ): Promise<GeminiResponse> => {
    const response = await api.post<GeminiResponse>('/api/exam-cram', {
      text,
      geminiApiKey: apiKey,
    });
    trackMetrics(response, 'exam-cram');
    return response;
  },

  /**
   * Generate focus mode content
   */
  generateFocusMode: async (
    text: string,
    apiKey: string
  ): Promise<GeminiResponse> => {
    const response = await api.post<GeminiResponse>('/api/focus-mode-generate', {
      text,
      geminiApiKey: apiKey,
    });
    trackMetrics(response, 'focus-mode-generate');
    return response;
  },

  /**
   * Generate question bank
   */
  generateQuestionBank: async (
    text: string,
    topics: string[],
    apiKey: string
  ): Promise<GeminiResponse> => {
    const response = await api.post<GeminiResponse>('/api/generate-question-bank', {
      text,
      topics,
      geminiApiKey: apiKey,
    });
    trackMetrics(response, 'generate-question-bank');
    return response;
  },
};

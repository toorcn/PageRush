// Core domain types for PageRush AI

// Document types
export interface Document {
  id: number;
  name: string;
  text: string;
  timestamp: string;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: number;
  type: NotificationType;
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: NotificationAction;
  autoDismiss?: boolean;
}

export type NotificationInput = Omit<Notification, 'id'>;

// Study feature types
export type StudyFeature = 'examCram' | 'studyGuide' | 'flashcards' | 'quiz' | 'exam' | '';

export interface HistoryItem {
  id: number;
  timestamp: string;
  feature: StudyFeature;
  documentName: string;
  text: string;
  result: GeminiResponse | null;
  topics?: string[];
  questionCount?: number;
  knowledgeType?: string;
  questionTypes?: string[];
}

// Quiz/Exam types
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  topic?: string;
}

export interface ExamQuestion {
  question: string;
  answer: string;
  type: 'mcq' | 'multiple-choice' | 'shortAnswer' | 'short-answer' | 'discuss' | 'describe' | 'fillBlanks' | 'essay';
  options?: string[];
  maxPoints?: number;
  topic?: string;
  explanation?: string;
  points?: number;
}

export interface QuizAnswer {
  questionIndex: number;
  answer: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  details: QuizResultDetail[];
}

export interface QuizResultDetail {
  questionIndex: number;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export interface ExamResult {
  id: number;
  timestamp: string;
  questions: ExamResultQuestion[];
  overallFeedback: string[];
  individualFeedback: Record<number, string>;
  performanceSummary: PerformanceSummary;
  examMode: string;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface ExamResultQuestion {
  question: string;
  answer: string;
  type: string;
  options?: string[];
  maxPoints?: number;
  userAnswer: string;
  feedback: string;
  isCorrect: boolean;
  earnedPoints: number;
  explanation: string;
}

export interface PerformanceSummary {
  id: number;
  timestamp: string;
  examId: number;
  documentName: string;
  score: number;
  total: number;
  percentage: number;
  details: QuizResultDetail[];
  topics: string[];
  questionTypes: string[];
}

// Flashcard types
export interface Flashcard {
  question: string;
  answer: string;
  topic?: string;
}

// Gemini API types
export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  cachedContentTokenCount?: number;
}

export interface GeminiResponse {
  result?: {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
    usageMetadata?: UsageMetadata;
  };
  usageMetadata?: UsageMetadata;
  responseTimeMs?: number;
  model?: string;
  error?: string;
}

export interface GenerateContentParams {
  text: string;
  promptType: StudyFeature;
  topics?: string[];
  questionCount?: number;
  knowledgeType?: string;
  questionTypes?: string[];
  performanceSummary?: PerformanceSummary;
}

// Loading state types
export interface LoadingState {
  key: string;
  text: string;
}

// Onboarding types
export type OnboardingStep = 'upload' | 'apiKey' | 'selectTool' | 'complete';

export interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  showGuide: boolean;
}

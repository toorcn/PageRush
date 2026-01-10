import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  StudyFeature, 
  HistoryItem, 
  PerformanceSummary, 
  GeminiResponse,
  QuizResult 
} from '@/types';

interface StudyState {
  // API Key
  apiKey: string;
  
  // Current study session
  feature: StudyFeature;
  result: GeminiResponse | null;
  loading: boolean;
  loadingText: string;
  
  // Quiz/Exam state
  currentQuestionIndex: number;
  totalQuestions: number;
  quizScore: QuizResult | null;
  examFeedback: unknown;
  
  // History
  history: HistoryItem[];
  performanceSummaries: PerformanceSummary[];
  
  // UI state
  showQuizGenerator: boolean;
  showExamGenerator: boolean;
  
  // Actions
  setApiKey: (key: string) => void;
  setFeature: (feature: StudyFeature) => void;
  setResult: (result: GeminiResponse | null) => void;
  setLoading: (loading: boolean, text?: string) => void;
  setQuestionProgress: (current: number, total: number) => void;
  setQuizScore: (score: QuizResult | null) => void;
  setExamFeedback: (feedback: unknown) => void;
  setShowQuizGenerator: (show: boolean) => void;
  setShowExamGenerator: (show: boolean) => void;
  
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  addPerformanceSummary: (summary: Omit<PerformanceSummary, 'id' | 'timestamp'>) => void;
  deleteHistoryItem: (id: number) => void;
  clearHistory: () => void;
  
  resetSession: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      // Initial state
      apiKey: '',
      feature: '',
      result: null,
      loading: false,
      loadingText: 'Loading...',
      currentQuestionIndex: 0,
      totalQuestions: 0,
      quizScore: null,
      examFeedback: null,
      history: [],
      performanceSummaries: [],
      showQuizGenerator: false,
      showExamGenerator: false,

      // Actions
      setApiKey: (key: string) => set({ apiKey: key }),
      
      setFeature: (feature: StudyFeature) => {
        set({ 
          feature,
          result: null,
          quizScore: null,
          examFeedback: null,
          showQuizGenerator: feature === 'quiz',
          showExamGenerator: feature === 'exam',
        });
      },
      
      setResult: (result: GeminiResponse | null) => set({ result }),
      
      setLoading: (loading: boolean, text = 'Loading...') => {
        set({ loading, loadingText: text });
      },
      
      setQuestionProgress: (current: number, total: number) => {
        set({ currentQuestionIndex: current, totalQuestions: total });
      },
      
      setQuizScore: (score: QuizResult | null) => set({ quizScore: score }),
      
      setExamFeedback: (feedback: unknown) => set({ examFeedback: feedback }),
      
      setShowQuizGenerator: (show: boolean) => set({ showQuizGenerator: show }),
      
      setShowExamGenerator: (show: boolean) => set({ showExamGenerator: show }),

      addHistoryItem: (item) => {
        const historyItem: HistoryItem = {
          ...item,
          id: Date.now(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          history: [historyItem, ...state.history],
        }));
      },

      addPerformanceSummary: (summary) => {
        const performanceSummary: PerformanceSummary = {
          ...summary,
          id: Date.now(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          performanceSummaries: [performanceSummary, ...state.performanceSummaries],
        }));
      },

      deleteHistoryItem: (id: number) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ 
          history: [], 
          performanceSummaries: [],
        });
      },

      resetSession: () => {
        set({
          feature: '',
          result: null,
          quizScore: null,
          examFeedback: null,
          currentQuestionIndex: 0,
          totalQuestions: 0,
          showQuizGenerator: false,
          showExamGenerator: false,
        });
      },
    }),
    {
      name: 'pagerush-study',
      partialize: (state) => ({
        apiKey: state.apiKey,
        history: state.history,
        performanceSummaries: state.performanceSummaries,
      }),
    }
  )
);

// Selectors
export const useApiKey = () => useStudyStore((state) => state.apiKey);
export const useFeature = () => useStudyStore((state) => state.feature);
export const useStudyResult = () => useStudyStore((state) => state.result);
export const useStudyLoadingState = () => useStudyStore((state) => state.loading);
export const useStudyLoadingText = () => useStudyStore((state) => state.loadingText);

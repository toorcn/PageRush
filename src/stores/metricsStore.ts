import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiMetrics {
  id: string;
  timestamp: string;
  endpoint: string;
  promptType: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTimeMs: number;
  estimatedCost: number;
  model: string;
}

interface MetricsState {
  metrics: ApiMetrics[];
  sessionMetrics: {
    totalCalls: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCost: number;
    totalResponseTime: number;
  };
  lastMetric: ApiMetrics | null;
  addMetric: (metric: Omit<ApiMetrics, 'id' | 'timestamp'>) => void;
  clearMetrics: () => void;
  clearSessionMetrics: () => void;
}

const GEMINI_PRICING = {
  'gemini-3-flash-preview': {
    input: 0.50,
    output: 3.00,
  },
  'gemini-2.5-flash': {
    input: 0.3,
    output: 2.5
  },
  'gemini-1.5-flash': {
    input: 0.075,
    output: 0.30,
  },
  'gemini-1.5-pro': {
    input: 1.25,
    output: 5.00,
  },
  default: {
    input: 0.3,
    output: 2.50,
  },
};

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'default'
): number {
  const pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING] || GEMINI_PRICING.default;
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set) => ({
      metrics: [],
      sessionMetrics: {
        totalCalls: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        totalResponseTime: 0,
      },
      lastMetric: null,

      addMetric: (metric) =>
        set((state) => {
          const newMetric: ApiMetrics = {
            ...metric,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
          };

          return {
            metrics: [...state.metrics.slice(-99), newMetric], // Keep last 100
            lastMetric: newMetric,
            sessionMetrics: {
              totalCalls: state.sessionMetrics.totalCalls + 1,
              totalPromptTokens: state.sessionMetrics.totalPromptTokens + metric.promptTokens,
              totalCompletionTokens: state.sessionMetrics.totalCompletionTokens + metric.completionTokens,
              totalTokens: state.sessionMetrics.totalTokens + metric.totalTokens,
              totalCost: state.sessionMetrics.totalCost + metric.estimatedCost,
              totalResponseTime: state.sessionMetrics.totalResponseTime + metric.responseTimeMs,
            },
          };
        }),

      clearMetrics: () =>
        set({
          metrics: [],
          lastMetric: null,
        }),

      clearSessionMetrics: () =>
        set({
          sessionMetrics: {
            totalCalls: 0,
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalTokens: 0,
            totalCost: 0,
            totalResponseTime: 0,
          },
        }),
    }),
    {
      name: 'pagerush-metrics',
      partialize: (state) => ({
        metrics: state.metrics,
        sessionMetrics: state.sessionMetrics,
      }),
    }
  )
);

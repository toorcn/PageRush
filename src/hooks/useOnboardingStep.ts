'use client';

import { useMemo } from 'react';
import { useDocumentStore, useStudyStore } from '@/stores';

export type OnboardingStepId = 'upload' | 'apiKey' | 'selectTool' | 'complete';

interface OnboardingStep {
  id: OnboardingStepId;
  label: string;
  description: string;
  isComplete: boolean;
}

export function useOnboardingStep() {
  const { documents } = useDocumentStore();
  const { apiKey, feature } = useStudyStore();

  const steps = useMemo<OnboardingStep[]>(() => [
    {
      id: 'upload',
      label: 'Upload Documents',
      description: 'Upload your PDFs to get started',
      isComplete: documents.length > 0,
    },
    {
      id: 'apiKey',
      label: 'Add API Key',
      description: 'Configure your Gemini API key',
      isComplete: !!apiKey,
    },
    {
      id: 'selectTool',
      label: 'Choose Tool',
      description: 'Select a study tool',
      isComplete: !!feature,
    },
    {
      id: 'complete',
      label: 'Start Learning',
      description: 'Begin your study session',
      isComplete: documents.length > 0 && !!apiKey && !!feature,
    },
  ], [documents.length, apiKey, feature]);

  const currentStepIndex = useMemo(() => {
    if (documents.length === 0) return 0;
    if (!apiKey) return 1;
    if (!feature) return 2;
    return 3;
  }, [documents.length, apiKey, feature]);

  const currentStep = steps[currentStepIndex];
  const isComplete = currentStepIndex === 3;

  return {
    steps,
    currentStepIndex,
    currentStep,
    isComplete,
    labels: steps.map((s) => s.label),
  };
}

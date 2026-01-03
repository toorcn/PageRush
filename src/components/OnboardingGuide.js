'use client';
import React, { useState, useEffect, useCallback } from 'react';

const STEPS = [
  {
    id: 'upload',
    title: 'Upload Documents',
    description: 'Drag and drop your PDF study materials or click to browse',
    icon: '📄',
    tips: ['Supported format: PDF files', 'You can upload multiple files', 'Text is extracted automatically'],
    actionLabel: 'Upload PDF',
  },
  {
    id: 'apiKey',
    title: 'Add API Key',
    description: 'Enter your Gemini API key to enable AI features',
    icon: '🔑',
    tips: ['Get a free key from Google AI Studio', 'Your key stays local and private', 'One-time setup'],
    link: { url: 'https://makersuite.google.com/app/apikey', label: 'Get your free API key →' },
    actionLabel: 'Add Key',
  },
  {
    id: 'selectTool',
    title: 'Choose Study Tool',
    description: 'Pick how you want to study your materials',
    icon: '✨',
    tips: ['Exam Cram for smart topic breakdown', 'Study Guide for organized notes', 'Quiz & Exam for testing'],
    actionLabel: 'Choose Tool',
  },
  {
    id: 'complete',
    title: 'Start Learning!',
    description: 'You\'re all set to begin your study session',
    icon: '🎉',
    tips: ['Your progress is saved automatically', 'Switch tools anytime', 'Check history for past sessions'],
    actionLabel: 'Done',
  },
];

export default function OnboardingGuide({
  currentStep,
  onComplete,
  onSkip,
  onFocusStep,
  onOpenUploadModal, // New prop to open upload modal directly
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('onboardingComplete') === 'true';
    if (hasCompleted) setDismissed(true);
  }, []);

  const handleSkip = useCallback(() => {
    localStorage.setItem('onboardingComplete', 'true');
    setDismissed(true);
    onSkip?.();
  }, [onSkip]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboardingComplete', 'true');
    setDismissed(true);
    onComplete?.();
  }, [onComplete]);

  const handleAction = useCallback(() => {
    const stepId = STEPS[Math.min(currentStep, STEPS.length - 1)].id;
    
    if (stepId === 'upload' && onOpenUploadModal) {
      // Open the upload modal directly for better UX
      onOpenUploadModal();
    } else if (stepId === 'complete') {
      handleComplete();
    } else {
      // Focus on the step's target element
      onFocusStep?.(stepId);
    }
  }, [currentStep, onFocusStep, onOpenUploadModal, handleComplete]);

  // Auto-complete when reaching final step
  useEffect(() => {
    if (currentStep >= STEPS.length - 1 && !dismissed) {
      const timer = setTimeout(handleComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, dismissed, handleComplete]);

  if (dismissed) return null;

  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep >= STEPS.length - 1;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 animate-bounce-slow"
        aria-label="Show onboarding guide"
      >
        <span className="text-xl">{step.icon}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-slideUp">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <p className="text-xs text-blue-100">Step {currentStep + 1} of {STEPS.length}</p>
                <h3 className="font-semibold">{step.title}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Minimize"
              >
                <span className="text-sm">−</span>
              </button>
              <button
                onClick={handleSkip}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-3">{step.description}</p>
          
          {/* Tips */}
          <ul className="space-y-1.5 mb-4">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex items-start text-xs text-gray-500">
                <span className="mr-2 text-blue-500">•</span>
                {tip}
              </li>
            ))}
          </ul>

          {/* Link (for API key step) */}
          {step.link && (
            <a
              href={step.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              {step.link.label}
            </a>
          )}

          {/* Action button */}
          <button
            onClick={handleAction}
            className={`w-full py-2.5 rounded-lg font-medium transition-all ${
              isLastStep
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {step.actionLabel} {!isLastStep && '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing onboarding state
export function useOnboardingGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('onboardingComplete') === 'true';
    setShowGuide(!hasCompleted);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboardingComplete', 'true');
    setShowGuide(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboardingComplete');
    setShowGuide(true);
  }, []);

  return { showGuide, setShowGuide, completeOnboarding, resetOnboarding };
}

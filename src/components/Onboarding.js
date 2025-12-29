'use client';
import React, { useState, useEffect } from 'react';

const ONBOARDING_STEPS = {
  WELCOME: 0,
  UPLOAD: 1,
  API_KEY: 2,
  FEATURE_SELECT: 3,
  COMPLETE: 4
};

export default function Onboarding({ 
  currentStep, 
  onComplete, 
  onSkip,
  documentsCount,
  hasApiKey,
  hasSelectedFeature 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has completed onboarding before
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    if (hasCompletedOnboarding === 'true') {
      setIsVisible(false);
      setDismissed(true);
    }
  }, []);

  const handleSkip = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setDismissed(true);
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  const handleComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  // Don't show if dismissed or if onboarding is complete
  if (dismissed || !isVisible) return null;

  // Determine which step we're on based on currentStep prop
  const step = currentStep || 0;

  const getStepProgress = () => {
    if (step >= ONBOARDING_STEPS.COMPLETE) return 100;
    return ((step + 1) / ONBOARDING_STEPS.COMPLETE) * 100;
  };

  const getStepInfo = () => {
    switch (step) {
      case ONBOARDING_STEPS.WELCOME:
        return {
          title: 'Welcome to PageRush AI! 🎉',
          description: 'Let\'s get you started in just a few simple steps',
          icon: '👋',
          tips: [
            'Upload your PDF study materials',
            'Add your Gemini API key',
            'Choose your study tool',
            'Start learning!'
          ]
        };
      case ONBOARDING_STEPS.UPLOAD:
        return {
          title: 'Step 1: Upload Your Documents',
          description: 'Drag and drop your PDF files or click to browse',
          icon: '📄',
          tips: [
            'Supported format: PDF files',
            'You can upload multiple files',
            'Maximum file size: 50MB per file',
            'Text will be extracted automatically'
          ]
        };
      case ONBOARDING_STEPS.API_KEY:
        return {
          title: 'Step 2: Add Your API Key',
          description: 'You\'ll need a Gemini API key to use AI features',
          icon: '🔑',
          tips: [
            'Get your free API key from Google AI Studio',
            'Your key is stored locally and never shared',
            'Click the link below for step-by-step instructions',
            'This is a one-time setup'
          ]
        };
      case ONBOARDING_STEPS.FEATURE_SELECT:
        return {
          title: 'Step 3: Choose Your Study Tool',
          description: 'Select how you want to study your materials',
          icon: '✨',
          tips: [
            'Exam Cram: Smart topic breakdown & adaptive learning',
            'Study Guide: Organized notes and summaries',
            'Flashcards: Interactive study cards',
            'Quiz: Test your knowledge with MCQs',
            'Exam: Full practice exam with mixed questions'
          ]
        };
      default:
        return null;
    }
  };

  const stepInfo = getStepInfo();
  if (!stepInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{stepInfo.icon}</div>
              <div>
                <h2 className="text-xl font-bold">{stepInfo.title}</h2>
                <p className="text-blue-100 text-sm mt-1">{stepInfo.description}</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/20"
              aria-label="Skip onboarding"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-blue-100 mb-2">
              <span>Step {step + 1} of {ONBOARDING_STEPS.COMPLETE}</span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tips Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Quick Tips
            </h3>
            <ul className="space-y-2">
              {stepInfo.tips.map((tip, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <span className="mr-2 text-blue-600 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step-specific content */}
          {step === ONBOARDING_STEPS.API_KEY && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <span className="text-xl mr-3">🔗</span>
                <div>
                  <p className="font-medium text-gray-800 mb-2">Need help getting your API key?</p>
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    Get your free Gemini API key here →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Skip Tutorial
            </button>
            <div className="flex space-x-3">
              {step < ONBOARDING_STEPS.FEATURE_SELECT && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  I'll do this later
                </button>
              )}
              {step === ONBOARDING_STEPS.FEATURE_SELECT && (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg"
                >
                  Got it! Let's start
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper hook to manage onboarding state
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('hasCompletedOnboarding');
    setHasCompletedOnboarding(completed === 'true');
    // Show onboarding if not completed
    setShowOnboarding(completed !== 'true');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('hasCompletedOnboarding');
    setHasCompletedOnboarding(false);
    setShowOnboarding(true);
  };

  return {
    hasCompletedOnboarding,
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    setShowOnboarding
  };
}


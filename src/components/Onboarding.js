'use client';
import { useState, useEffect } from 'react';
import { FileText, Key, Sparkles, PartyPopper, ChevronLeft, ChevronRight, Minimize2, Lightbulb, Check } from 'lucide-react';
import { ApiKeyInline } from './ApiKeyModal';
import PdfUploader from './PdfUploader';

const ONBOARDING_STEPS = {
  WELCOME: 0,
  UPLOAD: 1,
  API_KEY: 2,
  FEATURE_SELECT: 3,
  COMPLETE: 4
};

const STEP_CONFIG = [
  {
    id: 'welcome',
    title: 'Welcome to PageRush AI!',
    description: "Let's get you started in just a few simple steps",
    icon: <PartyPopper className="w-8 h-8" />,
    tips: [
      'Upload your PDF study materials',
      'Add your Gemini API key',
      'Choose your study tool',
      'Start learning!'
    ],
  },
  {
    id: 'upload',
    title: 'Upload Your Documents',
    description: 'Drag and drop your PDF files or click to browse',
    icon: <FileText className="w-8 h-8" />,
    tips: [
      'Supported format: PDF files',
      'You can upload multiple files',
      'Maximum file size: 50MB per file',
      'Text will be extracted automatically'
    ],
  },
  {
    id: 'apiKey',
    title: 'Add Your API Key',
    description: "You'll need a Gemini API key to use AI features",
    icon: <Key className="w-8 h-8" />,
    tips: [
      'Get your free API key from Google AI Studio',
      'Your key is stored locally and never shared',
      'This is a one-time setup'
    ],
    hasInlineInput: true,
  },
  {
    id: 'selectTool',
    title: 'Choose Your Study Tool',
    description: 'Select how you want to study your materials',
    icon: <Sparkles className="w-8 h-8" />,
    tips: [
      'Exam Cram: Smart topic breakdown & adaptive learning',
      'Study Guide: Organized notes and summaries',
      'Flashcards: Interactive study cards',
      'Quiz & Exam: Test your knowledge'
    ],
  },
];

export default function Onboarding({
  isOpen,
  onClose,
  onMinimize,
  onComplete,
  documentsCount = 0,
  hasApiKey = false,
  hasSelectedFeature = false,
  onOpenApiKeyModal,
  onSaveApiKey,
  currentApiKey = '',
  onFocusFeatureSelector,
  onExtractedText,
}) {
  const [internalStep, setInternalStep] = useState(0);

  // Calculate actual progress step based on completion
  const getActualStep = () => {
    if (hasSelectedFeature) return ONBOARDING_STEPS.COMPLETE;
    if (hasApiKey) return ONBOARDING_STEPS.FEATURE_SELECT;
    if (documentsCount > 0) return ONBOARDING_STEPS.API_KEY;
    return ONBOARDING_STEPS.UPLOAD;
  };

  // Sync internal step with progress
  useEffect(() => {
    const actualStep = getActualStep();
    if (actualStep > internalStep && internalStep < ONBOARDING_STEPS.FEATURE_SELECT) {
      setInternalStep(actualStep);
    }
  }, [documentsCount, hasApiKey, hasSelectedFeature]);

  // Only allow completion through finishing all steps
  const handleComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    onComplete?.();
    onClose?.();
  };

  const canProceed = () => {
    switch (internalStep) {
      case ONBOARDING_STEPS.WELCOME:
        return true;
      case ONBOARDING_STEPS.UPLOAD:
        return documentsCount > 0;
      case ONBOARDING_STEPS.API_KEY:
        return hasApiKey;
      case ONBOARDING_STEPS.FEATURE_SELECT:
        return hasSelectedFeature;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (internalStep === ONBOARDING_STEPS.FEATURE_SELECT) {
      handleComplete();
    } else if (canProceed()) {
      setInternalStep(prev => Math.min(prev + 1, ONBOARDING_STEPS.FEATURE_SELECT));
    }
  };

  const handleBack = () => {
    setInternalStep(prev => Math.max(prev - 1, ONBOARDING_STEPS.WELCOME));
  };

  const handleStepAction = () => {
    switch (internalStep) {
      case ONBOARDING_STEPS.API_KEY:
        onOpenApiKeyModal?.();
        break;
      case ONBOARDING_STEPS.FEATURE_SELECT:
        onFocusFeatureSelector?.();
        onMinimize?.();
        break;
    }
  };

  if (!isOpen) return null;

  const step = internalStep;
  const stepConfig = STEP_CONFIG[step] || STEP_CONFIG[0];
  const progress = ((step + 1) / (ONBOARDING_STEPS.COMPLETE)) * 100;
  const isCompleted = canProceed();
  const isApiKeyStep = step === ONBOARDING_STEPS.API_KEY;
  const isFeatureStep = step === ONBOARDING_STEPS.FEATURE_SELECT;
  const isUploadStep = step === ONBOARDING_STEPS.UPLOAD;
  const isWelcomeStep = step === ONBOARDING_STEPS.WELCOME;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {stepConfig.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{stepConfig.title}</h2>
                <p className="text-blue-100 text-sm mt-1">{stepConfig.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/20"
                  aria-label="Minimize to floating card"
                  title="Switch to floating card"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-blue-100 mb-2">
              <span>Step {step + 1} of {ONBOARDING_STEPS.COMPLETE}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tips Section - Show on welcome, API key (when configured), and feature steps */}
          {(isWelcomeStep || (isApiKeyStep && hasApiKey) || isFeatureStep || (isUploadStep && isCompleted)) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Quick Tips
              </h3>
              <ul className="space-y-2">
                {stepConfig.tips.map((tip, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <span className="mr-2 text-blue-600 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inline API Key Input */}
          {isApiKeyStep && !hasApiKey && onSaveApiKey && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 mb-6 border border-amber-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                Enter Your API Key
              </h3>
              <ApiKeyInline onSave={onSaveApiKey} currentKey={currentApiKey} />
            </div>
          )}

          {/* Upload Step - Embedded Uploader */}
          {step === ONBOARDING_STEPS.UPLOAD && !isCompleted && (
            <div className="mb-6">
              <PdfUploader onExtracted={onExtractedText} />
            </div>
          )}

          {/* Feature Step Action */}
          {isFeatureStep && !isCompleted && (
            <button
              onClick={handleStepAction}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-600 transition-all mb-6 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Show Study Tools
            </button>
          )}

          {/* Completion Status */}
          {isCompleted && step > ONBOARDING_STEPS.WELCOME && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-slideUp">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-green-800 font-medium">
                  {step === ONBOARDING_STEPS.UPLOAD && `${documentsCount} document${documentsCount > 1 ? 's' : ''} uploaded!`}
                  {step === ONBOARDING_STEPS.API_KEY && 'API key configured!'}
                  {step === ONBOARDING_STEPS.FEATURE_SELECT && 'Study tool selected!'}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              {step > ONBOARDING_STEPS.WELCOME && (
                <button
                  onClick={handleBack}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed() && step > ONBOARDING_STEPS.WELCOME}
                className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  canProceed() || step === ONBOARDING_STEPS.WELCOME
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {step === ONBOARDING_STEPS.WELCOME
                  ? 'Get Started'
                  : step === ONBOARDING_STEPS.FEATURE_SELECT
                  ? 'Complete Setup'
                  : 'Next'}
                {step < ONBOARDING_STEPS.FEATURE_SELECT && <ChevronRight className="w-4 h-4" />}
              </button>
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
    const completed = localStorage.getItem('onboardingComplete');
    setHasCompletedOnboarding(completed === 'true');
    setShowOnboarding(completed !== 'true');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
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

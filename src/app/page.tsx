'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useDocumentStore, useStudyStore, useUIStore, useNotify, useMetricsStore } from '@/stores';
import { useOnboardingStep } from '@/hooks';
import { parseFlashcards, parseQuiz, parseExam } from '@/lib/parsing';
import { geminiApi, setMetricsCallback } from '@/lib/api';
import { Sparkles, FileText, Upload, Target, Lightbulb } from 'lucide-react';

// Layout components
import { Header, Footer } from '@/components/layout';
import { NotificationToast } from '@/components/notifications';
import { FullPageLoader } from '@/components/loading';
import { ProgressIndicator } from '@/components/progress';
import { Card, Button } from '@/components/ui';

// Feature components
import PdfUploaderModal from '@/components/PdfUploaderModal';
import ApiKeyModal from '@/components/ApiKeyModal';
import FeatureSelector from '@/components/FeatureSelector';
import DocumentManager from '@/components/DocumentManager';
import HistoryPanel from '@/components/HistoryPanel';
import StudyGuide from '@/components/StudyGuide';
import Flashcards from '@/components/Flashcards';
import Quiz from '@/components/Quiz';
import Exam from '@/components/Exam';
import QuizGenerator from '@/components/QuizGenerator';
import ExamGenerator from '@/components/ExamGenerator';
import ExamCramComponent from '@/components/ExamCram';
import Insights from '@/components/Insights';
import FocusMode from '@/components/FocusMode';
import OnboardingGuide from '@/components/OnboardingGuide';
import Onboarding from '@/components/Onboarding';
import StepHighlight from '@/components/StepHighlight';

import type { StudyFeature, HistoryItem, PerformanceSummary } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExamCram = ExamCramComponent as any;

// Feature label/icon helpers
const FEATURE_LABELS: Record<StudyFeature, string> = {
  examCram: 'Exam Cram',
  studyGuide: 'Study Guide',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  exam: 'Exam',
  '': 'Study Tools',
};

function getFeatureLabel(ft: StudyFeature): string {
  return FEATURE_LABELS[ft];
}

// Calculate current step for UI
function calculateStep(hasDocuments: boolean, hasApiKey: boolean, hasResult: boolean): number {
  if (!hasDocuments) return 0;
  if (!hasApiKey) return 1;
  if (!hasResult) return 2;
  return 3;
}

export default function Home() {
  // Document store
  const documents = useDocumentStore((s) => s.documents);
  const activeDocuments = useDocumentStore((s) => s.activeDocuments);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const removeDocument = useDocumentStore((s) => s.removeDocument);
  const setActiveDocuments = useDocumentStore((s) => s.setActiveDocuments);
  const getActiveText = useDocumentStore((s) => s.getActiveText);

  // Study store
  const apiKey = useStudyStore((s) => s.apiKey);
  const setApiKey = useStudyStore((s) => s.setApiKey);
  const feature = useStudyStore((s) => s.feature);
  const setFeature = useStudyStore((s) => s.setFeature);
  const result = useStudyStore((s) => s.result);
  const setResult = useStudyStore((s) => s.setResult);
  const loading = useStudyStore((s) => s.loading);
  const setLoading = useStudyStore((s) => s.setLoading);
  const history = useStudyStore((s) => s.history);
  const performanceSummaries = useStudyStore((s) => s.performanceSummaries);
  const addHistoryItem = useStudyStore((s) => s.addHistoryItem);
  const addPerformanceSummary = useStudyStore((s) => s.addPerformanceSummary);
  const clearHistory = useStudyStore((s) => s.clearHistory);
  const currentQuestionIndex = useStudyStore((s) => s.currentQuestionIndex);
  const totalQuestions = useStudyStore((s) => s.totalQuestions);
  const setQuestionProgress = useStudyStore((s) => s.setQuestionProgress);
  const quizScore = useStudyStore((s) => s.quizScore);
  const setQuizScore = useStudyStore((s) => s.setQuizScore);
  const examFeedback = useStudyStore((s) => s.examFeedback);
  const setExamFeedback = useStudyStore((s) => s.setExamFeedback);
  const showQuizGenerator = useStudyStore((s) => s.showQuizGenerator);
  const setShowQuizGenerator = useStudyStore((s) => s.setShowQuizGenerator);
  const showExamGenerator = useStudyStore((s) => s.showExamGenerator);
  const setShowExamGenerator = useStudyStore((s) => s.setShowExamGenerator);

  // UI store
  const showUploadModal = useUIStore((s) => s.showUploadModal);
  const setShowUploadModal = useUIStore((s) => s.setShowUploadModal);
  const showApiKeyModal = useUIStore((s) => s.showApiKeyModal);
  const setShowApiKeyModal = useUIStore((s) => s.setShowApiKeyModal);
  const showDocumentManager = useUIStore((s) => s.showDocumentManager);
  const setShowDocumentManager = useUIStore((s) => s.setShowDocumentManager);
  const showHistory = useUIStore((s) => s.showHistory);
  const setShowHistory = useUIStore((s) => s.setShowHistory);
  const showApiKeyInput = useUIStore((s) => s.showApiKeyInput);
  const setShowApiKeyInput = useUIStore((s) => s.setShowApiKeyInput);
  const showFeatureSelector = useUIStore((s) => s.showFeatureSelector);
  const focusMode = useUIStore((s) => s.focusMode);
  const setFocusMode = useUIStore((s) => s.setFocusMode);
  const showOnboardingGuide = useUIStore((s) => s.showOnboardingGuide);
  const showOnboardingFullScreen = useUIStore((s) => s.showOnboardingFullScreen);
  const setShowOnboardingFullScreen = useUIStore((s) => s.setShowOnboardingFullScreen);
  const completeOnboarding = useUIStore((s) => s.completeOnboarding);
  const highlightFeatures = useUIStore((s) => s.highlightFeatures);
  const highlightStep = useUIStore((s) => s.highlightStep);

  const notify = useNotify();
  const { currentStepIndex, labels } = useOnboardingStep();
  
  // Metrics store
  const addMetric = useMetricsStore((s) => s.addMetric);

  // Setup metrics callback for API calls
  useEffect(() => {
    setMetricsCallback((metrics) => {
      addMetric(metrics);
    });
    return () => setMetricsCallback(null);
  }, [addMetric]);

  // Migrate old localStorage data to new stores on first load
  useEffect(() => {
    const migrated = localStorage.getItem('pagerush-migrated');
    if (migrated) return;

    // Migrate API key
    const oldApiKey = localStorage.getItem('geminiApiKey');
    if (oldApiKey && !apiKey) {
      setApiKey(oldApiKey);
    }

    // Migrate documents
    const oldDocs = localStorage.getItem('savedDocuments');
    if (oldDocs && documents.length === 0) {
      try {
        const parsed = JSON.parse(oldDocs);
        if (Array.isArray(parsed)) {
          parsed.forEach((doc: { text: string; name?: string }) => {
            addDocument(doc.text, doc.name);
          });
        }
      } catch (e) {
        console.error('Failed to migrate documents:', e);
      }
    }

    // Migrate history
    const oldHistory = localStorage.getItem('studyHistory');
    if (oldHistory && history.length === 0) {
      try {
        const parsed = JSON.parse(oldHistory);
        if (Array.isArray(parsed)) {
          useStudyStore.setState({ history: parsed });
        }
      } catch (e) {
        console.error('Failed to migrate history:', e);
      }
    }

    // Migrate performance summaries
    const oldPerf = localStorage.getItem('performanceSummaries');
    if (oldPerf && performanceSummaries.length === 0) {
      try {
        const parsed = JSON.parse(oldPerf);
        if (Array.isArray(parsed)) {
          useStudyStore.setState({ performanceSummaries: parsed });
        }
      } catch (e) {
        console.error('Failed to migrate performance summaries:', e);
      }
    }

    localStorage.setItem('pagerush-migrated', 'true');
  }, []);

  // Derived state
  const step = calculateStep(activeDocuments?.length > 0, !!apiKey, !!result);

  // Parsed content (memoized)
  const parsedFlashcards = useMemo(() => {
    return feature === 'flashcards' && result ? parseFlashcards(result) : [];
  }, [feature, result]);

  const parsedQuizQuestions = useMemo(() => {
    return feature === 'quiz' && result ? parseQuiz(result) : [];
  }, [feature, result]);

  const parsedExamQuestions = useMemo(() => {
    return feature === 'exam' && result ? parseExam(result) : [];
  }, [feature, result]);

  // Stable callbacks for Quiz/Exam components to prevent infinite loops
  const handleSetCurrentQuestionIndex = useCallback((idx: number) => {
    setQuestionProgress(idx, totalQuestions);
  }, [setQuestionProgress, totalQuestions]);

  const handleSetTotalQuestions = useCallback((total: number) => {
    if (total !== totalQuestions) {
      setQuestionProgress(currentQuestionIndex, total);
    }
  }, [setQuestionProgress, currentQuestionIndex, totalQuestions]);

  // Auto-expand sections when they become relevant
  useEffect(() => {
    if (step >= 1 && !apiKey) {
      setShowApiKeyInput(true);
    }
  }, [step, apiKey, setShowApiKeyInput]);

  // Auto-collapse API key section when configured
  useEffect(() => {
    if (apiKey && showApiKeyInput) {
      const timer = setTimeout(() => setShowApiKeyInput(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [apiKey, showApiKeyInput, setShowApiKeyInput]);

  // Content generation handler
  const generateContent = async (
    ft: StudyFeature,
    options?: {
      topics?: string[];
      questionCount?: number;
      knowledgeType?: string;
      questionTypes?: string[];
      performanceSummary?: PerformanceSummary;
    }
  ) => {
    const text = getActiveText();
    if (!text || !apiKey) return;

    setLoading(true, `Generating ${getFeatureLabel(ft)}...`);

    try {
      const data = await geminiApi.generate({
        text,
        promptType: ft,
        apiKey,
        ...options,
      });

      setResult(data);
      setLoading(false);

      addHistoryItem({
        feature: ft,
        documentName: activeDocuments.map((d) => d.name).join(', '),
        text: text.substring(0, 100) + '...',
        result: data,
        topics: options?.topics,
        questionCount: options?.questionCount,
        knowledgeType: options?.knowledgeType,
        questionTypes: options?.questionTypes,
      });

      notify.success('Content Generated', `Your ${getFeatureLabel(ft)} has been created!`);
    } catch (error) {
      console.error('Generation error:', error);
      setLoading(false);
      notify.error('Generation Failed', 'There was an error generating your content.');
    }
  };

  // Document extraction handler
  const handleExtracted = (text: string, fileName?: string) => {
    const newDoc = addDocument(text, fileName);
    setResult(null);
    setQuizScore(null);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
    setExamFeedback(null);
    notify.success('Document Uploaded', `${newDoc.name} has been successfully uploaded.`);
  };

  // Feature selection handler
  const handleFeature = async (ft: string) => {
    const feature = ft as StudyFeature;
    setFeature(feature);
    setResult(null);
    setQuizScore(null);
    setExamFeedback(null);

    if (feature === 'quiz') {
      setShowQuizGenerator(true);
      return;
    }
    if (feature === 'exam') {
      setShowExamGenerator(true);
      return;
    }
    if (feature === 'examCram') {
      return; // ExamCram handles its own generation
    }
    if (activeDocuments?.length > 0 && apiKey) {
      await generateContent(feature);
    }
  };

  // Quiz generation handler
  const handleQuizGenerate = async (topics: string[], questionCount: number, knowledgeType: string) => {
    setShowQuizGenerator(false);
    await generateContent('quiz', { topics, questionCount, knowledgeType });
  };

  // Exam generation handler
  const handleExamGenerate = async (
    topics: string[],
    questionTypes: string[],
    knowledgeType: string,
    performanceSummary?: PerformanceSummary
  ) => {
    setShowExamGenerator(false);
    await generateContent('exam', { topics, questionTypes, knowledgeType, performanceSummary });
  };

  // Quiz submission handler
  const handleQuizSubmit = async (answers: Record<number, string> | string[]) => {
    if (!result) return;
    setLoading(true, 'Grading your quiz...');

    try {
      const quizQuestions = parseQuiz(result);
      const data = await geminiApi.gradeQuiz({
        userAnswers: answers,
        quiz: quizQuestions,
        apiKey,
      });
      setQuizScore(data);
      setLoading(false);
      notify.success('Quiz Completed', `You scored ${data.score}/${data.total} (${Math.round((data.score / data.total) * 100)}%)`);
    } catch (error) {
      console.error('Quiz grading error:', error);
      setLoading(false);
      notify.error('Grading Failed', 'There was an error grading your quiz.');
    }
  };

  // Exam submission handler
  const handleExamSubmit = async (answers: Record<number, string> | string[]) => {
    if (!result) return;
    setLoading(true, 'Grading your exam...');

    try {
      const examQuestions = parseExam(result);
      const data = await geminiApi.gradeQuiz({
        userAnswers: answers,
        quiz: examQuestions.map((q) => ({
          question: q.question,
          options: q.options || [],
          answer: q.answer,
        })),
        apiKey,
      });
      setQuizScore(data);
      setExamFeedback(data.details || null);
      setLoading(false);

      if (data.details) {
        addPerformanceSummary({
          examId: Date.now(),
          documentName: activeDocuments.map((d) => d.name).join(', '),
          score: data.score,
          total: data.total,
          percentage: data.percentage,
          details: data.details,
          topics: [],
          questionTypes: [],
        });
      }
      notify.success('Exam Completed', `You scored ${data.score}/${data.total} (${Math.round((data.score / data.total) * 100)}%)`);
    } catch (error) {
      console.error('Exam grading error:', error);
      setLoading(false);
      notify.error('Grading Failed', 'There was an error grading your exam.');
    }
  };

  // History loading handler
  const loadFromHistory = (historyItem: HistoryItem) => {
    const existingDoc = documents.find((doc) => doc.name === historyItem.documentName);
    if (existingDoc) {
      setActiveDocuments([existingDoc]);
    } else {
      addDocument(historyItem.text, historyItem.documentName);
    }
    
    // Important: Set feature first (which resets result), then set result
    // We need to bypass the setFeature reset behavior
    useStudyStore.setState({
      feature: historyItem.feature,
      result: historyItem.result,
      showQuizGenerator: false,
      showExamGenerator: false,
      quizScore: null,
      examFeedback: null,
    });
    
    setShowHistory(false);
    notify.success(`${getFeatureLabel(historyItem.feature)} Loaded`, `Loaded ${historyItem.documentName} from history.`);
  };

  // Clear history handler
  const handleClearHistory = () => {
    clearHistory();
    notify.info('History Cleared', 'All study history has been cleared.');
  };

  // Onboarding focus handler
  const handleFocusStep = (stepId: string) => {
    if (stepId === 'upload') {
      const uploadEl = document.querySelector('[data-upload-area]');
      if (uploadEl) {
        highlightStep('upload');
        uploadEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setShowUploadModal(true);
      }
    } else if (stepId === 'apiKey') {
      highlightStep('apiKey');
      setShowApiKeyInput(true);
      setTimeout(() => {
        document.querySelector('[data-api-key-section]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (stepId === 'selectTool') {
      highlightStep('features');
      document.querySelector('[data-feature-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Focus mode render
  if (focusMode) {
    return (
      <>
        <NotificationToast />
        <FocusMode
          activeDocument={activeDocuments}
          apiKey={apiKey}
          onExit={() => setFocusMode(false)}
          currentProgress={undefined}
        />
      </>
    );
  }

  return (
    <>
      <NotificationToast />
      {loading && <FullPageLoader />}

      <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Onboarding Guide (Floating Card) - Hide from Select Tool step onwards */}
        {showOnboardingGuide && !showOnboardingFullScreen && currentStepIndex < 2 && (
          <OnboardingGuide
            currentStep={currentStepIndex}
            onComplete={() => {
              completeOnboarding();
              notify.success('Welcome!', "You're all set! Enjoy your study session.");
            }}
            onFocusStep={handleFocusStep}
            onOpenUploadModal={() => setShowUploadModal(true)}
            onOpenApiKeyModal={() => setShowApiKeyModal(true)}
            onOpenFullScreen={() => setShowOnboardingFullScreen(true)}
            onSaveApiKey={(key: string) => {
              setApiKey(key);
              notify.success('API Key Saved', 'Your Gemini API key has been configured.');
            }}
            currentApiKey={apiKey}
            hasApiKey={!!apiKey}
          />
        )}

        {/* Onboarding Full Screen Modal */}
        {showOnboardingFullScreen && (
          <Onboarding
            isOpen={showOnboardingFullScreen}
            onClose={() => setShowOnboardingFullScreen(false)}
            onMinimize={() => setShowOnboardingFullScreen(false)}
            onComplete={() => {
              completeOnboarding();
              notify.success('Welcome!', "You're all set! Enjoy your study session.");
            }}
            documentsCount={documents.length}
            hasApiKey={!!apiKey}
            hasSelectedFeature={!!feature}
            onOpenApiKeyModal={() => setShowApiKeyModal(true)}
            onSaveApiKey={(key: string) => {
              setApiKey(key);
              notify.success('API Key Saved', 'Your Gemini API key has been configured.');
            }}
            currentApiKey={apiKey}
            onFocusFeatureSelector={() => {
              highlightStep('features');
              document.querySelector('[data-feature-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onExtractedText={handleExtracted}
          />
        )}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          onSave={(key: string) => {
            setApiKey(key);
            notify.success('API Key Saved', 'Your Gemini API key has been configured.');
          }}
          currentKey={apiKey}
        />

        {/* Upload Modal */}
        <PdfUploaderModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onExtracted={handleExtracted}
        />

        <div className="max-w-6xl mx-auto py-4 lg:py-8 px-4 lg:px-6 space-y-4 lg:space-y-6 relative">
          <Header />

          {/* Mobile Document Info */}
          {activeDocuments?.length > 0 && (
            <div className="lg:hidden space-y-2">
              <div className="text-xs font-medium text-gray-600 px-1">
                Active Documents ({activeDocuments?.length})
              </div>
              {activeDocuments.map((doc, index) => (
                <Card key={doc.id} variant="glass" padding="sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 truncate">{doc.name}</span>
                    {index === 0 && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex-shrink-0">
                        Primary
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Document Manager */}
          {showDocumentManager && (
            <DocumentManager
              documents={documents}
              activeDocument={activeDocuments}
              onSelectDocument={setActiveDocuments}
              onRemoveDocument={removeDocument}
              onClose={() => setShowDocumentManager(false)}
              onAddMoreDocuments={() => {
                setShowDocumentManager(false);
                setShowUploadModal(true);
              }}
            />
          )}

          {/* History Panel */}
          {showHistory && (
            <HistoryPanel
              history={history}
              performanceSummaries={performanceSummaries}
              onLoadFromHistory={loadFromHistory}
              onClearHistory={handleClearHistory}
              onClose={() => setShowHistory(false)}
            />
          )}

          {/* Welcome Section */}
          {step === 0 && (
            <div className="text-center py-12 lg:py-16">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-center mb-8 animate-fadeIn">
                  <img src="/pagerushai-logo.png" alt="PageRush AI" className="h-24 w-auto" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4 animate-slideUp">
                  Welcome to PageRush AI
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto animate-slideUp">
                  Transform your study materials into interactive learning tools with AI-powered flashcards, quizzes, study guides, and more.
                </p>

                <Card variant="glass" className="mb-8 animate-slideUp">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Getting Started</h3>
                  <ProgressIndicator currentStep={currentStepIndex} totalSteps={4} labels={labels} />
                </Card>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slideUp">
                  <Card variant="glass" hover className="text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Upload Documents</h3>
                    <p className="text-sm text-gray-500">Upload your PDFs and let AI extract the content</p>
                  </Card>
                  <Card variant="glass" hover className="text-center">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Choose Tools</h3>
                    <p className="text-sm text-gray-500">Select from flashcards, quizzes, study guides, and more</p>
                  </Card>
                  <Card variant="glass" hover className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Study Smart</h3>
                    <p className="text-sm text-gray-500">Learn efficiently with AI-powered adaptive learning</p>
                  </Card>
                </div>

                {/* Quick Start CTA */}
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 animate-slideUp">
                  <p className="text-gray-700 font-medium mb-2">Ready to get started?</p>
                  <p className="text-sm text-gray-500 mb-4">Upload your first document below to begin</p>
                  <Button onClick={() => setShowUploadModal(true)} icon={<Upload className="w-4 h-4" />}>
                    Upload PDF
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="space-y-4 lg:space-y-6">
              {/* Feature Selection */}
              {step >= 2 && ((!showQuizGenerator && !showExamGenerator && !result) || showFeatureSelector) && (
                <StepHighlight isActive={highlightFeatures}>
                  <Card
                    variant="glass"
                    className={step === 2 && !feature ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                    data-feature-selector
                  >
                    <div className="text-center mb-4 lg:mb-6">
                      <div className="flex justify-center mb-4">
                        <img src="/pagerushai-logo.png" alt="PageRush AI" className="h-12 w-auto" />
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Choose Your Study Tool</h2>
                      </div>
                      <p className="text-gray-500 text-sm lg:text-base">
                        {step === 2 && !feature
                          ? 'Select a study tool to get started with your documents'
                          : 'Select how you\'d like to study your materials'}
                      </p>
                    </div>

                    {step === 2 && !feature && showOnboardingGuide && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 animate-slideUp">
                        <p className="text-sm text-indigo-800 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Tip:</strong> Start with <strong>Exam Cram</strong> for smart topic breakdown, or choose{' '}
                            <strong>Study Guide</strong> for organized notes.
                          </span>
                        </p>
                      </div>
                    )}

                    <FeatureSelector selected={feature} onSelect={handleFeature} />
                  </Card>
                </StepHighlight>
              )}

              {/* Quiz Generator */}
              {showQuizGenerator && (
                <QuizGenerator onGenerate={handleQuizGenerate} extractedText={getActiveText()} apiKey={apiKey} />
              )}

              {/* Exam Generator */}
              {showExamGenerator && (
                <ExamGenerator
                  onGenerate={handleExamGenerate}
                  extractedText={getActiveText()}
                  apiKey={apiKey}
                  performanceSummaries={performanceSummaries}
                />
              )}

              {/* Study Content */}
              {feature === 'examCram' && activeDocuments?.length > 0 && (
                <ExamCram
                  content={getActiveText()}
                  documentName={activeDocuments.map((d) => d.name).join(', ')}
                  apiKey={apiKey}
                  onGenerateContent={generateContent as (ft: string) => void}
                />
              )}

              {!loading && result && feature === 'studyGuide' && (
                <StudyGuide
                  content={result.result?.candidates?.[0]?.content?.parts?.[0]?.text || ''}
                  onRegenerate={() => generateContent('studyGuide')}
                />
              )}

              {!loading && result && feature === 'flashcards' && (
                <Flashcards cards={parsedFlashcards} onRegenerate={() => generateContent('flashcards')} />
              )}

              {result && feature === 'quiz' && (
                <>
                  <Quiz
                    questions={parsedQuizQuestions}
                    onSubmit={handleQuizSubmit}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={handleSetCurrentQuestionIndex}
                    setTotalQuestions={handleSetTotalQuestions}
                    gradingFeedback={quizScore}
                  />
                  {quizScore && <Insights score={quizScore.score} total={quizScore.total} details={quizScore.details || []} />}
                </>
              )}

              {!loading && result && feature === 'exam' && (
                <>
                  <Exam
                    questions={parsedExamQuestions}
                    onSubmit={handleExamSubmit}
                    feedback={examFeedback}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={handleSetCurrentQuestionIndex}
                    setTotalQuestions={handleSetTotalQuestions}
                    onSaveResults={(examResults: unknown) => {
                      addPerformanceSummary(examResults as Omit<PerformanceSummary, 'id' | 'timestamp'>);
                      notify.success('Exam Results Saved', 'Your exam results have been saved to your history.');
                    }}
                  />
                  {quizScore && <Insights score={quizScore.score} total={quizScore.total} details={quizScore.details || []} />}
                </>
              )}
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect, useMemo, ReactElement } from 'react';
import PdfUploader from '../components/PdfUploader';
import ApiKeyInput from '../components/ApiKeyInput';
import FeatureSelector from '../components/FeatureSelector';
import StudyGuide from '../components/StudyGuide';
import Flashcards from '../components/Flashcards';
import Quiz from '../components/Quiz';
import QuizGenerator from '../components/QuizGenerator';
import ExamGenerator from '../components/ExamGenerator';
import Exam from '../components/Exam';
import ExamCramComponent from '../components/ExamCram.js';
const ExamCram = ExamCramComponent as React.ComponentType<any>;
import Insights from '../components/Insights';
import HistoryPanel from '../components/HistoryPanel';
import DocumentManager from '../components/DocumentManager';
import HelpfulResourcesSidebar from '../components/HelpfulResourcesSidebar';
import FocusMode from '../components/FocusMode';
import FocusModeStats from '../components/FocusModeStats';
import { parseFlashcards, parseQuiz, parseExam } from '../utils/parseGeminiResponse';
import NotificationProvider, { useNotification } from '../components/NotificationProvider';
import Notification from '../components/Notification';
import LottieLoader from '../components/LottieLoader';

// Define notification interface
interface NotificationItem {
  id: number;
  type: 'success' | 'error' | 'info';
  icon?: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoDismiss?: boolean;
}

// Define notification input interface (without id)
interface NotificationInput {
  type: 'success' | 'error' | 'info';
  icon?: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoDismiss?: boolean;
}

interface Document {
  id: number;
  name: string;
  text: string;
  timestamp: string;
}

interface HistoryItem {
  id: number;
  timestamp: string;
  feature: string;
  documentName: string;
  text: string;
  result: any;
  topics?: any;
  questionCount?: any;
  knowledgeType?: any;
  questionTypes?: any;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [quizScore, setQuizScore] = useState<any>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [showExamGenerator, setShowExamGenerator] = useState(false);
  const [examFeedback, setExamFeedback] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [performanceSummaries, setPerformanceSummaries] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showFeatureSelector, setShowFeatureSelector] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Helper to add a notification
  const addNotification = (notification: NotificationInput) => {
    const newNotification: NotificationItem = { 
      id: Date.now(), 
      ...notification,
      autoDismiss: notification.autoDismiss !== false // Default to true unless explicitly set to false
    };
    setNotifications((prev) => [...prev, newNotification]);
  };
  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    notifications.forEach((notification) => {
      if (notification.autoDismiss) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, 5000); // 5 seconds
        timeouts.push(timeout);
      }
    });

    // Cleanup timeouts when component unmounts or notifications change
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [notifications]);

  // Memoize parsed flashcards to prevent unnecessary re-parsing
  const parsedFlashcards = useMemo(() => {
    if (feature === 'flashcards' && result) {
      console.log('Memoizing flashcards with result:', result);
      const cards = parseFlashcards(result);
      console.log('Memoized cards result:', cards);
      return cards;
    }
    return [];
  }, [feature, result]);

  // Debug useEffect to track result changes for flashcards
  useEffect(() => {
    if (feature === 'flashcards' && result) {
      console.log('Flashcards result changed:', result);
      const parsedCards = parseFlashcards(result);
      console.log('Parsed cards on result change:', parsedCards);
    }
  }, [result, feature]);

  // Load saved data on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    const savedDocuments = localStorage.getItem('savedDocuments');
    if (savedDocuments) {
      const parsedDocs = JSON.parse(savedDocuments);
      setDocuments(parsedDocs);
      if (parsedDocs.length > 0) {
        setActiveDocument(parsedDocs[0]);
      }
    }

    const savedHistory = localStorage.getItem('studyHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedPerformanceSummaries = localStorage.getItem('performanceSummaries');
    if (savedPerformanceSummaries) {
      setPerformanceSummaries(JSON.parse(savedPerformanceSummaries));
    }

    setDataLoaded(true);
  }, []);

  // Save API key when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('geminiApiKey', apiKey);
    }
  }, [apiKey]);

  // Save documents when they change
  useEffect(() => {
    localStorage.setItem('savedDocuments', JSON.stringify(documents));
  }, [documents]);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('studyHistory', JSON.stringify(history));
  }, [history]);

  // Save performance summaries when they change
  useEffect(() => {
    localStorage.setItem('performanceSummaries', JSON.stringify(performanceSummaries));
  }, [performanceSummaries]);

  const handleExtracted = (text: string, fileName?: string) => {
    const newDocument = {
      id: Date.now(),
      name: fileName || `Document ${documents.length + 1}`,
      text: text,
      timestamp: new Date().toISOString()
    };
    
    setDocuments(prev => [...prev, newDocument]);
    setActiveDocument(newDocument);
    setResult(null);
    setQuizScore(null);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
    setExamFeedback(null);
    
    addNotification({
      type: 'success',
      icon: '📄',
      title: 'Document Uploaded',
      message: `${fileName || 'Document'} has been successfully uploaded and is ready for study.`
    });
  };

  const handleFeature = async (ft: string) => {
    setFeature(ft);
    setResult(null);
    setQuizScore(null);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
    setExamFeedback(null);
    
    if (ft === 'quiz') {
      setShowQuizGenerator(true);
      return;
    }
    
    if (ft === 'exam') {
      setShowExamGenerator(true);
      return;
    }
    
    if (ft === 'examCram') {
      // For Exam Cram, we don't need to generate content initially
      // The ExamCram component will handle its own content generation
      return;
    }
    
    if (!activeDocument?.text || !apiKey) return;
    
    // Check if we have a previous result for this feature and document
    const previousResult = history.find(item => 
      item.feature === ft && 
      item.documentName === activeDocument.name
    );
    
    if (previousResult) {
      // Load the previous result
      setResult(previousResult.result);
      addNotification({
        type: 'info',
        icon: '📚',
        title: 'Previous Content Loaded',
        message: `Showing your last generated ${getFeatureLabel(ft)}. You can regenerate if needed.`,
        action: {
          label: 'Regenerate',
          onClick: () => generateContent(ft)
        }
      });
    } else {
      // Generate new content
      await generateContent(ft);
    }
  };

  const generateContent = async (ft: string, topics: any = null, questionCount: any = null, knowledgeType: any = null, questionTypes: any = null, performanceSummary: any = null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: activeDocument?.text || '', 
          promptType: ft, 
          geminiApiKey: apiKey,
          topics,
          questionCount,
          knowledgeType,
          questionTypes,
          performanceSummary
        }),
      });
      const data = await res.json();
      console.log({data});
      setLoading(false);
      setResult(data);
      
      // Save to history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        feature: ft,
        documentName: activeDocument?.name || '',
        text: (activeDocument?.text || '').substring(0, 100) + '...',
        result: data,
        topics,
        questionCount,
        knowledgeType,
        questionTypes
      };
      setHistory(prev => [historyItem, ...prev]);
      
      addNotification({
        type: 'success',
        icon: '✨',
        title: 'Content Generated',
        message: `Your ${getFeatureLabel(ft)} has been successfully created!`,
        action: {
          label: 'View',
          onClick: () => {
            // The content is already displayed, just scroll to it
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
    } catch (error) {
      console.error('Generation error:', error);
      setLoading(false);
      
      addNotification({
        type: 'error',
        icon: '❌',
        title: 'Generation Failed',
        message: 'There was an error generating your content. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => generateContent(ft, topics, questionCount, knowledgeType, questionTypes, performanceSummary)
        }
      });
    }
  };

  const handleQuizGenerate = async (topics: any, questionCount: any, knowledgeType: any) => {
    setShowQuizGenerator(false);
    await generateContent('quiz', topics, questionCount, knowledgeType);
  };

  const handleExamGenerate = async (topics: any, questionTypes: any, knowledgeType: any, performanceSummary: any = null) => {
    setShowExamGenerator(false);
    await generateContent('exam', topics, null, knowledgeType, questionTypes, performanceSummary);
  };

  const handleQuizSubmit = async (answers: any) => {
    setQuizAnswers(answers);
    
    // Parse the quiz questions from the result
    const quizQuestions = parseQuiz(result);
    console.log('Quiz questions for grading:', quizQuestions);
    console.log('User answers for grading:', answers);
    
    const res = await fetch('/api/grade-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userAnswers: answers.answers || answers, 
        quiz: quizQuestions,
        geminiApiKey: apiKey
      }),
    });
    const data = await res.json();
    console.log('Grading result:', data);
    setQuizScore(data);
    
    addNotification({
      type: 'success',
      icon: '📊',
      title: 'Quiz Completed',
      message: `You scored ${data.score}/${data.total} (${Math.round((data.score/data.total)*100)}%)`,
      action: {
        label: 'View Results',
        onClick: () => {
          // Scroll to results
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }
    });
  };

  const handleExamSubmit = async (answers: any) => {
    setQuizAnswers(answers);
    const res = await fetch('/api/grade-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userAnswers: answers, 
        quiz: parseExam(result),
        geminiApiKey: apiKey
      }),
    });
    const data = await res.json();
    setQuizScore(data);
    setExamFeedback(data.details || null);
    
    // Save performance summary
    if (data.details) {
      const performanceSummary = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        examId: result?.id || Date.now(),
        documentName: activeDocument?.name || '',
        score: data.score,
        total: data.total,
        percentage: data.percentage,
        details: data.details,
        topics: result?.topics || [],
        questionTypes: result?.questionTypes || []
      };
      setPerformanceSummaries(prev => [performanceSummary, ...prev]);
      
      addNotification({
        type: 'success',
        icon: '📝',
        title: 'Exam Completed',
        message: `You scored ${data.score}/${data.total} (${Math.round((data.score/data.total)*100)}%)`,
        action: {
          label: 'View Analysis',
          onClick: () => {
            // Scroll to performance summary
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }
        }
      });
    }
  };

  const loadFromHistory = (historyItem: HistoryItem) => {
    // console.log('Loading from history:', historyItem);
    
    // Find or create document from history
    const existingDoc = documents.find(doc => doc.name === historyItem.documentName);
    if (existingDoc) {
      setActiveDocument(existingDoc);
    } else {
      const newDoc = {
        id: Date.now(),
        name: historyItem.documentName,
        text: historyItem.text,
        timestamp: historyItem.timestamp
      };
      setDocuments(prev => [...prev, newDoc]);
      setActiveDocument(newDoc);
    }
    
    // Set the result and feature
    setResult(historyItem.result);
    setFeature(historyItem.feature);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
    
    // Add notification for successful load
    addNotification({
      type: 'success',
      icon: getFeatureIcon(historyItem.feature),
      title: `${getFeatureLabel(historyItem.feature)} Loaded`,
      message: `Successfully loaded ${historyItem.documentName} from history.`,
      action: {
        label: 'View',
        onClick: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setPerformanceSummaries([]);
    setDocuments([]);
    setActiveDocument(null);
    setApiKey('');
    localStorage.removeItem('studyHistory');
    localStorage.removeItem('performanceSummaries');
    localStorage.removeItem('savedDocuments');
    localStorage.removeItem('geminiApiKey');
  };

  const removeDocument = (documentId: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    if (activeDocument?.id === documentId) {
      const remainingDocs = documents.filter(doc => doc.id !== documentId);
      setActiveDocument(remainingDocs.length > 0 ? remainingDocs[0] : null);
    }
  };

  // Step logic
  const step = !activeDocument ? 0 : !apiKey ? 1 : !result ? 2 : 3;

  // Auto-expand sections when they become relevant
  useEffect(() => {
    if (step >= 1 && !apiKey) {
      setShowApiKeyInput(true);
    }
    if (step >= 2 && apiKey && !feature) {
      setShowFeatureSelector(true);
    }
  }, [step, apiKey, feature]);

  // Auto-collapse sections when they're completed
  useEffect(() => {
    if (apiKey && showApiKeyInput) {
      setTimeout(() => setShowApiKeyInput(false), 2000);
    }
  }, [apiKey, showApiKeyInput]);

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case 'examCram':
        return 'Exam Cram';
      case 'studyGuide':
        return 'Study Guide';
      case 'flashcards':
        return 'Flashcards';
      case 'quiz':
        return 'Quiz';
      case 'exam':
        return 'Exam';
      default:
        return 'Study Tools';
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'examCram':
        return '🚀';
      case 'studyGuide':
        return '📚';
      case 'flashcards':
        return '📝';
      case 'quiz':
        return '🎓';
      case 'exam':
        return '📊';
      default:
        return '✨';
    }
  };

  // If focus mode is active, render the FocusMode component
  if (focusMode) {
    return (
      <NotificationProvider notifications={notifications} removeNotification={removeNotification}>
        <FocusMode
          activeDocument={activeDocument}
          apiKey={apiKey}
          onExit={() => setFocusMode(false)}
          currentProgress={typeof currentQuestionIndex === 'number' ? undefined : null}
        />
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider notifications={notifications} removeNotification={removeNotification}>
      <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Notification System */}
        <Notification />
        
        {/* Mobile Header - Fixed at top */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PageRush AI
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDocumentManager(!showDocumentManager)}
                className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                title="Documents"
              >
                📚
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                title="History"
              >
                📊
              </button>
              <button
                onClick={() => setShowFeatureSelector(!showFeatureSelector)}
                className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:from-green-700 hover:to-emerald-700 transition-colors"
                title="Study Tools"
              >
                ✨
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Spacer for fixed header */}
        <div className="lg:hidden h-16"></div>

        <div className="max-w-6xl mx-auto py-4 lg:py-8 px-4 lg:px-6 space-y-4 lg:space-y-6 relative">
          
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ${focusMode ? 'sr-only' : ''}`}>
                PageRush AI
              </h1>
              {activeDocument && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📄</span>
                  <span className="text-sm font-medium text-gray-700">{activeDocument.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDocumentManager(!showDocumentManager)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-all duration-200 shadow-sm border border-gray-200"
              >
                📚 Documents ({documents.length})
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-all duration-200 shadow-sm border border-gray-200"
              >
                📊 History ({history.length})
              </button>
              <button
              onClick={
                () => setShowFeatureSelector(!showFeatureSelector)
              }
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:from-green-700 hover:to-emerald-700 flex items-center space-x-2"
              >
                <span>✨</span>
                <span>Study Tools</span>
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 flex items-center space-x-2"
                onClick={() => setFocusMode(true)}
              >
                <span>🎯</span>
                <span>Focus Mode</span>
              </button>
            </div>
          </div>

          {/* Mobile Document Info */}
          {activeDocument && (
            <div className="lg:hidden bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">📄</span>
                <span className="text-sm font-medium text-gray-700 truncate">{activeDocument.name}</span>
              </div>
            </div>
          )}

          {/* Mobile Action Buttons */}
          <div className="lg:hidden flex flex-wrap gap-2">
            <button
              onClick={() => setFocusMode(true)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center space-x-2"
            >
              <span>🎯</span>
              <span>Focus Mode</span>
            </button>
          </div>

          {/* Data Restored Notification intentionally removed for linting */}

          {/* Document Manager */}
          {showDocumentManager && (
            <DocumentManager 
              documents={documents}
              activeDocument={activeDocument}
              onSelectDocument={setActiveDocument}
              onRemoveDocument={removeDocument}
              onClose={() => setShowDocumentManager(false)}
              onAddMoreDocuments={() => {
                setShowDocumentManager(false);
                // Clear active document to show the PdfUploader (step 0)
                setActiveDocument(null);
              }}
            />
          )}

          {/* History Panel */}
          {showHistory && (
            <HistoryPanel 
              history={history}
              performanceSummaries={performanceSummaries}
              onLoadFromHistory={loadFromHistory}
              onClearHistory={clearHistory}
              onClose={() => setShowHistory(false)}
            />
          )}

          {/* Mobile Floating Action Button */}
          {step >= 2 && !showQuizGenerator && !showExamGenerator && !result && (
            <></>
          )}

          {/* Mobile Bottom Spacer */}
          <div className="lg:hidden h-20"></div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left Sidebar - Setup + Helpful Resources */}
            <div className={`lg:col-span-1 space-y-4 lg:space-y-6 transition-all duration-300 ${
              sidebarCollapsed ? 'lg:col-span-0 lg:w-16' : ''
            }`}>
              {/* Collapse/Expand Button */}
              <div className="hidden lg:flex justify-end">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white transition-all duration-200"
                  title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  <span className={`transform transition-transform duration-200 ${
                    sidebarCollapsed ? 'rotate-180' : ''
                  }`}>
                    {sidebarCollapsed ? '→' : '←'}
                  </span>
                </button>
              </div>
              
              {/* Mobile Setup Section */}
              {step === 0 && (
                <div className="lg:hidden">
                  <PdfUploader onExtracted={handleExtracted} />
                </div>
              )}
              
              {step === 0 && !sidebarCollapsed && (
                <div className="hidden lg:block">
                  <PdfUploader onExtracted={handleExtracted} />
                </div>
              )}
              
              {/* Collapsible Setup Section */}
              {step >= 1 && !sidebarCollapsed && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* API Key Section */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="w-full px-4 lg:px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          apiKey ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <span className="text-white text-sm">🔑</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">API Key</h3>
                          <p className="text-sm text-gray-500">
                            {apiKey ? 'Configured' : 'Required for AI features'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {apiKey && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            ✓ Ready
                          </span>
                        )}
                        <span className={`transform transition-transform duration-200 ${
                          showApiKeyInput ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </div>
                    </button>
                    {showApiKeyInput && (
                      <div className="px-4 lg:px-6 pb-4">
                        <ApiKeyInput onChange={setApiKey} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Helpful Resources Sidebar */}
              {!sidebarCollapsed && (
                <HelpfulResourcesSidebar 
                  history={history} 
                  performanceSummaries={performanceSummaries} 
                  onLoadFromHistory={loadFromHistory} 
                />
              )}

              {/* Progress Tracker for Quiz/Exam */}
              {(feature === 'quiz' || feature === 'exam') && result && !sidebarCollapsed && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Progress
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Question</span>
                      <span className="font-medium">{currentQuestionIndex + 1} / {totalQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% Complete
                    </div>
                  </div>
                </div>
              )}

              {/* Focus Mode Stats */}
              {!sidebarCollapsed && <FocusModeStats onEnterFocusMode={() => setFocusMode(true)} />}

              {/* Collapsed Sidebar - Show only icons */}
              {sidebarCollapsed && (
                <div className="space-y-4">
                  {/* Progress Indicator (if quiz/exam active) */}
                  {(feature === 'quiz' || feature === 'exam') && result && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-3 flex justify-center">
                      <div className="text-center" title={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}>
                        <div className="text-lg font-bold text-blue-600">{currentQuestionIndex + 1}</div>
                        <div className="text-xs text-gray-500">/ {totalQuestions}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className={`space-y-4 lg:space-y-6 transition-all duration-300 ${
              sidebarCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'
            }`}>
              {/* Feature Selection - Moved to main content area */}
              {step >= 2 && ((!showQuizGenerator || !showExamGenerator || !result) || showFeatureSelector) && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6" data-feature-selector>
                  <div className="text-center mb-4 lg:mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">✨ Choose Your Study Tool</h2>
                    <p className="text-gray-600 text-sm lg:text-base">Select how you'd like to study your materials</p>
                  </div>
                  <FeatureSelector selected={feature} onSelect={handleFeature} />
                </div>
              )}

              {showQuizGenerator && (
                <QuizGenerator 
                  onGenerate={handleQuizGenerate} 
                  extractedText={activeDocument?.text || ''} 
                  apiKey={apiKey}
                />
              )}
              {showExamGenerator && (
                <ExamGenerator 
                  onGenerate={handleExamGenerate} 
                  extractedText={activeDocument?.text || ''} 
                  apiKey={apiKey}
                  performanceSummaries={performanceSummaries}
                />
              )}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <LottieLoader 
                    text="Generating with Gemini..." 
                    size="large"
                  />
                </div>
              )}
              {!loading && feature === 'examCram' && activeDocument && (
                <ExamCram 
                  content={activeDocument.text || ''}
                  documentName={activeDocument.name || ''}
                  apiKey={apiKey}
                  onGenerateContent={generateContent}
                />
              )}
              {!loading && result && feature === 'studyGuide' && (
                <StudyGuide 
                  content={result.result?.candidates?.[0]?.content?.parts?.[0]?.text || ''} 
                  onRegenerate={() => generateContent('studyGuide')}
                />
              )}
              {!loading && result && feature === 'flashcards' && (
                <Flashcards 
                  cards={parsedFlashcards} 
                  onRegenerate={() => generateContent('flashcards')}
                />
              )}
              {!loading && result && feature === 'quiz' && (
                <>
                  <Quiz 
                    questions={parseQuiz(result)} 
                    onSubmit={handleQuizSubmit}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    setTotalQuestions={setTotalQuestions}
                  />
                  {quizScore && <Insights score={quizScore.score} total={quizScore.total} details={quizScore.details || []} />}
                </>
              )}
              {!loading && result && feature === 'exam' && (
                <>
                  <Exam 
                    questions={parseExam(result)} 
                    onSubmit={handleExamSubmit}
                    feedback={examFeedback}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    setTotalQuestions={setTotalQuestions}
                  />
                  {quizScore && <Insights score={quizScore.score} total={quizScore.total} details={quizScore.details || []} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
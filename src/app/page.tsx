'use client';

import React, { useState, useEffect } from 'react';
import PdfUploader from '../components/PdfUploader';
import ApiKeyInput from '../components/ApiKeyInput';
import FeatureSelector from '../components/FeatureSelector';
import StudyGuide from '../components/StudyGuide';
import Flashcards from '../components/Flashcards';
import Quiz from '../components/Quiz';
import QuizGenerator from '../components/QuizGenerator';
import ExamGenerator from '../components/ExamGenerator';
import Exam from '../components/Exam';
import Insights from '../components/Insights';
import HistoryPanel from '../components/HistoryPanel';
import DocumentManager from '../components/DocumentManager';
import HelpfulResourcesSidebar from '../components/HelpfulResourcesSidebar';
import { parseFlashcards, parseQuiz, parseExam } from '../utils/parseGeminiResponse';
import NotificationProvider, { useNotification } from '../components/NotificationProvider';
import Notification from '../components/Notification';

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [feature, setFeature] = useState('studyGuide');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizScore, setQuizScore] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [showExamGenerator, setShowExamGenerator] = useState(false);
  const [examFeedback, setExamFeedback] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [performanceSummaries, setPerformanceSummaries] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showFeatureSelector, setShowFeatureSelector] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Helper to add a notification
  const addNotification = (notification) => {
    setNotifications((prev) => [...prev, { id: Date.now(), ...notification }]);
  };
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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

  const handleExtracted = (text, fileName) => {
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

  const handleFeature = async (ft) => {
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
    
    if (!activeDocument?.text || !apiKey) return;
    await generateContent(ft);
  };

  const generateContent = async (ft, topics = null, questionCount = null, knowledgeType = null, questionTypes = null, performanceSummary = null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: activeDocument.text, 
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
        documentName: activeDocument.name,
        text: activeDocument.text.substring(0, 100) + '...',
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

  const handleQuizGenerate = async (topics, questionCount, knowledgeType) => {
    setShowQuizGenerator(false);
    await generateContent('quiz', topics, questionCount, knowledgeType);
  };

  const handleExamGenerate = async (topics, questionTypes, knowledgeType, performanceSummary = null) => {
    setShowExamGenerator(false);
    await generateContent('exam', topics, null, knowledgeType, questionTypes, performanceSummary);
  };

  const handleQuizSubmit = async (answers) => {
    setQuizAnswers(answers);
    const res = await fetch('/api/grade-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAnswers: answers, quiz: parseQuiz(result) }),
    });
    const data = await res.json();
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

  const handleExamSubmit = async (answers) => {
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
        documentName: activeDocument.name,
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

  const loadFromHistory = (historyItem) => {
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
    
    setResult(historyItem.result);
    setFeature(historyItem.feature);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
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

  const removeDocument = (documentId) => {
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

  const getFeatureLabel = (feature) => {
    switch (feature) {
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

  const getFeatureIcon = (feature) => {
    switch (feature) {
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

  return (
    <NotificationProvider notifications={notifications} removeNotification={removeNotification}>
      <div className={`font-sans min-h-screen ${focusMode ? 'bg-white' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} transition-colors duration-300`}>
        {/* Notification System */}
        <Notification />
        <div className={`max-w-6xl mx-auto ${focusMode ? 'py-2' : 'py-8'} px-4 space-y-6 relative`}>
          
          {/* Header */}
          <div className="flex items-center justify-between">
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
                className={`px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 ${
                  focusMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200'
                }`}
                onClick={() => setFocusMode(f => !f)}
              >
                {focusMode ? 'Exit Focus' : 'Focus Mode'}
              </button>
            </div>
          </div>

          {/* Data Restored Notification */}
          {/* {dataLoaded && (documents.length > 0 || apiKey) && (
            <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📚</span>
                <div>
                  <p className="text-blue-800 font-medium">Data Restored</p>
                  <p className="text-blue-600 text-sm">
                    {documents.length > 0 && apiKey ? `${documents.length} documents and API key loaded` :
                     documents.length > 0 ? `${documents.length} documents loaded` :
                     'API key loaded from previous session'}
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {/* Document Manager */}
          {showDocumentManager && (
            <DocumentManager 
              documents={documents}
              activeDocument={activeDocument}
              onSelectDocument={setActiveDocument}
              onRemoveDocument={removeDocument}
              onClose={() => setShowDocumentManager(false)}
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Setup + Helpful Resources */}
            <div className="lg:col-span-1 space-y-6">
              {step === 0 && <PdfUploader onExtracted={handleExtracted} />}
              
              {/* Collapsible Setup Section */}
              {step >= 1 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* API Key Section */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                      <div className="px-6 pb-4">
                        <ApiKeyInput onChange={setApiKey} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Helpful Resources Sidebar */}
              <HelpfulResourcesSidebar 
                history={history} 
                performanceSummaries={performanceSummaries} 
                onLoadFromHistory={loadFromHistory} 
              />

              {/* Progress Tracker for Quiz/Exam */}
              {(feature === 'quiz' || feature === 'exam') && result && (
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
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Feature Selection - Moved to main content area */}
              {step >= 2 && !showQuizGenerator && !showExamGenerator && !result && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Choose Your Study Tool</h2>
                    <p className="text-gray-600">Select how you'd like to study your materials</p>
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
                  <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-gray-600 font-medium">Generating with Gemini...</p>
                  </div>
                </div>
              )}
              {!loading && result && feature === 'studyGuide' && (
                <StudyGuide content={result.result?.candidates?.[0]?.content?.parts?.[0]?.text || ''} />
              )}
              {!loading && result && feature === 'flashcards' && (
                <Flashcards cards={parseFlashcards(result)} />
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
                  {quizScore && <Insights score={quizScore.score} total={quizScore.total} />}
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
                  {quizScore && <Insights score={quizScore.score} total={quizScore.total} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
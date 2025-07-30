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
import { parseFlashcards, parseQuiz, parseExam } from '../utils/parseGeminiResponse';

const steps = [
  { label: 'Upload PDFs', icon: '📄' },
  { label: 'Enter Gemini API Key', icon: '🔑' },
  { label: 'Select Feature', icon: '✨' },
  { label: 'Study', icon: '🎯' },
];

export default function Home() {
  const [pdfText, setPdfText] = useState('');
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

  // Load saved data on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    const savedPdfText = localStorage.getItem('extractedPdfText');
    if (savedPdfText) {
      setPdfText(savedPdfText);
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

  // Save PDF text when it changes
  useEffect(() => {
    if (pdfText) {
      localStorage.setItem('extractedPdfText', pdfText);
    }
  }, [pdfText]);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('studyHistory', JSON.stringify(history));
  }, [history]);

  // Save performance summaries when they change
  useEffect(() => {
    localStorage.setItem('performanceSummaries', JSON.stringify(performanceSummaries));
  }, [performanceSummaries]);

  // Step logic
  const step = !pdfText ? 0 : !apiKey ? 1 : !result ? 2 : 3;

  const handleExtracted = (text) => {
    setPdfText(text);
    setResult(null);
    setQuizScore(null);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
    setExamFeedback(null);
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
    
    if (!pdfText || !apiKey) return;
    await generateContent(ft);
  };

  const generateContent = async (ft, topics = null, questionCount = null, knowledgeType = null, questionTypes = null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: pdfText, 
          promptType: ft, 
          geminiApiKey: apiKey,
          topics,
          questionCount,
          knowledgeType,
          questionTypes
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
        text: pdfText.substring(0, 100) + '...',
        result: data,
        topics,
        questionCount,
        knowledgeType,
        questionTypes
      };
      setHistory(prev => [historyItem, ...prev]);
    } catch (error) {
      console.error('Generation error:', error);
      setLoading(false);
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
        score: data.score,
        total: data.total,
        percentage: data.percentage,
        details: data.details,
        topics: result?.topics || [],
        questionTypes: result?.questionTypes || []
      };
      setPerformanceSummaries(prev => [performanceSummary, ...prev]);
    }
  };

  const loadFromHistory = (historyItem) => {
    setPdfText(historyItem.text);
    setResult(historyItem.result);
    setFeature(historyItem.feature);
    setShowQuizGenerator(false);
    setShowExamGenerator(false);
  };

  const clearHistory = () => {
    setHistory([]);
    setPerformanceSummaries([]);
    setPdfText('');
    setApiKey('');
    localStorage.removeItem('studyHistory');
    localStorage.removeItem('performanceSummaries');
    localStorage.removeItem('extractedPdfText');
    localStorage.removeItem('geminiApiKey');
  };

  return (
    <div className={`font-sans min-h-screen ${focusMode ? 'bg-white' : 'bg-gray-50'} p-0 sm:p-0`}>
      <div className={`max-w-2xl mx-auto ${focusMode ? 'py-2' : 'py-8'} space-y-6 relative`}>
        {/* Stepper */}
        {!focusMode && (
          <div className="flex items-center justify-center gap-2 py-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex flex-col items-center ${i === step ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
                     aria-current={i === step ? 'step' : undefined}>
                  <span className="text-2xl" aria-label={s.label}>{s.icon}</span>
                  <span className="text-xs mt-1">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-2 rounded-full" />}
              </div>
            ))}
          </div>
        )}
        
        {/* Header with History Button */}
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${focusMode ? 'sr-only' : ''}`}>Exam Study AI</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              📚 History ({history.length})
            </button>
            <button
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${focusMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setFocusMode(f => !f)}
              aria-label="Toggle Focus Mode"
            >
              {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
            </button>
          </div>
        </div>

        {/* Data Restored Notification */}
        {dataLoaded && (pdfText || apiKey) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">📚</span>
              <div>
                <p className="text-blue-800 font-medium">Data Restored</p>
                <p className="text-blue-600 text-sm">
                  {pdfText && apiKey ? 'Document and API key loaded from previous session' :
                   pdfText ? 'Document loaded from previous session' :
                   'API key loaded from previous session'}
                </p>
              </div>
            </div>
          </div>
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
        {step === 0 && <PdfUploader onExtracted={handleExtracted} />}
        {step >= 1 && <ApiKeyInput onChange={setApiKey} />}
        {step >= 2 && !showQuizGenerator && !showExamGenerator && (
          <FeatureSelector selected={feature} onSelect={handleFeature} />
        )}
        {showQuizGenerator && (
          <QuizGenerator 
            onGenerate={handleQuizGenerate} 
            extractedText={pdfText} 
            apiKey={apiKey}
          />
        )}
        {showExamGenerator && (
          <ExamGenerator 
            onGenerate={handleExamGenerate} 
            extractedText={pdfText} 
            apiKey={apiKey}
            performanceSummaries={performanceSummaries}
          />
        )}
        {loading && <div className="text-center text-blue-600 animate-pulse">Generating with Gemini...</div>}
        {!loading && result && feature === 'studyGuide' && (
          <StudyGuide content={result.result?.candidates?.[0]?.content?.parts?.[0]?.text || ''} />
        )}
        {!loading && result && feature === 'flashcards' && (
          <Flashcards cards={parseFlashcards(result)} />
        )}
        {!loading && result && feature === 'quiz' && (
          <>
            <Quiz questions={parseQuiz(result)} onSubmit={handleQuizSubmit} />
            {quizScore && <Insights score={quizScore.score} total={quizScore.total} />}
          </>
        )}
        {!loading && result && feature === 'exam' && (
          <>
            <Exam 
              questions={parseExam(result)} 
              onSubmit={handleExamSubmit}
              feedback={examFeedback}
            />
            {quizScore && <Insights score={quizScore.score} total={quizScore.total} />}
          </>
        )}
      </div>
    </div>
  );
}
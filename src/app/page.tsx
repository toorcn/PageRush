'use client';

import React, { useState } from 'react';
import PdfUploader from '../components/PdfUploader';
import ApiKeyInput from '../components/ApiKeyInput';
import FeatureSelector from '../components/FeatureSelector';
import StudyGuide from '../components/StudyGuide';
import Flashcards from '../components/Flashcards';
import Quiz from '../components/Quiz';
import QuizGenerator from '../components/QuizGenerator';
import Exam from '../components/Exam';
import Insights from '../components/Insights';
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

  // Step logic
  const step = !pdfText ? 0 : !apiKey ? 1 : !result ? 2 : 3;

  const handleExtracted = (text) => {
    setPdfText(text);
    setResult(null);
    setQuizScore(null);
    setShowQuizGenerator(false);
  };

  const handleFeature = async (ft) => {
    setFeature(ft);
    setResult(null);
    setQuizScore(null);
    setShowQuizGenerator(false);
    
    if (ft === 'quiz') {
      setShowQuizGenerator(true);
      return;
    }
    
    if (!pdfText || !apiKey) return;
    await generateContent(ft);
  };

  const generateContent = async (ft, topics = null, questionCount = null) => {
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
          questionCount
        }),
      });
      const data = await res.json();
      console.log({data});
      setLoading(false);
      setResult(data);
    } catch (error) {
      console.error('Generation error:', error);
      setLoading(false);
    }
  };

  const handleQuizGenerate = async (topics, questionCount) => {
    setShowQuizGenerator(false);
    await generateContent('quiz', topics, questionCount);
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
      body: JSON.stringify({ userAnswers: answers, quiz: parseExam(result) }),
    });
    const data = await res.json();
    setQuizScore(data);
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
        {/* Focus Mode Toggle */}
        <button
          className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold shadow ${focusMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFocusMode(f => !f)}
          aria-label="Toggle Focus Mode"
        >
          {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
        </button>
        {/* Main Content */}
        <h1 className={`text-3xl font-bold text-center mb-2 ${focusMode ? 'sr-only' : ''}`}>Exam Study AI</h1>
        {step === 0 && <PdfUploader onExtracted={handleExtracted} />}
        {step >= 1 && <ApiKeyInput onChange={setApiKey} />}
        {step >= 2 && !showQuizGenerator && (
          <FeatureSelector selected={feature} onSelect={handleFeature} />
        )}
        {showQuizGenerator && (
          <QuizGenerator 
            onGenerate={handleQuizGenerate} 
            extractedText={pdfText} 
            apiKey={apiKey}
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
            <Exam questions={parseExam(result)} onSubmit={handleExamSubmit} />
            {quizScore && <Insights score={quizScore.score} total={quizScore.total} />}
          </>
        )}
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { questionBankManager } from '../utils/questionBankManager';
import LottieLoader from './LottieLoader';
import { useLoading } from './LoadingProvider';

export default function AdaptiveLearning({ topicBreakdown, learningProgress, onBack, onProgressUpdate, apiKey, content, skipReview = false }) {
  const { startLoading, stopLoading } = useLoading();
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    averageTime: 0,
    startTime: null,
    confidenceSum: 0,
    streakCount: 0,
    maxStreak: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('select'); // select, review, practice, quiz
  const [lastCallTime, setLastCallTime] = useState(0); // Track last API call time
  const [questionBankStatus, setQuestionBankStatus] = useState({}); // Track question bank loading status
  const [shouldAutoReview, setShouldAutoReview] = useState(false); // Track if we should auto-enter review mode
  
  // Enhanced learning features
  const [userConfidence, setUserConfidence] = useState(null); // 1-5 scale
  const [showMetacognitivePrompt, setShowMetacognitivePrompt] = useState(false);
  const [learningMode, setLearningMode] = useState('adaptive'); // adaptive, spaced, interleaved
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [breakReminder, setBreakReminder] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison'); // comparison, explanation, learning

  useEffect(() => {
    if (learningProgress.currentFocus && shouldAutoReview && !skipReview) {
      const topic = topicBreakdown?.topics.find(t => t.id === learningProgress.currentFocus);
      if (topic) {
        setCurrentTopic(topic);
        setCurrentMode('review');
        generateReviewContent(topic);
      }
    } else if (learningProgress.currentFocus && (!shouldAutoReview || skipReview)) {
      // If current focus is set but auto-review is disabled or skipReview is true, go directly to practice
      const topic = topicBreakdown?.topics.find(t => t.id === learningProgress.currentFocus);
      if (topic) {
        setCurrentTopic(topic);
        setCurrentMode('practice');
        generatePracticeQuestion(topic, 'medium');
      }
    } else if (!learningProgress.currentFocus) {
      // Reset to select mode when no current focus
      setCurrentMode('select');
      setCurrentTopic(null);
      setCurrentQuestion(null);
      setUserAnswer('');
      setShowExplanation(false);
      setQuestionHistory([]);
      setSessionStats({
        questionsAnswered: 0,
        correctAnswers: 0,
        averageTime: 0,
        startTime: null
      });
      setShouldAutoReview(false);
    }
  }, [learningProgress.currentFocus, topicBreakdown, shouldAutoReview, skipReview]);

  // Cleanup effect to reset state when component unmounts
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setCurrentMode('select');
      setCurrentTopic(null);
      setCurrentQuestion(null);
      setUserAnswer('');
      setShowExplanation(false);
      setQuestionHistory([]);
      setSessionStats({
        questionsAnswered: 0,
        correctAnswers: 0,
        averageTime: 0,
        startTime: null
      });
    };
  }, []);

  // Set auto-review flag when component mounts with current focus
  useEffect(() => {
    if (learningProgress.currentFocus && !shouldAutoReview) {
      setShouldAutoReview(true);
    }
  }, [learningProgress.currentFocus, shouldAutoReview]);

  // Debounce function to prevent duplicate API calls
  const debounceCall = (func, delay = 500) => {
    const now = Date.now();
    if (now - lastCallTime < delay) {
      console.log('API call debounced - too soon since last call');
      return Promise.resolve(); // Return a resolved promise instead of undefined
    }
    setLastCallTime(now);
    return func();
  };

  const generateReviewContent = async (topic) => {
    return debounceCall(async () => {
      setLoading(true);
      startLoading('global', 'Generating review content...');
      try {
        const response = await fetch('/api/exam-cram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generateReviewContent',
            topic,
            content,
            geminiApiKey: apiKey
          }),
        });
        const data = await response.json();
        setCurrentQuestion(data.reviewContent);
      } catch (error) {
        console.error('Error generating review content:', error);
      } finally {
        setLoading(false);
        stopLoading('global');
      }
    });
  };

  const generatePracticeQuestion = async (topic, difficulty = 'medium') => {
    console.log('Getting practice question for topic:', topic.title, 'difficulty:', difficulty);
    
    try {
      setLoading(true);
      startLoading('global', 'Loading practice question...');
      
      // Ensure we have a question bank for this topic
      if (!questionBankManager.questionBanks.has(topic.id)) {
        setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loading' }));
        await questionBankManager.getQuestionBank(topic, content, apiKey);
        setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loaded' }));
      }
      
      // Get next question from the bank
      const nextQuestion = questionBankManager.getNextQuestion(topic.id, difficulty, true);
      
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
        // Mark question as used
        questionBankManager.markQuestionUsed(topic.id, nextQuestion.id);
      } else {
        console.error('No questions available in bank');
        setCurrentQuestion({
          question: "No more questions available for this topic. Please try a different topic.",
          type: "text",
          options: [],
          correctAnswer: "No questions available",
          explanation: "All questions in the bank have been used."
        });
      }
    } catch (error) {
      console.error('Error getting practice question:', error);
      setCurrentQuestion({
        question: "Sorry, there was an error loading the question. Please try again.",
        type: "text",
        options: [],
        correctAnswer: "Please try again",
        explanation: "There was an error with the question loading."
      });
    } finally {
      setLoading(false);
      stopLoading('global');
    }
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) return;

    const endTime = Date.now();
    const responseTime = (endTime - sessionStats.startTime) / 1000;

    setLoading(true);
    startLoading('global', 'Checking your answer...');
    try {
      let result;
      
      // For MCQ questions, check locally without API call
      if (currentQuestion.type === 'mcq') {
        result = questionBankManager.checkMCQAnswer(currentQuestion, userAnswer);
      } else {
        // For text questions, use API for grading
        const response = await fetch('/api/exam-cram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'gradeAnswer',
            question: currentQuestion,
            userAnswer,
            geminiApiKey: apiKey
          }),
        });
        result = await response.json();
      }
      
      const isCorrect = result.isCorrect;
      const newQuestionHistory = {
        question: currentQuestion,
        userAnswer,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
        isCorrect,
        responseTime,
        timestamp: new Date().toISOString()
      };

      // Add to question bank manager history
      questionBankManager.addToHistory(currentTopic.id, currentQuestion, userAnswer, isCorrect, responseTime);
      
      setQuestionHistory(prev => [...prev, newQuestionHistory]);
      setShowExplanation(true);
      setActiveTab('comparison'); // Reset to comparison tab
      
      // Update session stats
      setSessionStats(prev => ({
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        averageTime: (prev.averageTime + responseTime) / 2,
        startTime: null,
        confidenceSum: prev.confidenceSum + (userConfidence || 3)
      }));

      // Update streak
      updateStreak(isCorrect);

    } catch (error) {
      console.error('Error grading answer:', error);
    } finally {
      setLoading(false);
      stopLoading('global');
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setCurrentQuestion(null);
    setUserConfidence(null);
    setActiveTab('comparison'); // Reset tab for next question
    setShowMetacognitivePrompt(Math.random() < 0.3); // 30% chance to show metacognitive prompt
    
    // Check for break reminder
    checkBreakReminder();
    
    // Use question bank manager to determine next difficulty
    const nextDifficulty = questionBankManager.getNextDifficulty(currentTopic.id);
    
    // Determine next action based on performance
    const recentPerformance = questionHistory.slice(-3);
    const correctCount = recentPerformance.filter(q => q.isCorrect).length;
    
    if (correctCount >= 2) {
      // Good performance, move to next topic or harder question
      const nextTopic = getNextTopic();
      if (nextTopic) {
        setCurrentTopic(nextTopic);
        generatePracticeQuestion(nextTopic, nextDifficulty);
      } else {
        // All topics completed
        completeSession();
      }
    } else {
      // Need more practice on current topic
      generatePracticeQuestion(currentTopic, nextDifficulty);
    }
  };

  const getNextTopic = () => {
    const currentIndex = topicBreakdown.topics.findIndex(t => t.id === currentTopic.id);
    const nextTopic = topicBreakdown.topics[currentIndex + 1];
    
    // Check if next topic is available and has questions
    if (nextTopic) {
      const cacheStatus = questionBankManager.getCacheStatus()[nextTopic.id];
      const hasQuestionsLeft = cacheStatus && cacheStatus.remainingQuestions > 0;
      const isCompleted = learningProgress.completedTopics.includes(nextTopic.id);
      
      if (!isCompleted || hasQuestionsLeft) {
        return nextTopic;
      }
    }
    
    // Find first topic that's either not completed or has questions left
    return topicBreakdown.topics.find(topic => {
      const cacheStatus = questionBankManager.getCacheStatus()[topic.id];
      const hasQuestionsLeft = cacheStatus && cacheStatus.remainingQuestions > 0;
      const isCompleted = learningProgress.completedTopics.includes(topic.id);
      
      return !isCompleted || hasQuestionsLeft;
    });
  };

  const completeSession = () => {
    const performance = {
      score: sessionStats.correctAnswers / sessionStats.questionsAnswered,
      totalQuestions: sessionStats.questionsAnswered,
      correctAnswers: sessionStats.correctAnswers,
      averageTime: sessionStats.averageTime
    };
    
    // Only mark as completed if there are no more questions in the bank
    const cacheStatus = questionBankManager.getCacheStatus()[currentTopic.id];
    const hasQuestionsLeft = cacheStatus && cacheStatus.remainingQuestions > 0;
    
    if (!hasQuestionsLeft) {
      onProgressUpdate(currentTopic.id, performance);
    }
    
    // Reset session
    setSessionStats({
      questionsAnswered: 0,
      correctAnswers: 0,
      averageTime: 0,
      startTime: null,
      confidenceSum: 0,
      streakCount: 0,
      maxStreak: 0
    });
    setQuestionHistory([]);
    setCurrentMode('select');
    setCurrentTopic(null);
  };

  const startTopicPractice = (topic) => {
    console.log('Starting topic practice for:', topic.title);
    setCurrentTopic(topic);
    setCurrentMode('practice');
    setCurrentQuestion(null); // Reset any previous question
    setSessionStartTime(Date.now());
    setUserConfidence(null);
    setShowMetacognitivePrompt(Math.random() < 0.3); // 30% chance to show metacognitive prompt
    setBreakReminder(false);
    generatePracticeQuestion(topic, 'medium');
  };

  const preloadQuestionBank = async (topic) => {
    try {
      setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loading' }));
      startLoading('global', `Loading question bank for ${topic.title}...`);
      await questionBankManager.getQuestionBank(topic, content, apiKey);
      setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loaded' }));
      stopLoading('global');
    } catch (error) {
      console.error('Error preloading question bank:', error);
      setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'error' }));
      stopLoading('global');
    }
  };

  const preloadAllQuestionBanks = async () => {
    const topicsToLoad = topicBreakdown.topics.filter(topic => 
      !questionBankManager.questionBanks.has(topic.id)
    );
    
    startLoading('global', 'Preloading all question banks...');
    
    for (const topic of topicsToLoad) {
      try {
        setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loading' }));
        await questionBankManager.getQuestionBank(topic, content, apiKey);
        setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loaded' }));
      } catch (error) {
        console.error(`Error preloading question bank for ${topic.title}:`, error);
        setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'error' }));
      }
    }
    
    stopLoading('global');
  };

  // Helper function to check if a topic is truly completed
  const isTopicTrulyCompleted = (topicId) => {
    const isCompleted = learningProgress.completedTopics.includes(topicId);
    const cacheStatus = questionBankManager.getCacheStatus()[topicId];
    const hasQuestionsLeft = cacheStatus && cacheStatus.remainingQuestions > 0;
    
    return isCompleted && !hasQuestionsLeft;
  };

  // Reset topic completion status to allow practicing remaining questions
  const resetTopicCompletion = (topicId) => {
    // Reset the used questions for this topic so they can be practiced again
    questionBankManager.usedQuestions.set(topicId, new Set());
    
    // Force a re-render by updating the question bank status
    setQuestionBankStatus(prev => ({ ...prev }));
    
    console.log(`Reset completion status for topic ${topicId}`);
  };

  // Enhanced learning helper functions
  const getMetacognitivePrompt = () => {
    const prompts = [
      "Before answering, think: What do I already know about this concept?",
      "Consider: How confident am I in my knowledge of this topic?",
      "Reflect: Have I seen similar questions before?",
      "Ask yourself: What strategies can I use to approach this question?",
      "Think: What would be the most logical answer based on the context?"
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const checkBreakReminder = () => {
    if (sessionStartTime) {
      const sessionDuration = (Date.now() - sessionStartTime) / (1000 * 60); // minutes
      if (sessionDuration > 25 && !breakReminder) {
        setBreakReminder(true);
        return true;
      }
    }
    return false;
  };

  const updateStreak = (isCorrect) => {
    setSessionStats(prev => {
      const newStreak = isCorrect ? prev.streakCount + 1 : 0;
      return {
        ...prev,
        streakCount: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak)
      };
    });
  };

  // Reset component state when navigating back
  const handleBackToOverview = () => {
    // Reset all component state
    setCurrentMode('select');
    setCurrentTopic(null);
    setCurrentQuestion(null);
    setUserAnswer('');
    setShowExplanation(false);
    setQuestionHistory([]);
    setSessionStats({
      questionsAnswered: 0,
      correctAnswers: 0,
      averageTime: 0,
      startTime: null,
      confidenceSum: 0,
      streakCount: 0,
      maxStreak: 0
    });
    setShouldAutoReview(false);
    setUserConfidence(null);
    setShowMetacognitivePrompt(false);
    setSessionStartTime(null);
    setBreakReminder(false);
    
    // Call the original onBack function
    onBack();
  };

  const renderFormattedText = (text) => {
    return text?.split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('#')) {
          const level = line.match(/^#+/)[0].length;
          const content = line.replace(/^#+\s*/, '');
          const Tag = `h${Math.min(level, 6)}`;
          return React.createElement(Tag, {
            key: index,
            className: `font-bold text-gray-800 ${level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'}`
          }, content);
        }
        
        // Handle bold text
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/);
          return (
            <div key={index} className="mb-2">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </div>
          );
        }
        
        // Handle lists
        if (line.match(/^[-*]\s/)) {
          return <li key={index} className="ml-4">{line.replace(/^[-*]\s/, '')}</li>;
        }
        
        // Handle numbered lists
        if (line.match(/^\d+\.\s/)) {
          return <li key={index} className="ml-4">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        
        // Regular text
        return <p key={index} className="mb-2">{line}</p>;
      });
  };

  const renderTopicSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Choose a Topic to Practice</h2>
        <p className="text-gray-600">Select a topic to start adaptive learning</p>
      </div>

      {/* Question Bank Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-3">📚 Question Bank Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topicBreakdown?.topics.map((topic) => {
            const cacheStatus = questionBankManager.getCacheStatus()[topic.id];
            const status = questionBankStatus[topic.id];
            const isCompleted = learningProgress.completedTopics.includes(topic.id);
            const isTrulyCompleted = isTopicTrulyCompleted(topic.id);
            
            return (
              <div key={topic.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-sm font-medium text-gray-700">{topic.title}</span>
                <div className="flex items-center space-x-2">
                  {status === 'loading' && <span className="text-blue-600">⏳</span>}
                  {isTrulyCompleted && <span className="text-green-600">✅</span>}
                  {isCompleted && !isTrulyCompleted && <span className="text-yellow-600">🔄</span>}
                  {cacheStatus ? (
                    <span className={`text-xs ${
                      isTrulyCompleted ? 'text-green-600' : 
                      cacheStatus.remainingQuestions > 0 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {cacheStatus.remainingQuestions} left
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">Not loaded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center">
          <button
            onClick={preloadAllQuestionBanks}
            disabled={Object.values(questionBankStatus).some(s => s === 'loading')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {Object.values(questionBankStatus).some(s => s === 'loading') ? 'Loading...' : 'Preload All Question Banks'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topicBreakdown?.topics.map((topic) => {
          const isCompleted = learningProgress.completedTopics.includes(topic.id);
          const isWeak = learningProgress.weakAreas.includes(topic.id);
          const cacheStatus = questionBankManager.getCacheStatus()[topic.id];
          
          // A topic is truly completed only if it's marked as completed AND has no questions left
          const hasQuestionsLeft = cacheStatus && cacheStatus.remainingQuestions > 0;
          const isTrulyCompleted = isCompleted && !hasQuestionsLeft;
          
          return (
            <div key={topic.id} className={`border rounded-lg p-4 transition-all duration-300 ${
              isTrulyCompleted 
                ? 'bg-green-50 border-green-200' 
                : isWeak 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-gray-200 hover:border-blue-300'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-800">{topic.title}</h3>
                <div className="flex items-center space-x-2">
                  {isTrulyCompleted && <span className="text-green-600">✅</span>}
                  {isCompleted && hasQuestionsLeft && <span className="text-yellow-600">🔄</span>}
                  {isWeak && <span className="text-red-600">⚠️</span>}
                  {cacheStatus && (
                    <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">
                      {cacheStatus.remainingQuestions} questions
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    topic.priority === 'high' ? 'bg-red-100 text-red-800' :
                    topic.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {topic.priority}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{topic.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  ⏱️ {topic.estimatedStudyTime} min • 📚 {topic.keyConcepts.length} concepts
                </div>
                <div className="flex space-x-2">
                  {!cacheStatus && (
                    <button
                      onClick={() => preloadQuestionBank(topic)}
                      disabled={questionBankStatus[topic.id] === 'loading'}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {questionBankStatus[topic.id] === 'loading' ? 'Loading...' : 'Load'}
                    </button>
                  )}
                  <button
                    onClick={() => startTopicPractice(topic)}
                    disabled={isTrulyCompleted}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isTrulyCompleted
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isTrulyCompleted ? 'Completed' : 'Practice'}
                  </button>
                  {isCompleted && hasQuestionsLeft && (
                    <button
                      onClick={() => resetTopicCompletion(topic.id)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                      title="Reset completion status to practice remaining questions"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReviewMode = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📖 Review: {currentTopic?.title}</h2>
          <p className="text-gray-600">Review the key concepts before practicing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentMode('select')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Topics
          </button>
          <button
            onClick={() => startTopicPractice(currentTopic)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Practice
          </button>
        </div>
      </div>

      {currentQuestion && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">
              {currentQuestion.title}
            </h3>
            <div className="space-y-6">
              {currentQuestion.content.map((section, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 flex items-center">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {section.heading}
                  </h4>
                  <div className="text-gray-700 leading-relaxed">
                    {renderFormattedText(section.text)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPracticeMode = () => (
    <div className="space-y-6">
      {/* Header - Responsive layout */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">🎯 Practice: {currentTopic?.title}</h2>
            {/* Enhanced Stats - Responsive grid */}
            <div className="grid grid-cols-2 lg:flex lg:items-center lg:space-x-4 gap-2 lg:gap-4 text-sm lg:text-base text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs lg:text-sm">Questions: {sessionStats.questionsAnswered}</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-xs lg:text-sm">Correct: {sessionStats.correctAnswers}</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-xs lg:text-sm">Avg Time: {sessionStats.averageTime.toFixed(1)}s</span>
              {sessionStats.streakCount > 0 && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs lg:text-sm">
                  🔥 Streak: {sessionStats.streakCount}
                </span>
              )}
              {sessionStats.questionsAnswered > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs lg:text-sm">
                  Confidence: {Math.round(sessionStats.confidenceSum / sessionStats.questionsAnswered * 20)}%
                </span>
              )}
            </div>
          </div>
          <button
            onClick={completeSession}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm lg:text-base w-full lg:w-auto"
          >
            End Session
          </button>
        </div>
        
        {/* Break Reminder */}
        {breakReminder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-600 text-xl">⏰</span>
              <div>
                <h4 className="font-medium text-yellow-800">Time for a Break!</h4>
                <p className="text-sm text-yellow-700">You've been studying for over 25 minutes. Consider taking a 5-minute break to maintain focus.</p>
              </div>
              <button
                onClick={() => setBreakReminder(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Metacognitive Prompt */}
        {showMetacognitivePrompt && currentQuestion && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-purple-600 text-lg">💭</span>
              <div>
                <h4 className="font-medium text-purple-800 mb-1">Learning Strategy</h4>
                <p className="text-sm text-purple-700">{getMetacognitivePrompt()}</p>
              </div>
              <button
                onClick={() => setShowMetacognitivePrompt(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Question badges - Responsive */}
        {currentQuestion && (
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentQuestion.type === 'mcq' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {currentQuestion?.type?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {currentQuestion ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
          <div className="space-y-4 lg:space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 lg:p-4 rounded-r-lg">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-2">Question:</h3>
              <div className="text-gray-700 leading-relaxed text-sm lg:text-base overflow-hidden">
                {renderFormattedText(currentQuestion.question)}
              </div>
            </div>
            
            {currentQuestion.type === 'mcq' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="font-medium text-gray-800 text-sm lg:text-base">Select the best answer:</h4>
                  <span className="text-green-600 text-xs lg:text-sm font-medium bg-green-100 px-2 py-1 rounded self-start sm:self-auto">
                    ⚡ Instant Feedback
                  </span>
                </div>
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="flex items-start space-x-3 p-3 lg:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={userAnswer === option}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0"
                      />
                      <span className="text-gray-700 flex-1 text-sm lg:text-base break-words">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="font-medium text-gray-800 text-sm lg:text-base">Your answer:</h4>
                  <span className="text-blue-600 text-xs lg:text-sm font-medium bg-blue-100 px-2 py-1 rounded self-start sm:self-auto">
                    🤖 AI Grading
                  </span>
                </div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-3 lg:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm lg:text-base"
                  rows={4}
                />
              </div>
            )}

            {!showExplanation && (
              <div className="space-y-4">
                {/* Confidence Rating */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3 text-sm lg:text-base">How confident are you in your answer?</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Not sure</span>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setUserConfidence(rating)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                            userConfidence === rating
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">Very sure</span>
                  </div>
                </div>
                
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!userAnswer.trim() || loading || userConfidence === null}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Checking...' : 'Submit Answer'}
                </button>
              </div>
            )}

            {showExplanation && (
              <div className="space-y-4">
                {/* Quick Result Summary */}
                <div className={`p-4 rounded-lg border-l-4 ${
                  questionHistory[questionHistory.length - 1]?.isCorrect 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {questionHistory[questionHistory.length - 1]?.isCorrect ? '✅' : '❌'}
                      </span>
                      <div>
                        <span className="font-semibold text-lg">
                          {questionHistory[questionHistory.length - 1]?.isCorrect ? 'Correct!' : 'Incorrect'}
                        </span>
                        {userConfidence && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">Confidence: {userConfidence}/5</span>
                            <span className="text-xs px-2 py-1 rounded-full ${
                              questionHistory[questionHistory.length - 1]?.isCorrect 
                                ? userConfidence >= 4 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                : userConfidence >= 4 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }">
                              {questionHistory[questionHistory.length - 1]?.isCorrect 
                                ? userConfidence >= 4 ? 'Great!' : 'Review needed'
                                : userConfidence >= 4 ? 'Learning moment' : 'Study time'
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Next Question
                    </button>
                  </div>
                </div>

                {/* Detailed Feedback Tabs */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Tab Headers */}
                  <div className="flex border-b border-gray-200">
                    <button
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors"
                      onClick={() => setActiveTab('comparison')}
                    >
                      📊 Comparison
                    </button>
                    <button
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors"
                      onClick={() => setActiveTab('explanation')}
                    >
                      💡 Explanation
                    </button>
                    <button
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                      onClick={() => setActiveTab('learning')}
                    >
                      🎯 Learning Tips
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4">
                    {/* Comparison Tab */}
                    {activeTab === 'comparison' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                              <span className="text-blue-600 mr-2">Your Answer</span>
                            </h4>
                            <div className="text-gray-700 text-sm bg-white rounded p-2 border">
                              {renderFormattedText(questionHistory[questionHistory.length - 1]?.userAnswer || '')}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                              <span className="text-green-600 mr-2">Correct Answer</span>
                            </h4>
                            <div className="text-gray-700 text-sm bg-white rounded p-2 border">
                              {renderFormattedText(questionHistory[questionHistory.length - 1]?.correctAnswer || '')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanation Tab */}
                    {activeTab === 'explanation' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            <span className="text-blue-600 mr-2">Why this matters</span>
                          </h4>
                          <div className="text-gray-700 text-sm leading-relaxed">
                            {renderFormattedText(questionHistory[questionHistory.length - 1]?.explanation || '')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Learning Tips Tab */}
                    {activeTab === 'learning' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            <span className="text-purple-600 mr-2">Learning Strategy</span>
                          </h4>
                          <div className="space-y-3">
                            {questionHistory[questionHistory.length - 1]?.isCorrect ? (
                              userConfidence >= 4 ? (
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600">✅</span>
                                  <span className="text-sm text-gray-700">Great job! You have a solid understanding of this concept.</span>
                                </div>
                              ) : (
                                <div className="flex items-start space-x-2">
                                  <span className="text-yellow-600">⚠️</span>
                                  <span className="text-sm text-gray-700">You got it right, but with low confidence. Review this concept to build stronger understanding.</span>
                                </div>
                              )
                            ) : (
                              userConfidence >= 4 ? (
                                <div className="flex items-start space-x-2">
                                  <span className="text-red-600">❌</span>
                                  <span className="text-sm text-gray-700">You were confident but incorrect. This is a valuable learning moment - review the concept carefully.</span>
                                </div>
                              ) : (
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-600">💡</span>
                                  <span className="text-sm text-gray-700">You were unsure and incorrect. Focus on understanding the fundamentals of this topic.</span>
                                </div>
                              )
                            )}
                            <div className="flex items-start space-x-2">
                              <span className="text-purple-600">🎯</span>
                              <span className="text-sm text-gray-700">Try to explain this concept in your own words to reinforce your understanding.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 text-center">
          <LottieLoader 
            text="Generating your first question..." 
            size="large"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">🎯 Adaptive Learning</h2>
          <p className="text-gray-600 text-sm lg:text-base">Practice until you master each concept</p>
        </div>
        <button
          onClick={() => setCurrentMode('select')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm lg:text-base self-start sm:self-auto"
        >
          ← Back to Topics
        </button>
      </div>

      {loading && (
        <LottieLoader 
          overlay={true} 
          text="Generating content..." 
          size="large"
        />
      )}

      {currentMode === 'select' && renderTopicSelection()}
      {currentMode === 'review' && renderReviewMode()}
      {currentMode === 'practice' && renderPracticeMode()}
      
      {/* Performance Analytics */}
      {currentMode === 'select' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Performance Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicBreakdown?.topics.map((topic) => {
              const analytics = questionBankManager.getPerformanceAnalytics(topic.id);
              const history = questionBankManager.getHistory(topic.id);
              
              if (history.length === 0) return null;
              
              return (
                <div key={topic.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">{topic.title}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className={`font-medium ${analytics.accuracy >= 80 ? 'text-green-600' : analytics.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {analytics.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">{analytics.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium">{analytics.averageTime.toFixed(1)}s</span>
                    </div>
                    {Object.entries(analytics.difficultyBreakdown).map(([difficulty, stats]) => (
                      <div key={difficulty} className="flex justify-between text-xs">
                        <span className="text-gray-500 capitalize">{difficulty}:</span>
                        <span className="font-medium">{stats.correct}/{stats.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import { questionBankManager } from '../utils/questionBankManager';

export default function AdaptiveLearning({ topicBreakdown, learningProgress, onBack, onProgressUpdate, apiKey, content, skipReview = false }) {
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    averageTime: 0,
    startTime: null
  });
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('select'); // select, review, practice, quiz
  const [lastCallTime, setLastCallTime] = useState(0); // Track last API call time
  const [questionBankStatus, setQuestionBankStatus] = useState({}); // Track question bank loading status
  const [shouldAutoReview, setShouldAutoReview] = useState(false); // Track if we should auto-enter review mode

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
      }
    });
  };

  const generatePracticeQuestion = async (topic, difficulty = 'medium') => {
    console.log('Getting practice question for topic:', topic.title, 'difficulty:', difficulty);
    
    try {
      setLoading(true);
      
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
    }
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) return;

    const endTime = Date.now();
    const responseTime = (endTime - sessionStats.startTime) / 1000;

    setLoading(true);
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
      
      // Update session stats
      setSessionStats(prev => ({
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        averageTime: (prev.averageTime + responseTime) / 2,
        startTime: null
      }));

    } catch (error) {
      console.error('Error grading answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setCurrentQuestion(null);
    
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
      startTime: null
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
    generatePracticeQuestion(topic, 'medium');
  };

  const preloadQuestionBank = async (topic) => {
    try {
      setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loading' }));
      await questionBankManager.getQuestionBank(topic, content, apiKey);
      setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'loaded' }));
    } catch (error) {
      console.error('Error preloading question bank:', error);
      setQuestionBankStatus(prev => ({ ...prev, [topic.id]: 'error' }));
    }
  };

  const preloadAllQuestionBanks = async () => {
    const topicsToLoad = topicBreakdown.topics.filter(topic => 
      !questionBankManager.questionBanks.has(topic.id)
    );
    
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
      startTime: null
    });
    setShouldAutoReview(false);
    
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Practice: {currentTopic?.title}</h2>
          <div className="flex items-center space-x-4 text-gray-600">
            <span>Questions: {sessionStats.questionsAnswered}</span>
            <span>Correct: {sessionStats.correctAnswers}</span>
            <span>Avg Time: {sessionStats.averageTime.toFixed(1)}s</span>
            {currentQuestion && (
              <>
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
              </>
            )}
          </div>
        </div>
        <button
          onClick={completeSession}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          End Session
        </button>
      </div>

      {currentQuestion ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Question:</h3>
              <div className="text-gray-700 leading-relaxed">
                {renderFormattedText(currentQuestion.question)}
              </div>
            </div>
            
            {currentQuestion.type === 'mcq' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Select the best answer:</h4>
                  <span className="text-green-600 text-sm font-medium bg-green-100 px-2 py-1 rounded">
                    ⚡ Instant Feedback
                  </span>
                </div>
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={userAnswer === option}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 flex-1">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Your answer:</h4>
                  <span className="text-blue-600 text-sm font-medium bg-blue-100 px-2 py-1 rounded">
                    🤖 AI Grading
                  </span>
                </div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            )}

            {!showExplanation && (
              <button
                onClick={handleAnswerSubmit}
                disabled={!userAnswer.trim() || loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
              </button>
            )}

            {showExplanation && (
              <div className="space-y-4">
                <div className={`p-6 rounded-lg border-l-4 ${
                  questionHistory[questionHistory.length - 1]?.isCorrect 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">
                      {questionHistory[questionHistory.length - 1]?.isCorrect ? '✅' : '❌'}
                    </span>
                    <span className="font-semibold text-lg">
                      {questionHistory[questionHistory.length - 1]?.isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <strong className="text-gray-800">Your answer:</strong>
                      <div className="text-gray-700 mt-1 p-2 bg-gray-100 rounded">
                        {renderFormattedText(questionHistory[questionHistory.length - 1]?.userAnswer || '')}
                      </div>
                    </div>
                    
                    <div>
                      <strong className="text-gray-800">Correct answer:</strong>
                      <div className="text-gray-700 mt-1 p-2 bg-green-100 rounded">
                        {renderFormattedText(questionHistory[questionHistory.length - 1]?.correctAnswer || '')}
                      </div>
                    </div>
                    
                    <div>
                      <strong className="text-gray-800">Explanation:</strong>
                      <div className="text-gray-700 mt-1 leading-relaxed">
                        {renderFormattedText(questionHistory[questionHistory.length - 1]?.explanation || '')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleNextQuestion}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Next Question
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-lg font-medium mb-2">Generating your first question...</p>
            <p className="text-sm">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Adaptive Learning</h2>
          <p className="text-gray-600">Practice until you master each concept</p>
        </div>
        <button
          onClick={handleBackToOverview}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Overview
        </button>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Generating content...</p>
          </div>
        </div>
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
'use client';
import React, { useState, useEffect } from 'react';

export default function AdaptiveLearning({ topicBreakdown, learningProgress, onBack, onProgressUpdate, apiKey, content }) {
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

  useEffect(() => {
    if (learningProgress.currentFocus) {
      const topic = topicBreakdown?.topics.find(t => t.id === learningProgress.currentFocus);
      if (topic) {
        setCurrentTopic(topic);
        setCurrentMode('review');
        generateReviewContent(topic);
      }
    }
  }, [learningProgress.currentFocus, topicBreakdown]);

  // Debounce function to prevent duplicate API calls
  const debounceCall = (func, delay = 1000) => {
    const now = Date.now();
    if (now - lastCallTime < delay) {
      console.log('API call debounced - too soon since last call');
      return;
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
    return debounceCall(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/exam-cram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generatePracticeQuestion',
            topic,
            difficulty,
            content,
            geminiApiKey: apiKey
          }),
        });
        const data = await response.json();
        setCurrentQuestion(data.question);
        setSessionStats(prev => ({ ...prev, startTime: Date.now() }));
      } catch (error) {
        console.error('Error generating practice question:', error);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) return;

    const endTime = Date.now();
    const responseTime = (endTime - sessionStats.startTime) / 1000;

    return debounceCall(async () => {
      setLoading(true);
      try {
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
        const data = await response.json();
        
        const isCorrect = data.isCorrect;
        const newQuestionHistory = {
          question: currentQuestion,
          userAnswer,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          isCorrect,
          responseTime,
          timestamp: new Date().toISOString()
        };

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
    });
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setCurrentQuestion(null);
    
    // Determine next action based on performance
    const recentPerformance = questionHistory.slice(-3);
    const correctCount = recentPerformance.filter(q => q.isCorrect).length;
    
    if (correctCount >= 2) {
      // Good performance, move to next topic or harder question
      const nextTopic = getNextTopic();
      if (nextTopic) {
        setCurrentTopic(nextTopic);
        generatePracticeQuestion(nextTopic, 'medium');
      } else {
        // All topics completed
        completeSession();
      }
    } else {
      // Need more practice on current topic
      generatePracticeQuestion(currentTopic, 'easy');
    }
  };

  const getNextTopic = () => {
    const currentIndex = topicBreakdown.topics.findIndex(t => t.id === currentTopic.id);
    const nextTopic = topicBreakdown.topics[currentIndex + 1];
    
    if (nextTopic && !learningProgress.completedTopics.includes(nextTopic.id)) {
      return nextTopic;
    }
    
    // Find first incomplete topic
    return topicBreakdown.topics.find(t => !learningProgress.completedTopics.includes(t.id));
  };

  const completeSession = () => {
    const performance = {
      score: sessionStats.correctAnswers / sessionStats.questionsAnswered,
      totalQuestions: sessionStats.questionsAnswered,
      correctAnswers: sessionStats.correctAnswers,
      averageTime: sessionStats.averageTime
    };
    
    onProgressUpdate(currentTopic.id, performance);
    
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
    setCurrentTopic(topic);
    setCurrentMode('practice');
    generatePracticeQuestion(topic, 'medium');
  };

  const renderFormattedText = (text) => {
    return text
      .split('\n')
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topicBreakdown?.topics.map((topic) => {
          const isCompleted = learningProgress.completedTopics.includes(topic.id);
          const isWeak = learningProgress.weakAreas.includes(topic.id);
          
          return (
            <div key={topic.id} className={`border rounded-lg p-4 transition-all duration-300 ${
              isCompleted 
                ? 'bg-green-50 border-green-200' 
                : isWeak 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-gray-200 hover:border-blue-300'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-800">{topic.title}</h3>
                <div className="flex items-center space-x-2">
                  {isCompleted && <span className="text-green-600">✅</span>}
                  {isWeak && <span className="text-red-600">⚠️</span>}
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
                <button
                  onClick={() => startTopicPractice(topic)}
                  disabled={isCompleted}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCompleted ? 'Completed' : 'Practice'}
                </button>
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
        <button
          onClick={() => setCurrentMode('practice')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Practice
        </button>
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
          <p className="text-gray-600">
            Questions: {sessionStats.questionsAnswered} | 
            Correct: {sessionStats.correctAnswers} | 
            Avg Time: {sessionStats.averageTime.toFixed(1)}s
          </p>
        </div>
        <button
          onClick={completeSession}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          End Session
        </button>
      </div>

      {currentQuestion && (
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
                <h4 className="font-medium text-gray-800 mb-3">Select the best answer:</h4>
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
                <h4 className="font-medium text-gray-800 mb-3">Your answer:</h4>
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
          onClick={onBack}
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
    </div>
  );
} 
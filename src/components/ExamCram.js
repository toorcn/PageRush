'use client';
import React, { useState, useEffect } from 'react';
import TopicBreakdown from './TopicBreakdown';
import ReadinessAssessment from './ReadinessAssessment';
import AdaptiveLearning from './AdaptiveLearning';
import StudyGuide from './StudyGuide';

export default function ExamCram({ content, documentName, apiKey, onGenerateContent }) {
  const [currentView, setCurrentView] = useState('overview'); // overview, breakdown, assessment, learning, study
  const [topicBreakdown, setTopicBreakdown] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [learningProgress, setLearningProgress] = useState({
    completedTopics: [],
    weakAreas: [],
    currentFocus: null,
    practiceSessions: []
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTopics: 0,
    masteredTopics: 0,
    weakTopics: 0,
    averageResponseTime: 0,
    totalPracticeQuestions: 0,
    correctAnswers: 0
  });

  // Generate topic breakdown on component mount
  useEffect(() => {
    if (content && !topicBreakdown) {
      generateTopicBreakdown();
    }
  }, [content]);

  const generateTopicBreakdown = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateTopicBreakdown',
          content,
          geminiApiKey: apiKey
        }),
      });
      const data = await response.json();
      setTopicBreakdown(data.breakdown);
      setStats(prev => ({ ...prev, totalTopics: data.breakdown.topics.length }));
    } catch (error) {
      console.error('Error generating topic breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReadinessAssessment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateReadinessAssessment',
          content,
          topicBreakdown,
          geminiApiKey: apiKey
        }),
      });
      const data = await response.json();
      setReadinessData(data.assessment);
    } catch (error) {
      console.error('Error generating readiness assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLearningProgress = (topicId, performance) => {
    setLearningProgress(prev => {
      const updated = { ...prev };
      
      if (performance.score >= 0.8) {
        // Topic mastered
        if (!updated.completedTopics.includes(topicId)) {
          updated.completedTopics.push(topicId);
        }
        updated.weakAreas = updated.weakAreas.filter(id => id !== topicId);
      } else {
        // Topic needs more work
        if (!updated.weakAreas.includes(topicId)) {
          updated.weakAreas.push(topicId);
        }
        updated.completedTopics = updated.completedTopics.filter(id => id !== topicId);
      }

      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        masteredTopics: updated.completedTopics.length,
        weakTopics: updated.weakAreas.length,
        totalPracticeQuestions: prevStats.totalPracticeQuestions + performance.totalQuestions,
        correctAnswers: prevStats.correctAnswers + performance.correctAnswers,
        averageResponseTime: (prevStats.averageResponseTime + performance.averageTime) / 2
      }));

      return updated;
    });
  };

  const startAdaptiveLearning = (topicId) => {
    setLearningProgress(prev => ({ ...prev, currentFocus: topicId }));
    setCurrentView('learning');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🚀 Exam Cram</h2>
        <p className="text-gray-600">Accelerated study with smart topic breakdown and adaptive learning</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalTopics}</div>
          <div className="text-sm opacity-90">Total Topics</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.masteredTopics}</div>
          <div className="text-sm opacity-90">Mastered</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.weakTopics}</div>
          <div className="text-sm opacity-90">Need Work</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(1)}s</div>
          <div className="text-sm opacity-90">Avg Time</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('breakdown')}
          className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 text-left group"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Topic Breakdown</h3>
          <p className="text-gray-600 text-sm mb-4">See the most important concepts at a glance</p>
          <div className="text-blue-600 font-medium group-hover:text-blue-700">
            View Breakdown →
          </div>
        </button>

        <button
          onClick={() => {
            if (!readinessData) {
              generateReadinessAssessment();
            }
            setCurrentView('assessment');
          }}
          className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 text-left group"
        >
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Readiness Assessment</h3>
          <p className="text-gray-600 text-sm mb-4">Evaluate your exam preparedness</p>
          <div className="text-green-600 font-medium group-hover:text-green-700">
            Take Assessment →
          </div>
        </button>

        <button
          onClick={() => setCurrentView('learning')}
          className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 text-left group"
        >
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Adaptive Learning</h3>
          <p className="text-gray-600 text-sm mb-4">Practice until you master each concept</p>
          <div className="text-purple-600 font-medium group-hover:text-purple-700">
            Start Learning →
          </div>
        </button>
      </div>

      {/* Progress Overview */}
      {learningProgress.completedTopics.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3 text-green-800">🎉 Progress Made!</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-green-700 mb-2">Mastered Topics:</p>
              <div className="flex flex-wrap gap-2">
                {learningProgress.completedTopics.slice(0, 5).map(topicId => {
                  const topic = topicBreakdown?.topics.find(t => t.id === topicId);
                  return (
                    <span key={topicId} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {topic?.title || topicId}
                    </span>
                  );
                })}
                {learningProgress.completedTopics.length > 5 && (
                  <span className="text-green-600 text-sm">+{learningProgress.completedTopics.length - 5} more</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-orange-700 mb-2">Still Working On:</p>
              <div className="flex flex-wrap gap-2">
                {learningProgress.weakAreas.slice(0, 3).map(topicId => {
                  const topic = topicBreakdown?.topics.find(t => t.id === topicId);
                  return (
                    <span key={topicId} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                      {topic?.title || topicId}
                    </span>
                  );
                })}
                {learningProgress.weakAreas.length > 3 && (
                  <span className="text-orange-600 text-sm">+{learningProgress.weakAreas.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'breakdown':
        return (
          <TopicBreakdown 
            breakdown={topicBreakdown}
            onBack={() => setCurrentView('overview')}
            onStartLearning={startAdaptiveLearning}
            loading={loading}
          />
        );
      case 'assessment':
        return (
          <ReadinessAssessment 
            assessment={readinessData}
            onBack={() => setCurrentView('overview')}
            onStartLearning={startAdaptiveLearning}
            loading={loading}
          />
        );
      case 'learning':
        return (
          <AdaptiveLearning 
            topicBreakdown={topicBreakdown}
            learningProgress={learningProgress}
            onBack={() => setCurrentView('overview')}
            onProgressUpdate={updateLearningProgress}
            apiKey={apiKey}
            content={content}
          />
        );
      case 'study':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('overview')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Exam Cram
              </button>
            </div>
            <StudyGuide content={content} />
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Generating content...</p>
          </div>
        </div>
      )}
      
      {renderCurrentView()}
    </div>
  );
} 
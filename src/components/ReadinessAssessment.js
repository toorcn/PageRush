'use client';
import React, { useState } from 'react';
import LottieLoader from './LottieLoader';

export default function ReadinessAssessment({ assessment, onBack, onStartLearning, loading }) {
  const [currentSection, setCurrentSection] = useState('overview'); // overview, detailed, recommendations

  if (!assessment) {
    return (
      <div className="text-center py-8">
        <LottieLoader 
          text="Generating readiness assessment..." 
          size="large"
        />
      </div>
    );
  }

  const getReadinessColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getReadinessLevel = (score) => {
    if (score >= 80) return 'Ready';
    if (score >= 60) return 'Almost Ready';
    return 'Needs Work';
  };

  const getReadinessIcon = (score) => {
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getReadinessColor(assessment.overallScore)} mb-4`}>
          <span className="text-3xl font-bold">{assessment.overallScore}%</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {getReadinessIcon(assessment.overallScore)} {getReadinessLevel(assessment.overallScore)}
        </h3>
        <p className="text-gray-600">{assessment.overallAssessment}</p>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessment.categoryScores.map((category, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{category.name}</h4>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getReadinessColor(category.score)}`}>
                {category.score}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  category.score >= 80 ? 'bg-green-500' : 
                  category.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${category.score}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{assessment.totalTopics}</div>
          <div className="text-sm text-blue-700">Total Topics</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{assessment.masteredTopics}</div>
          <div className="text-sm text-green-700">Mastered</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{assessment.weakTopics}</div>
          <div className="text-sm text-orange-700">Need Work</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{assessment.estimatedStudyTime}</div>
          <div className="text-sm text-purple-700">Hours Needed</div>
        </div>
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* Knowledge Gaps */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Knowledge Gaps Analysis</h3>
        <div className="space-y-4">
          {assessment.knowledgeGaps.map((gap, index) => (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 mb-2">{gap.topic}</h4>
                  <p className="text-red-700 text-sm mb-3">{gap.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.missingConcepts.map((concept, idx) => (
                      <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onStartLearning(gap.topicId)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Practice
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">💪 Your Strengths</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.strengths.map((strength, index) => (
            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✅</span>
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">{strength.topic}</h4>
                  <p className="text-green-700 text-sm">{strength.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic-by-Topic Analysis */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Topic-by-Topic Analysis</h3>
        <div className="space-y-3">
          {assessment.topicAnalysis.map((topic, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">{topic.name}</h4>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getReadinessColor(topic.score)}`}>
                    {topic.score}%
                  </span>
                  <span className="text-sm text-gray-500">{topic.difficulty}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    topic.score >= 80 ? 'bg-green-500' : 
                    topic.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${topic.score}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{topic.assessment}</p>
              <div className="flex flex-wrap gap-2">
                {topic.keyConcepts.map((concept, idx) => (
                  <span key={idx} className={`px-2 py-1 rounded text-xs ${
                    concept.mastered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {concept.name} {concept.mastered ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Study Plan */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Recommended Study Plan</h3>
        <div className="space-y-4">
          {assessment.studyPlan.map((phase, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <h4 className="font-semibold text-gray-800">{phase.name}</h4>
                <span className="text-sm text-gray-500">({phase.duration})</span>
              </div>
              <p className="text-gray-600 mb-3">{phase.description}</p>
              <div className="space-y-2">
                {phase.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{topic}</span>
                    <button
                      onClick={() => onStartLearning(topic.id)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Priority Focus Areas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.priorityAreas.map((area, index) => (
            <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-orange-500 text-xl">🎯</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-800 mb-2">{area.topic}</h4>
                  <p className="text-orange-700 text-sm mb-3">{area.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    {area.suggestedActions.map((action, idx) => (
                      <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onStartLearning(area.topicId)}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                >
                  Focus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-800 mb-4">💡 Exam Success Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.examTips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl">💡</span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">{tip.title}</h4>
                <p className="text-blue-700 text-sm">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Readiness Assessment</h2>
          <p className="text-gray-600">Evaluate your exam preparedness</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Overview
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'detailed', label: 'Detailed Analysis', icon: '🔍' },
          { key: 'recommendations', label: 'Recommendations', icon: '💡' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setCurrentSection(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              currentSection === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {currentSection === 'overview' && renderOverview()}
      {currentSection === 'detailed' && renderDetailed()}
      {currentSection === 'recommendations' && renderRecommendations()}
    </div>
  );
} 
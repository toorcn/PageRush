'use client';
import React, { useState } from 'react';

export default function HistoryPanel({ history, performanceSummaries, onLoadFromHistory, onClearHistory, onClose }) {
  const [activeTab, setActiveTab] = useState('history');
  const [expandedExam, setExpandedExam] = useState(null);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'studyGuide': return '📚';
      case 'flashcards': return '🃏';
      case 'quiz': return '❓';
      case 'exam': return '📝';
      default: return '📄';
    }
  };

  const getFeatureLabel = (feature) => {
    switch (feature) {
      case 'studyGuide': return 'Study Guide';
      case 'flashcards': return 'Flashcards';
      case 'quiz': return 'Quiz';
      case 'exam': return 'Exam';
      default: return 'Unknown';
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-full max-h-[95vh] overflow-hidden flex flex-col mx-2">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">📚 Study History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'history' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Generated Content ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'performance' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance History ({performanceSummaries.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📚</div>
                  <p>No study content generated yet</p>
                  <p className="text-sm">Generate some content to see it here</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFeatureIcon(item.feature)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {getFeatureLabel(item.feature)}
                          </h3>
                          <p className="text-sm text-gray-500">{formatDate(item.timestamp)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onLoadFromHistory(item)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Load
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.text}</p>
                    {item.topics && item.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.topics.map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              {performanceSummaries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p>No performance data available</p>
                  <p className="text-sm">Complete exams to see performance history</p>
                </div>
              ) : (
                performanceSummaries.map((summary) => (
                  <div key={summary.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {summary.examMode === 'practice' ? '🎯 Practice Exam' : '📝 Standard Exam'} - {formatDate(summary.timestamp)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {summary.totalQuestions || summary.details?.length || 0} questions • {summary.answeredQuestions || 0} answered
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${getPerformanceColor(summary.percentage || (summary.score/summary.total)*100)}`}>
                          {summary.percentage || Math.round((summary.score/summary.total)*100)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {summary.score}/{summary.total} points
                        </div>
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Button */}
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setExpandedExam(expandedExam === summary.id ? null : summary.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        {expandedExam === summary.id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                      <div className="text-xs text-gray-500">
                        {summary.examMode === 'practice' ? 'Practice Mode' : 'Standard Mode'}
                      </div>
                    </div>

                    {/* Expanded Exam Details */}
                    {expandedExam === summary.id && summary.questions && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <h4 className="font-semibold text-gray-800">Question Details:</h4>
                        {summary.questions.map((question, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-800 mb-1">
                                  Q{idx + 1}: {question.question}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Type: {question.type} • Points: {question.earnedPoints || question.points || 0}/{question.maxPoints || 1}
                                </div>
                              </div>
                              <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                question.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Your Answer:</div>
                                <div className="bg-white p-2 rounded border">
                                  {question.userAnswer || 'No answer provided'}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Expected Answer:</div>
                                <div className="bg-white p-2 rounded border">
                                  {question.answer}
                                </div>
                              </div>
                            </div>
                            
                            {question.explanation && (
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Feedback:</div>
                                <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-300 text-xs">
                                  {question.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Performance Summary */}
                    {summary.performanceSummary && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm">
                          <div className="font-medium mb-1">Performance Summary:</div>
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            {summary.performanceSummary}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {activeTab === 'history' 
              ? `${history.length} items in history`
              : `${performanceSummaries.length} performance records`
            }
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClearHistory}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
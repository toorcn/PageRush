'use client';
import React, { useState } from 'react';

export default function HistoryPanel({ history, performanceSummaries, onLoadFromHistory, onClearHistory, onClose }) {
  const [activeTab, setActiveTab] = useState('history');

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
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-full max-h-[95vh] overflow-hidden flex flex-col">
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
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          Exam Performance - {formatDate(summary.timestamp)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {summary.details?.length || 0} questions completed
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getPerformanceColor(summary.percentage)}`}>
                          {summary.percentage}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {summary.score}/{summary.total} points
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Details */}
                    <div className="space-y-2">
                      {summary.details && summary.details.length > 0 && (
                        <div className="text-sm">
                          <div className="font-medium mb-1">Question Performance:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {summary.details.slice(0, 4).map((detail, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="truncate">Q{idx + 1}</span>
                                <span className={`font-medium ${
                                  detail.isCorrect ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {detail.points}/{detail.maxPoints}
                                </span>
                              </div>
                            ))}
                            {summary.details.length > 4 && (
                              <div className="col-span-2 text-center text-gray-500">
                                +{summary.details.length - 4} more questions
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
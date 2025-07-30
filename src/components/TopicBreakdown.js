'use client';
import React, { useState } from 'react';

export default function TopicBreakdown({ breakdown, onBack, onStartLearning, loading }) {
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [filterPriority, setFilterPriority] = useState('all'); // all, high, medium, low

  if (!breakdown) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Generating topic breakdown...</p>
      </div>
    );
  }

  const toggleTopic = (topicId) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const filteredTopics = breakdown.topics.filter(topic => {
    if (filterPriority === 'all') return true;
    return topic.priority === filterPriority;
  });

  const priorityStats = {
    high: breakdown.topics.filter(t => t.priority === 'high').length,
    medium: breakdown.topics.filter(t => t.priority === 'medium').length,
    low: breakdown.topics.filter(t => t.priority === 'low').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Topic Breakdown</h2>
          <p className="text-gray-600">Key concepts organized by importance</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Overview
        </button>
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{priorityStats.high}</div>
          <div className="text-sm text-red-700">High Priority</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{priorityStats.medium}</div>
          <div className="text-sm text-yellow-700">Medium Priority</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{priorityStats.low}</div>
          <div className="text-sm text-green-700">Low Priority</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { key: 'all', label: 'All Topics', count: breakdown.topics.length },
          { key: 'high', label: 'High Priority', count: priorityStats.high },
          { key: 'medium', label: 'Medium Priority', count: priorityStats.medium },
          { key: 'low', label: 'Low Priority', count: priorityStats.low }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterPriority(filter.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filterPriority === filter.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {filteredTopics.map((topic, index) => {
          const isExpanded = expandedTopics.has(topic.id);
          
          return (
            <div key={topic.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getPriorityIcon(topic.priority)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-800">{topic.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(topic.priority)}`}>
                          {topic.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{topic.description}</p>
                      
                      {/* Key Concepts Preview */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {topic.keyConcepts.slice(0, 3).map((concept, idx) => (
                          <span key={idx} className="bg-white px-2 py-1 rounded text-xs text-gray-700 border">
                            {concept}
                          </span>
                        ))}
                        {topic.keyConcepts.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{topic.keyConcepts.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Study Time Estimate */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>⏱️ {topic.estimatedStudyTime} min</span>
                        <span>📚 {topic.keyConcepts.length} concepts</span>
                        <span>🎯 {topic.difficultyLevel} difficulty</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onStartLearning(topic.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Practice
                    </button>
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-white p-4 border-t border-gray-200">
                  <div className="space-y-4">
                    {/* Key Concepts */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Key Concepts:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {topic.keyConcepts.map((concept, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700">{concept}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Learning Objectives */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Learning Objectives:</h4>
                      <ul className="space-y-1">
                        {topic.learningObjectives.map((objective, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span className="text-gray-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Related Topics */}
                    {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Related Topics:</h4>
                        <div className="flex flex-wrap gap-2">
                          {topic.relatedTopics.map((relatedTopic, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {relatedTopic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Study Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-3 text-blue-800">📚 Study Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Start With:</h4>
            <ul className="space-y-1 text-sm text-blue-600">
              {breakdown.topics
                .filter(t => t.priority === 'high')
                .slice(0, 3)
                .map((topic, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <span className="text-red-500">🔴</span>
                    <span>{topic.title}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Total Study Time:</h4>
            <div className="text-2xl font-bold text-blue-600">
              {breakdown.topics.reduce((total, topic) => total + topic.estimatedStudyTime, 0)} min
            </div>
            <p className="text-sm text-blue-600">Estimated time to master all topics</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
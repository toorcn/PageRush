'use client';
import React, { useState, useEffect } from 'react';
import { topicContentManager } from '../utils/topicContentManager';
import LottieLoader from './LottieLoader';

export default function TopicBreakdown({ breakdown, onBack, onStartLearning, onViewContent, loading, content, apiKey }) {
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [filterPriority, setFilterPriority] = useState('all'); // all, high, medium, low
  const [topicContent, setTopicContent] = useState(new Map()); // topicId -> detailed content
  const [loadingTopics, setLoadingTopics] = useState(new Set()); // Set of topic IDs being loaded
  const [topicContentStatus, setTopicContentStatus] = useState({}); // Track content loading status per topic

  // Auto-load previously cached content when component mounts
  useEffect(() => {
    if (breakdown?.topics && content && apiKey) {
      const loadCachedContent = async () => {
        const newTopicContent = new Map();
        const newTopicContentStatus = {};

        for (const topic of breakdown.topics) {
          if (topicContentManager.isTopicContentLoaded(topic.id)) {
            const cachedContent = topicContentManager.getCachedTopicContent(topic.id);
            if (cachedContent) {
              newTopicContent.set(topic.id, cachedContent);
              newTopicContentStatus[topic.id] = 'loaded';
            }
          }
        }

        if (newTopicContent.size > 0) {
          setTopicContent(newTopicContent);
          setTopicContentStatus(newTopicContentStatus);
        }
      };

      loadCachedContent();
    }
  }, [breakdown, content, apiKey]);

  if (!breakdown) {
    return (
      <div className="text-center py-8">
        <LottieLoader 
          text="Generating topic breakdown..." 
          size="large"
        />
      </div>
    );
  }

  const toggleTopic = async (topicId) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
      
      // Load topic content if not already loaded
      if (!topicContent.has(topicId) && !loadingTopics.has(topicId)) {
        await loadTopicContent(topicId);
      }
    }
    setExpandedTopics(newExpanded);
  };

  const loadTopicContent = async (topicId) => {
    if (loadingTopics.has(topicId)) return;
    
    const topic = breakdown.topics.find(t => t.id === topicId);
    if (!topic) return;

    setLoadingTopics(prev => new Set(prev).add(topicId));
    setTopicContentStatus(prev => ({ ...prev, [topicId]: 'loading' }));
    
    try {
      const content = await topicContentManager.getTopicContent(topic, content, apiKey);
      setTopicContent(prev => new Map(prev).set(topicId, content));
      setTopicContentStatus(prev => ({ ...prev, [topicId]: 'loaded' }));
    } catch (error) {
      console.error(`Error loading content for topic ${topicId}:`, error);
      setTopicContentStatus(prev => ({ ...prev, [topicId]: 'error' }));
      // Show error message to user
      alert(`Failed to load content for "${topic.title}". Please try again.`);
    } finally {
      setLoadingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  const preloadAllTopicContent = async () => {
    if (!breakdown?.topics || !content || !apiKey) return;
    
    const topicsToLoad = breakdown.topics.filter(topic => 
      !topicContentManager.isTopicContentLoaded(topic.id) && !topicContent.has(topic.id)
    );
    
    if (topicsToLoad.length === 0) {
      alert('All topic content is already loaded!');
      return;
    }
    
    for (const topic of topicsToLoad) {
      try {
        setTopicContentStatus(prev => ({ ...prev, [topic.id]: 'loading' }));
        const loadedContent = await topicContentManager.getTopicContent(topic, content, apiKey);
        setTopicContent(prev => new Map(prev).set(topic.id, loadedContent));
        setTopicContentStatus(prev => ({ ...prev, [topic.id]: 'loaded' }));
      } catch (error) {
        console.error(`Error preloading content for ${topic.title}:`, error);
        setTopicContentStatus(prev => ({ ...prev, [topic.id]: 'error' }));
      }
    }
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

      {/* Content Status */}
      {content && apiKey && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-3">📚 Content Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {breakdown?.topics.map((topic) => {
              const status = topicContentStatus[topic.id];
              const isLoaded = topicContentManager.isTopicContentLoaded(topic.id);
              const hasCachedContent = topicContent.has(topic.id);
              
              return (
                <div key={topic.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-700">{topic.title}</span>
                  <div className="flex items-center space-x-2">
                    {status === 'loading' && <span className="text-blue-600">⏳</span>}
                    {status === 'error' && <span className="text-red-600">❌</span>}
                    {(isLoaded || hasCachedContent) && !status && <span className="text-green-600">✅</span>}
                    {status === 'loaded' && <span className="text-green-600">✅</span>}
                    <span className="text-xs text-gray-500">
                      {isLoaded || hasCachedContent ? 'Loaded' : 'Not loaded'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex space-x-2">
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
        
        {/* Preload Content Button */}
        {content && apiKey && (
          <button
            onClick={preloadAllTopicContent}
            disabled={Object.values(topicContentStatus).some(s => s === 'loading')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              Object.values(topicContentStatus).some(s => s === 'loading')
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {Object.values(topicContentStatus).some(s => s === 'loading') ? '⏳ Loading...' : '📚 Load Remaining Content'}
          </button>
        )}
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
                        {content && apiKey && (topicContentManager.isTopicContentLoaded(topic.id) || topicContent.has(topic.id)) && (
                          <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
                            📚 Content loaded
                          </span>
                        )}
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
                      onClick={() => onViewContent(topic)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Study
                    </button>
                    {content && apiKey && !topicContentManager.isTopicContentLoaded(topic.id) && !topicContent.has(topic.id) && (
                      <button
                        onClick={() => loadTopicContent(topic.id)}
                        disabled={topicContentStatus[topic.id] === 'loading'}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        {topicContentStatus[topic.id] === 'loading' ? 'Loading...' : 'Load'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      disabled={loadingTopics.has(topic.id)}
                      className={`p-2 transition-colors ${
                        loadingTopics.has(topic.id)
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {loadingTopics.has(topic.id) ? (
                        <LottieLoader size="small" text="" />
                      ) : (
                        isExpanded ? '▼' : '▶'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-white p-4 border-t border-gray-200">
                  {loadingTopics.has(topic.id) ? (
                    <div className="text-center py-8">
                      <LottieLoader 
                        text="Loading detailed content..." 
                        size="medium"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Key Concepts */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Key Concepts:</h4>
                          <div className="grid grid-cols-1 gap-2">
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
                      </div>

                      {/* Detailed Content */}
                      {topicContent.has(topic.id) && (
                        <div className="space-y-6">
                          {/* Detailed Description */}
                          {topicContent.get(topic.id).detailedDescription && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">📖 Detailed Explanation:</h4>
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-gray-700 leading-relaxed">
                                  {topicContent.get(topic.id).detailedDescription}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Key Points */}
                          {topicContent.get(topic.id).keyPoints && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">🎯 Key Points:</h4>
                              <ul className="space-y-2">
                                {topicContent.get(topic.id).keyPoints.map((point, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span className="text-gray-700">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Examples */}
                          {topicContent.get(topic.id).examples && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">💡 Examples:</h4>
                              <div className="space-y-3">
                                {topicContent.get(topic.id).examples.map((example, idx) => (
                                  <div key={idx} className="bg-green-50 p-4 rounded-lg">
                                    <h5 className="font-medium text-green-800 mb-2">{example.title}</h5>
                                    <p className="text-gray-700">{example.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Common Misconceptions */}
                          {topicContent.get(topic.id).commonMisconceptions && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">⚠️ Common Misconceptions:</h4>
                              <div className="space-y-3">
                                {topicContent.get(topic.id).commonMisconceptions.map((misconception, idx) => (
                                  <div key={idx} className="bg-red-50 p-4 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                      <span className="text-red-500 mt-1">❌</span>
                                      <div>
                                        <p className="font-medium text-red-800 mb-1">{misconception.misconception}</p>
                                        <p className="text-gray-700 text-sm">
                                          <span className="font-medium text-green-700">Correction:</span> {misconception.correction}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Study Tips */}
                          {topicContent.get(topic.id).studyTips && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">📚 Study Tips:</h4>
                              <ul className="space-y-2">
                                {topicContent.get(topic.id).studyTips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="text-purple-500 mt-1">💡</span>
                                    <span className="text-gray-700">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Exam Tips */}
                          {topicContent.get(topic.id).examTips && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">📝 Exam Tips:</h4>
                              <ul className="space-y-2">
                                {topicContent.get(topic.id).examTips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="text-orange-500 mt-1">🎯</span>
                                    <span className="text-gray-700">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Practice Questions */}
                          {topicContent.get(topic.id).practiceQuestions && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">🧠 Practice Questions:</h4>
                              <div className="space-y-3">
                                {topicContent.get(topic.id).practiceQuestions.map((question, idx) => (
                                  <div key={idx} className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="font-medium text-gray-800 mb-2">{question.question}</p>
                                    <div className="bg-white p-3 rounded border-l-4 border-green-400">
                                      <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-medium text-green-700">Answer:</span> {question.answer}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium text-blue-700">Explanation:</span> {question.explanation}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Related Topics */}
                      {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">🔗 Related Topics:</h4>
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
                  )}
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
'use client';
import React, { useState, useEffect } from 'react';
import { topicContentManager } from '../utils/topicContentManager';

export default function TopicContentPage({ topic, onBack, content, apiKey, onStartPractice }) {
  const [topicContent, setTopicContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['overview', 'description']));
  const [completedSections, setCompletedSections] = useState(new Set());
  const [tipFormat, setTipFormat] = useState('cards'); // 'cards', 'table', 'steps'

  useEffect(() => {
    if (topic && content && apiKey) {
      loadTopicContent();
    }
  }, [topic, content, apiKey]);

  const loadTopicContent = async () => {
    if (!topic || !content || !apiKey) return;

    setLoading(true);
    setError(null);

    try {
      const topicContentData = await topicContentManager.getTopicContent(topic, content, apiKey);
      setTopicContent(topicContentData);
    } catch (error) {
      console.error('Error loading topic content:', error);
      setError('Failed to load topic content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const markSectionComplete = (sectionId) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionId);
    setCompletedSections(newCompleted);
  };

  const markSectionIncomplete = (sectionId) => {
    const newCompleted = new Set(completedSections);
    newCompleted.delete(sectionId);
    setCompletedSections(newCompleted);
  };


  const renderFormattedText = (text) => {
    if (!text) return null;

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
            className: `font-bold text-gray-800 mb-4 ${
              level === 1 ? 'text-2xl' : 
              level === 2 ? 'text-xl' : 
              level === 3 ? 'text-lg' : 'text-base'
            }`
          }, content);
        }
        
        // Handle bold text
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/);
          return (
            <div key={index} className="mb-3">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="font-semibold text-blue-800 bg-blue-50 px-1 rounded">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex} className="text-gray-700">{part}</span>;
              })}
            </div>
          );
        }
        
        // Handle lists
        if (line.match(/^[-*]\s/)) {
          return <li key={index} className="ml-6 mb-2 text-gray-700">{line.replace(/^[-*]\s/, '')}</li>;
        }
        
        // Handle numbered lists
        if (line.match(/^\d+\.\s/)) {
          return <li key={index} className="ml-6 mb-2 text-gray-700">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        
        // Regular text
        if (line.trim()) {
          return <p key={index} className="mb-3 leading-relaxed text-gray-700">{line}</p>;
        }
        
        return <br key={index} />;
      });
  };

  const renderContentSection = (sectionId, title, content, icon, bgColor = 'bg-blue-50', textColor = 'text-blue-800', borderColor = 'border-blue-200') => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;

    const isExpanded = expandedSections.has(sectionId);
    const isCompleted = completedSections.has(sectionId);

    return (
      <div className={`${bgColor} rounded-xl border ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full p-6 text-left flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className={`text-2xl ${isCompleted ? 'text-green-600' : textColor}`}>
              {isCompleted ? '✅' : icon}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor} group-hover:underline`}>
                {title}
              </h3>
              {isCompleted && (
                <p className="text-sm text-green-600 font-medium">Completed</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                ✓ Done
              </span>
            )}
            <span className={`text-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200">
            {Array.isArray(content) ? (
              <div className="space-y-4 mt-4">
                {content.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    {typeof item === 'string' ? (
                      <p className="text-gray-700 leading-relaxed">{item}</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(item).map(([key, value]) => (
                          <div key={key} className="flex items-start space-x-2">
                            <span className="font-medium text-gray-800 capitalize min-w-0 flex-shrink-0">{key}:</span>
                            <span className="text-gray-700 flex-1">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                {renderFormattedText(content)}
              </div>
            )}
            
            {!isCompleted && (
              <button
                onClick={() => markSectionComplete(sectionId)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                ✓ Mark as Complete
              </button>
            )}
            {isCompleted && (
              <button
                onClick={() => markSectionIncomplete(sectionId)}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                ↺ Mark as Incomplete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const getProgressPercentage = () => {
    const totalSections = 9; // objectives, description, keyPoints, examples, misconceptions, studyTips, examTips, practice, related
    const completedCount = completedSections.size;
    return Math.round((completedCount / totalSections) * 100);
  };

  // Enhanced rendering functions for different content formats
  const renderTipsAsTable = (tips, title, icon, bgColor, textColor) => {
    if (!tips || tips.length === 0) return null;

    return (
      <div className={`${bgColor} rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{icon}</div>
            <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Tip</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Category</th>
                </tr>
              </thead>
              <tbody>
                {tips.map((tip, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600 border-b border-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                      <div className="prose prose-sm max-w-none">
                        {renderFormattedText(tip)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                      {index < 3 ? 'Essential' : index < 6 ? 'Important' : 'Helpful'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTipsAsCards = (tips, title, icon, bgColor, textColor) => {
    if (!tips || tips.length === 0) return null;

    return (
      <div className={`${bgColor} rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{icon}</div>
            <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="prose prose-sm max-w-none">
                      {renderFormattedText(tip)}
                    </div>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        index < 3 ? 'bg-red-100 text-red-700' : 
                        index < 6 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {index < 3 ? 'Essential' : index < 6 ? 'Important' : 'Helpful'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTipsAsSteps = (tips, title, icon, bgColor, textColor) => {
    if (!tips || tips.length === 0) return null;

    return (
      <div className={`${bgColor} rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{icon}</div>
            <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
          </div>
          
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    {renderFormattedText(tip)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced rendering functions for different content types
  const renderKeyPointsAsTable = (keyPoints, title, icon, bgColor, textColor) => {
    if (!keyPoints || keyPoints.length === 0) return null;

    return (
      <div className={`${bgColor} rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{icon}</div>
            <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Key Point</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Category</th>
                </tr>
              </thead>
              <tbody>
                {keyPoints.map((point, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600 border-b border-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                      <div className="prose prose-sm max-w-none">
                        {renderFormattedText(point)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                      {index < 2 ? 'Core' : index < 4 ? 'Important' : 'Supporting'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderExamplesAsCards = (examples, title, icon, bgColor, textColor) => {
    if (!examples || examples.length === 0) return null;

    return (
      <div className={`${bgColor} rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{icon}</div>
            <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-2">{example.title}</h4>
                    <p className="text-gray-700 leading-relaxed text-sm">{example.description}</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Example
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📖 {topic?.title}</h2>
            <p className="text-gray-600">Loading detailed content...</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Topics
          </button>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading comprehensive topic content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📖 {topic?.title}</h2>
            <p className="text-gray-600">Error loading content</p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Topics
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg mb-2">❌ {error}</div>
          <button
            onClick={loadTopicContent}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📖</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{topic?.title}</h2>
              <p className="text-gray-600">Comprehensive topic content and study materials</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Topics
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Learning Progress</span>
            <span className="text-sm font-medium text-blue-600">{getProgressPercentage()}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-blue-600 text-lg font-bold">{topic?.estimatedStudyTime || 0}</div>
            <div className="text-xs text-gray-600">Minutes</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-green-600 text-lg font-bold">{topic?.keyConcepts?.length || 0}</div>
            <div className="text-xs text-gray-600">Concepts</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-purple-600 text-lg font-bold">{topic?.difficultyLevel || 'Medium'}</div>
            <div className="text-xs text-gray-600">Difficulty</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-orange-600 text-lg font-bold">{topic?.priority || 'Normal'}</div>
            <div className="text-xs text-gray-600">Priority</div>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      {topic?.learningObjectives && topic.learningObjectives.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center">
            <span className="mr-2">🎯</span>
            Learning Objectives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topic.learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-start space-x-2 bg-white rounded-lg p-3 border border-green-200">
                <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                <span className="text-gray-700 text-sm">{objective}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Content */}
      {topicContent && (
        <div className="space-y-4">
          {/* Detailed Description */}
          {renderContentSection(
            'description',
            'Detailed Explanation',
            topicContent.detailedDescription,
            '📖',
            'bg-blue-50',
            'text-blue-800',
            'border-blue-200'
          )}

          {/* Key Points */}
          {renderContentSection(
            'keyPoints',
            'Key Points',
            topicContent.keyPoints,
            '🎯',
            'bg-green-50',
            'text-green-800',
            'border-green-200'
          )}

          {/* Examples */}
          {renderContentSection(
            'examples',
            'Examples',
            topicContent.examples,
            '💡',
            'bg-green-50',
            'text-green-800',
            'border-green-200'
          )}

          {/* Common Misconceptions */}
          {topicContent.commonMisconceptions && topicContent.commonMisconceptions.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => toggleSection('misconceptions')}
                className="w-full p-6 text-left flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl text-red-600">⚠️</div>
                  <div>
                    <h3 className="font-bold text-lg text-red-800 group-hover:underline">Common Misconceptions</h3>
                    <p className="text-sm text-red-600">{topicContent.commonMisconceptions.length} misconceptions to avoid</p>
                  </div>
                </div>
                <span className={`text-lg transition-transform duration-200 ${expandedSections.has('misconceptions') ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {expandedSections.has('misconceptions') && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  <div className="space-y-4 mt-4">
                    {topicContent.commonMisconceptions.map((misconception, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-start space-x-3">
                          <span className="text-red-500 mt-1 flex-shrink-0">❌</span>
                          <div className="flex-1">
                            <div className="prose prose-sm max-w-none mb-2">
                              {renderFormattedText(misconception.misconception)}
                            </div>
                            <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium text-green-700">Correction:</span>
                                <div className="prose prose-sm max-w-none mt-1">
                                  {renderFormattedText(misconception.correction)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!completedSections.has('misconceptions') && (
                    <button
                      onClick={() => markSectionComplete('misconceptions')}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Mark as Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tips Format Selector */}
          {(topicContent.studyTips || topicContent.examTips) && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Tips Display Format</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTipFormat('cards')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      tipFormat === 'cards' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setTipFormat('table')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      tipFormat === 'table' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setTipFormat('steps')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      tipFormat === 'steps' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Steps
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Study Tips */}
          {renderContentSection(
            'studyTips',
            'Study Tips',
            topicContent.studyTips,
            '📚',
            'bg-purple-50',
            'text-purple-800',
            'border-purple-200'
          )}

          {/* Exam Tips */}
          {renderContentSection(
            'examTips',
            'Exam Tips',
            topicContent.examTips,
            '📝',
            'bg-orange-50',
            'text-orange-800',
            'border-orange-200'
          )}

          {/* Practice Questions */}
          {topicContent.practiceQuestions && topicContent.practiceQuestions.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => toggleSection('practice')}
                className="w-full p-6 text-left flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl text-yellow-600">🧠</div>
                  <div>
                    <h3 className="font-bold text-lg text-yellow-800 group-hover:underline">Practice Questions</h3>
                    <p className="text-sm text-yellow-600">{topicContent.practiceQuestions.length} questions to test your knowledge</p>
                  </div>
                </div>
                <span className={`text-lg transition-transform duration-200 ${expandedSections.has('practice') ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {expandedSections.has('practice') && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  <div className="space-y-4 mt-4">
                    {topicContent.practiceQuestions.map((question, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="prose prose-sm max-w-none mb-3">
                          {renderFormattedText(question.question)}
                        </div>
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium text-green-700">Answer:</span>
                            <div className="prose prose-sm max-w-none mt-1">
                              {renderFormattedText(question.answer)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-blue-700">Explanation:</span>
                            <div className="prose prose-sm max-w-none mt-1">
                              {renderFormattedText(question.explanation)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!completedSections.has('practice') && (
                    <button
                      onClick={() => markSectionComplete('practice')}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Mark as Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Related Concepts */}
          {topicContent.relatedConcepts && topicContent.relatedConcepts.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => toggleSection('related')}
                className="w-full p-6 text-left flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl text-indigo-600">🔗</div>
                  <div>
                    <h3 className="font-bold text-lg text-indigo-800 group-hover:underline">Related Concepts</h3>
                    <p className="text-sm text-indigo-600">{topicContent.relatedConcepts.length} connected topics</p>
                  </div>
                </div>
                <span className={`text-lg transition-transform duration-200 ${expandedSections.has('related') ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {expandedSections.has('related') && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  <div className="space-y-4 mt-4">
                    {topicContent.relatedConcepts.map((concept, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <h4 className="font-semibold text-indigo-800 mb-2">{concept.concept}</h4>
                        <div className="prose prose-sm max-w-none">
                          {renderFormattedText(concept.relationship)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!completedSections.has('related') && (
                    <button
                      onClick={() => markSectionComplete('related')}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Mark as Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ← Back to Topics
          </button>
          <button
            onClick={() => onStartPractice && onStartPractice(topic.id)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            🎯 Start Practice Session
          </button>
        </div>
        
        {/* Progress Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Learning Progress: {completedSections.size} of 9 sections completed</span>
            <span className="font-medium text-blue-600">{getProgressPercentage()}% Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
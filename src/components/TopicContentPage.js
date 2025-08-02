'use client';
import React, { useState, useEffect } from 'react';
import { topicContentManager } from '../utils/topicContentManager';

export default function TopicContentPage({ topic, onBack, content, apiKey, onStartPractice }) {
  const [topicContent, setTopicContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
              level === 1 ? 'text-3xl' : 
              level === 2 ? 'text-2xl' : 
              level === 3 ? 'text-xl' : 'text-lg'
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
                  return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </div>
          );
        }
        
        // Handle lists
        if (line.match(/^[-*]\s/)) {
          return <li key={index} className="ml-6 mb-1">{line.replace(/^[-*]\s/, '')}</li>;
        }
        
        // Handle numbered lists
        if (line.match(/^\d+\.\s/)) {
          return <li key={index} className="ml-6 mb-1">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        
        // Regular text
        if (line.trim()) {
          return <p key={index} className="mb-3 leading-relaxed">{line}</p>;
        }
        
        return <br key={index} />;
      });
  };

  const renderContentSection = (title, content, icon, bgColor = 'bg-blue-50', textColor = 'text-blue-800') => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;

    return (
      <div className={`${bgColor} rounded-lg p-6 mb-6`}>
        <h3 className={`font-bold text-lg mb-4 ${textColor} flex items-center`}>
          <span className="mr-2">{icon}</span>
          {title}
        </h3>
        {Array.isArray(content) ? (
          <div className="space-y-3">
            {content.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                {typeof item === 'string' ? (
                  <p className="text-gray-700">{item}</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(item).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-gray-800 capitalize">{key}: </span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            {renderFormattedText(content)}
          </div>
        )}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📖 {topic?.title}</h2>
          <p className="text-gray-600">Comprehensive topic content and study materials</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Topics
        </button>
      </div>

      {/* Topic Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4 text-blue-800">📋 Topic Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700 mb-4">{topic?.description}</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">⏱️</span>
                <span className="text-gray-700">Estimated Study Time: {topic?.estimatedStudyTime} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📚</span>
                <span className="text-gray-700">Key Concepts: {topic?.keyConcepts?.length || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🎯</span>
                <span className="text-gray-700">Difficulty: {topic?.difficultyLevel}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">⚡</span>
                <span className="text-gray-700">Priority: {topic?.priority}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Learning Objectives:</h4>
            <ul className="space-y-1">
              {topic?.learningObjectives?.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Content */}
      {topicContent && (
        <div className="space-y-6">
          {/* Detailed Description */}
          {renderContentSection(
            'Detailed Explanation',
            topicContent.detailedDescription,
            '📖',
            'bg-blue-50',
            'text-blue-800'
          )}

          {/* Key Points */}
          {renderContentSection(
            'Key Points',
            topicContent.keyPoints,
            '🎯',
            'bg-green-50',
            'text-green-800'
          )}

          {/* Examples */}
          {topicContent.examples && topicContent.examples.length > 0 && (
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center">
                <span className="mr-2">💡</span>
                Examples
              </h3>
              <div className="space-y-4">
                {topicContent.examples.map((example, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-green-800 mb-2">{example.title}</h4>
                    <p className="text-gray-700">{example.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Misconceptions */}
          {topicContent.commonMisconceptions && topicContent.commonMisconceptions.length > 0 && (
            <div className="bg-red-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 text-red-800 flex items-center">
                <span className="mr-2">⚠️</span>
                Common Misconceptions
              </h3>
              <div className="space-y-4">
                {topicContent.commonMisconceptions.map((misconception, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">❌</span>
                      <div className="flex-1">
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
          {renderContentSection(
            'Study Tips',
            topicContent.studyTips,
            '📚',
            'bg-purple-50',
            'text-purple-800'
          )}

          {/* Exam Tips */}
          {renderContentSection(
            'Exam Tips',
            topicContent.examTips,
            '📝',
            'bg-orange-50',
            'text-orange-800'
          )}

          {/* Practice Questions */}
          {topicContent.practiceQuestions && topicContent.practiceQuestions.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 text-yellow-800 flex items-center">
                <span className="mr-2">🧠</span>
                Practice Questions
              </h3>
              <div className="space-y-4">
                {topicContent.practiceQuestions.map((question, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="font-medium text-gray-800 mb-3">{question.question}</p>
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
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

          {/* Related Concepts */}
          {topicContent.relatedConcepts && topicContent.relatedConcepts.length > 0 && (
            <div className="bg-indigo-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 text-indigo-800 flex items-center">
                <span className="mr-2">🔗</span>
                Related Concepts
              </h3>
              <div className="space-y-3">
                {topicContent.relatedConcepts.map((concept, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-indigo-800 mb-2">{concept.concept}</h4>
                    <p className="text-gray-700">{concept.relationship}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Topics
        </button>
        <button
          onClick={() => onStartPractice && onStartPractice(topic.id)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🎯 Start Practice
        </button>
      </div>
    </div>
  );
} 
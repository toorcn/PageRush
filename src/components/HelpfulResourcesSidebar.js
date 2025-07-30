'use client';
import React, { useState } from 'react';

export default function HelpfulResourcesSidebar({ history, performanceSummaries, onLoadFromHistory }) {
  const [expandedFeatures, setExpandedFeatures] = useState(new Set());
  const [showAllResources, setShowAllResources] = useState(false);

  // Get resources by feature type
  const getResourcesByFeature = (feature) => {
    return history.filter(item => item.feature === feature);
  };

  const studyGuides = getResourcesByFeature('studyGuide');
  const flashcards = getResourcesByFeature('flashcards');
  const quizzes = getResourcesByFeature('quiz');
  const exams = getResourcesByFeature('exam');

  const toggleFeature = (feature) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(feature)) {
      newExpanded.delete(feature);
    } else {
      newExpanded.add(feature);
    }
    setExpandedFeatures(newExpanded);
  };

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'studyGuide': return '📚';
      case 'flashcards': return '🗂️';
      case 'quiz': return '❓';
      case 'exam': return '📝';
      default: return '📄';
    }
  };

  const getFeatureColor = (feature) => {
    switch (feature) {
      case 'studyGuide': return 'text-blue-700';
      case 'flashcards': return 'text-green-700';
      case 'quiz': return 'text-purple-700';
      case 'exam': return 'text-orange-700';
      default: return 'text-gray-700';
    }
  };

  const getFeatureBorderColor = (feature) => {
    switch (feature) {
      case 'studyGuide': return 'border-blue-200';
      case 'flashcards': return 'border-green-200';
      case 'quiz': return 'border-purple-200';
      case 'exam': return 'border-orange-200';
      default: return 'border-gray-200';
    }
  };

  const renderResourceItem = (item, index) => {
    const preview = item.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 120) || 'No preview available.';
    const date = new Date(item.timestamp).toLocaleDateString();
    
    return (
      <div key={item.id} className="border-l-2 border-gray-200 pl-3 py-2 hover:bg-gray-50 rounded-r transition-colors">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">{date}</span>
            {item.questionCount && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {item.questionCount} Q
              </span>
            )}
          </div>
          <button
            onClick={() => onLoadFromHistory(item)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            Load
          </button>
        </div>
        <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {preview}
        </div>
      </div>
    );
  };

  const renderFeatureSection = (feature, resources, title) => {
    if (resources.length === 0) return null;
    
    const isExpanded = expandedFeatures.has(feature);
    const displayCount = isExpanded ? resources.length : 1;
    const displayResources = resources.slice(0, displayCount);
    
    return (
      <div className={`border rounded-lg ${getFeatureBorderColor(feature)} overflow-hidden`}>
        <button
          onClick={() => toggleFeature(feature)}
          className="w-full p-3 bg-gray-50 hover:bg-gray-100 text-left flex items-center justify-between transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getFeatureIcon(feature)}</span>
            <div>
              <span className={`font-semibold ${getFeatureColor(feature)}`}>{title}</span>
              <span className="text-xs text-gray-500 ml-2">({resources.length})</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {resources.length > 1 && (
              <span className="text-xs text-gray-500">
                {isExpanded ? 'Show Less' : `Show ${resources.length - 1} More`}
              </span>
            )}
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>
        
        <div className="bg-white">
          {displayResources.map((item, index) => renderResourceItem(item, index))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">🧰</span>
          Study Resources
        </h3>
        <button
          onClick={() => setShowAllResources(!showAllResources)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          {showAllResources ? 'Show Recent' : 'Show All'}
        </button>
      </div>
      
      <div className="space-y-3">
        {renderFeatureSection('studyGuide', studyGuides, 'Study Guides')}
        {renderFeatureSection('flashcards', flashcards, 'Flashcards')}
        {renderFeatureSection('quiz', quizzes, 'Quizzes')}
        {renderFeatureSection('exam', exams, 'Exams')}
        
        {studyGuides.length === 0 && flashcards.length === 0 && quizzes.length === 0 && exams.length === 0 && (
          <div className="text-center py-6">
            <div className="text-gray-400 text-4xl mb-2">📚</div>
            <div className="text-sm text-gray-500">No resources generated yet.</div>
            <div className="text-xs text-gray-400 mt-1">Generate your first study material to see it here!</div>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';
import React, { useState } from 'react';
import LottieLoader from './LottieLoader';

export default function HelpfulResourcesSidebar({ history, performanceSummaries, onLoadFromHistory }) {
  const [expandedFeatures, setExpandedFeatures] = useState(new Set(['studyGuide', 'flashcards'])); // Default expanded
  const [showAllResources, setShowAllResources] = useState(false);
  const [loadingItem, setLoadingItem] = useState(null);

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
      case 'flashcards': return '🃏';
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

  const getFeatureBgColor = (feature) => {
    switch (feature) {
      case 'studyGuide': return 'bg-blue-50';
      case 'flashcards': return 'bg-green-50';
      case 'quiz': return 'bg-purple-50';
      case 'exam': return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  const handleLoadFromHistory = async (item) => {
    setLoadingItem(item.id);
    try {
      await onLoadFromHistory(item);
    } catch (error) {
      console.error('Error loading from history:', error);
    } finally {
      setLoadingItem(null);
    }
  };

  const renderResourceItem = (item, index) => {
    const preview = item.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 120) || 'No preview available.';
    const date = new Date(item.timestamp).toLocaleDateString();
    const isLoading = loadingItem === item.id;
    
    return (
      <div key={item.id} className={`border-l-2 ${getFeatureBorderColor(item.feature)} pl-3 py-3 hover:bg-gray-50 rounded-r transition-all duration-200 group ${isLoading ? 'opacity-75' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">{date}</span>
            {item.questionCount && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                {item.questionCount} Q
              </span>
            )}
            {item.topics && item.topics.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                {item.topics.length} topics
              </span>
            )}
          </div>
          <button
            onClick={() => handleLoadFromHistory(item)}
            disabled={isLoading}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-200 ${
              isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center space-x-1">
                <LottieLoader size="small" text="" />
                <span>Loading...</span>
              </span>
            ) : (
              'Load'
            )}
          </button>
        </div>
        <div className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-2">
          {preview}
        </div>
        <div className="text-xs text-gray-400">
          {item.documentName}
        </div>
      </div>
    );
  };

  const renderFeatureSection = (feature, resources, title) => {
    const isExpanded = expandedFeatures.has(feature);
    const displayResources = showAllResources ? resources : resources.slice(0, 3);
    const hasMore = resources.length > 3 && !showAllResources;

    return (
      <div className={`${getFeatureBgColor(feature)} rounded-lg border ${getFeatureBorderColor(feature)} overflow-hidden`}>
        <button
          onClick={() => toggleFeature(feature)}
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{getFeatureIcon(feature)}</span>
            <div>
              <h4 className={`font-semibold ${getFeatureColor(feature)}`}>{title}</h4>
              <p className="text-xs text-gray-500">{resources.length} resource{resources.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {resources.length > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                getFeatureColor(feature).replace('text-', 'bg-').replace('-700', '-100') + ' ' + getFeatureColor(feature)
              }`}>
                {resources.length}
              </span>
            )}
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-3 space-y-2">
            {resources.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-gray-400 text-2xl mb-2">{getFeatureIcon(feature)}</div>
                <p className="text-xs text-gray-500">No {title.toLowerCase()} yet</p>
                <p className="text-xs text-gray-400">Generate your first one to see it here!</p>
              </div>
            ) : (
              <>
                {displayResources.map(renderResourceItem)}
                {hasMore && (
                  <button
                    onClick={() => setShowAllResources(true)}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-white/50 rounded transition-colors"
                  >
                    Show {resources.length - 3} more...
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const totalResources = studyGuides.length + flashcards.length + quizzes.length + exams.length;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">🧰</span>
          Study Resources
          {totalResources > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {totalResources}
            </span>
          )}
        </h3>
        {/* {totalResources > 3 && (
          <button
            onClick={() => setShowAllResources(!showAllResources)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {showAllResources ? 'Show Recent' : 'Show All'}
          </button>
        )} */}
      </div>
      
      <div className="space-y-3">
        {renderFeatureSection('studyGuide', studyGuides, 'Study Guides')}
        {renderFeatureSection('flashcards', flashcards, 'Flashcards')}
        {renderFeatureSection('quiz', quizzes, 'Quizzes')}
        {renderFeatureSection('exam', exams, 'Exams')}
        
        {totalResources === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📚</div>
            <div className="text-sm text-gray-500 font-medium mb-1">No resources generated yet</div>
            <div className="text-xs text-gray-400">Generate your first study material to see it here!</div>
            <div className="mt-3 text-xs text-gray-400">
              💡 Try uploading a document and creating flashcards, quizzes, or study guides
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
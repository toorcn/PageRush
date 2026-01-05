'use client';
import { useState } from 'react';
import { BookOpen, Layers, HelpCircle, ClipboardList, FileText, ChevronDown, Briefcase, Lightbulb } from 'lucide-react';
import LottieLoader from './LottieLoader';

const FEATURE_CONFIG = {
  exam: { Icon: ClipboardList, color: 'amber', label: 'Exams' },
  quiz: { Icon: HelpCircle, color: 'violet', label: 'Quizzes' },
  flashcards: { Icon: Layers, color: 'emerald', label: 'Flashcards' },
  studyGuide: { Icon: BookOpen, color: 'indigo', label: 'Study Guides' },
};

export default function HelpfulResourcesSidebar({ history, performanceSummaries, onLoadFromHistory }) {
  const [expandedFeatures, setExpandedFeatures] = useState(new Set(['studyGuide', 'flashcards']));
  const [showAllResources, setShowAllResources] = useState(false);
  const [loadingItem, setLoadingItem] = useState(null);

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
    const config = FEATURE_CONFIG[feature];
    if (!config) return <FileText className="w-5 h-5" />;
    const { Icon } = config;
    return <Icon className="w-5 h-5" />;
  };

  const getFeatureColor = (feature) => {
    const colors = {
      studyGuide: 'text-indigo-700',
      flashcards: 'text-emerald-700',
      quiz: 'text-violet-700',
      exam: 'text-amber-700',
    };
    return colors[feature] || 'text-gray-700';
  };

  const getFeatureBorderColor = (feature) => {
    const colors = {
      studyGuide: 'border-indigo-200',
      flashcards: 'border-emerald-200',
      quiz: 'border-violet-200',
      exam: 'border-amber-200',
    };
    return colors[feature] || 'border-gray-200';
  };

  const getFeatureBgColor = (feature) => {
    const colors = {
      studyGuide: 'bg-indigo-50',
      flashcards: 'bg-emerald-50',
      quiz: 'bg-violet-50',
      exam: 'bg-amber-50',
    };
    return colors[feature] || 'bg-gray-50';
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

  const renderResourceItem = (item) => {
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
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
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
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800'
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
      <div className={`${getFeatureBgColor(feature)} rounded-xl border ${getFeatureBorderColor(feature)} overflow-hidden`}>
        <button
          onClick={() => toggleFeature(feature)}
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className={getFeatureColor(feature)}>{getFeatureIcon(feature)}</span>
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
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-3 space-y-2">
            {resources.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-gray-300 mb-2">{getFeatureIcon(feature)}</div>
                <p className="text-xs text-gray-500">No {title.toLowerCase()} yet</p>
                <p className="text-xs text-gray-400">Generate your first one to see it here!</p>
              </div>
            ) : (
              <>
                {displayResources.map(renderResourceItem)}
                {hasMore && (
                  <button
                    onClick={() => setShowAllResources(true)}
                    className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-medium py-2 hover:bg-white/50 rounded transition-colors"
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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-500" />
          Study Resources
          {totalResources > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
              {totalResources}
            </span>
          )}
        </h3>
      </div>
      
      <div className="space-y-3">
        {renderFeatureSection('studyGuide', studyGuides, 'Study Guides')}
        {renderFeatureSection('flashcards', flashcards, 'Flashcards')}
        {renderFeatureSection('quiz', quizzes, 'Quizzes')}
        {renderFeatureSection('exam', exams, 'Exams')}
        
        {totalResources === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <div className="text-sm text-gray-500 font-medium mb-1">No resources generated yet</div>
            <div className="text-xs text-gray-400">Generate your first study material to see it here!</div>
            <div className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Try uploading a document and creating flashcards, quizzes, or study guides
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

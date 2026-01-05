'use client';
import { useState, useMemo } from 'react';
import { BookOpen, Layers, HelpCircle, ClipboardList, FileText, X, ChevronDown, ChevronRight, Target, BarChart3, Check, XCircle, Library, Search, Filter, Trash2, MoreHorizontal, TrendingUp, ThumbsUp, AlertCircle, RefreshCw } from 'lucide-react';

// Order: exam, quiz, flashcards, studyGuide
const FEATURE_ORDER = ['exam', 'quiz', 'flashcards', 'studyGuide'];

const FEATURE_CONFIG = {
  exam: { Icon: ClipboardList, color: 'amber', label: 'Exams' },
  quiz: { Icon: HelpCircle, color: 'violet', label: 'Quizzes' },
  flashcards: { Icon: Layers, color: 'emerald', label: 'Flashcards' },
  studyGuide: { Icon: BookOpen, color: 'indigo', label: 'Study Guides' },
};

export default function HistoryPanel({ history, performanceSummaries, onLoadFromHistory, onDeleteHistoryItem, onClearHistory, onClose }) {
  const [activeTab, setActiveTab] = useState('library');
  const [expandedExam, setExpandedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedFeatures, setExpandedFeatures] = useState(new Set(['exam', 'quiz', 'flashcards', 'studyGuide']));
  const [fullyExpandedFeatures, setFullyExpandedFeatures] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showActions, setShowActions] = useState(false);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getFeatureColor = (feature) => {
    const colors = {
      studyGuide: 'text-indigo-600 bg-indigo-100',
      flashcards: 'text-emerald-600 bg-emerald-100',
      quiz: 'text-violet-600 bg-violet-100',
      exam: 'text-amber-600 bg-amber-100',
    };
    return colors[feature] || 'text-gray-600 bg-gray-100';
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const toggleFeature = (feature) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(feature)) {
      newExpanded.delete(feature);
      const newFullyExpanded = new Set(fullyExpandedFeatures);
      newFullyExpanded.delete(feature);
      setFullyExpandedFeatures(newFullyExpanded);
    } else {
      newExpanded.add(feature);
    }
    setExpandedFeatures(newExpanded);
  };

  const toggleShowAll = (feature) => {
    const newFullyExpanded = new Set(fullyExpandedFeatures);
    if (newFullyExpanded.has(feature)) {
      newFullyExpanded.delete(feature);
    } else {
      newFullyExpanded.add(feature);
    }
    setFullyExpandedFeatures(newFullyExpanded);
  };

  const toggleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredHistory.map(item => item.id));
    setSelectedItems(allIds);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const deleteSelected = () => {
    if (selectedItems.size === 0) return;
    
    if (selectedItems.size === history.length) {
      // If all items selected, use clear all
      onClearHistory?.();
    } else if (onDeleteHistoryItem) {
      // Delete individual items
      selectedItems.forEach(id => onDeleteHistoryItem(id));
    }
    setSelectedItems(new Set());
    setShowActions(false);
  };

  // Filter and group history items
  const filteredHistory = useMemo(() => {
    let items = [...history];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.documentName?.toLowerCase().includes(query) ||
        item.text?.toLowerCase().includes(query) ||
        item.topics?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (filterType !== 'all') {
      items = items.filter(item => item.feature === filterType);
    }
    
    return items;
  }, [history, searchQuery, filterType]);

  // Group by feature type in specified order
  const groupedHistory = useMemo(() => {
    const groups = {
      exam: [],
      quiz: [],
      flashcards: [],
      studyGuide: [],
    };
    
    filteredHistory.forEach(item => {
      if (groups[item.feature]) {
        groups[item.feature].push(item);
      }
    });
    
    return groups;
  }, [filteredHistory]);

  const renderResourceItem = (item) => {
    const preview = item.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 100) || 'No preview available.';
    const isSelected = selectedItems.has(item.id);
    
    return (
      <div key={item.id} className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors group ${isSelected ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-100'}`}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectItem(item.id)}
            className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 font-medium">{formatDate(item.timestamp)}</span>
              {item.questionCount && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {item.questionCount} Q
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-800 truncate mb-1">{item.documentName}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{preview}</p>
            {item.topics && item.topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.topics.slice(0, 3).map((topic, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                    {topic}
                  </span>
                ))}
                {item.topics.length > 3 && (
                  <span className="text-xs text-gray-400">+{item.topics.length - 3} more</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => onLoadFromHistory(item)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium flex-shrink-0"
          >
            Load
          </button>
        </div>
      </div>
    );
  };

  const renderFeatureSection = (feature, items) => {
    const config = FEATURE_CONFIG[feature];
    if (!config) return null;
    
    const isExpanded = expandedFeatures.has(feature);
    const isFullyExpanded = fullyExpandedFeatures.has(feature);
    const { Icon, label } = config;
    
    const displayItems = isFullyExpanded ? items : items.slice(0, 3);
    const hasMore = items.length > 3;
    const remainingCount = items.length - 3;
    
    return (
      <div key={feature} className="border border-gray-100 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleFeature(feature)}
          className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
            isExpanded ? 'border-b border-gray-100' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getFeatureColor(feature)}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{label}</h4>
              <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeatureColor(feature)}`}>
                {items.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-3 space-y-2 bg-gray-50/50">
            {items.length === 0 ? (
              <div className="text-center py-6">
                <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No {label.toLowerCase()} yet</p>
                <p className="text-xs text-gray-400">Generate some to see them here</p>
              </div>
            ) : (
              <>
                {displayItems.map(item => renderResourceItem(item))}
                {hasMore && !isFullyExpanded && (
                  <button
                    onClick={() => toggleShowAll(feature)}
                    className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show {remainingCount} more
                  </button>
                )}
                {hasMore && isFullyExpanded && (
                  <button
                    onClick={() => toggleShowAll(feature)}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronDown className="w-4 h-4 rotate-180" />
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const totalItems = history.length;
  const hasSelection = selectedItems.size > 0;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-600" />
            Study Library
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'library' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Study Materials ({totalItems})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'performance' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance ({performanceSummaries.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'library' && (
            <div className="p-5">
              {/* Search, Filter, and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by document, topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Types</option>
                    <option value="exam">Exams</option>
                    <option value="quiz">Quizzes</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="studyGuide">Study Guides</option>
                  </select>
                  
                  {/* Actions dropdown */}
                  {totalItems > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Actions"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      {showActions && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => { selectAll(); setShowActions(false); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Select All
                          </button>
                          {hasSelection && (
                            <>
                              <button
                                onClick={() => { clearSelection(); setShowActions(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Clear Selection
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={deleteSelected}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected ({selectedItems.size})
                              </button>
                            </>
                          )}
                          <hr className="my-1" />
                          <button
                            onClick={() => { onClearHistory?.(); setShowActions(false); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selection bar */}
              {hasSelection && (
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 mb-4">
                  <span className="text-sm text-indigo-700 font-medium">
                    {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearSelection}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Grouped Content - in specified order */}
              {filterType === 'all' ? (
                <div className="space-y-3">
                  {FEATURE_ORDER.map(feature => 
                    renderFeatureSection(feature, groupedHistory[feature] || [])
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No matching items found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  ) : (
                    filteredHistory.map(item => renderResourceItem(item))
                  )}
                </div>
              )}

              {totalItems === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Your study library is empty</p>
                  <p className="text-sm">Generate study materials to build your library</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="p-5 space-y-4">
              {performanceSummaries.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No performance data yet</p>
                  <p className="text-sm">Complete quizzes and exams to track your progress</p>
                </div>
              ) : (
                <>
                  {/* Overall Stats Summary */}
                  {performanceSummaries.length > 1 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        Overall Progress
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">
                            {Math.round(performanceSummaries.reduce((acc, s) => acc + (s.percentage || (s.score/s.total)*100), 0) / performanceSummaries.length)}%
                          </div>
                          <div className="text-xs text-gray-500">Avg Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {performanceSummaries.reduce((acc, s) => acc + s.score, 0)}
                          </div>
                          <div className="text-xs text-gray-500">Total Correct</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-violet-600">
                            {performanceSummaries.length}
                          </div>
                          <div className="text-xs text-gray-500">Exams Taken</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Individual Performance Cards */}
                  {performanceSummaries.map((summary) => {
                    const percentage = summary.percentage || Math.round((summary.score/summary.total)*100);
                    const correctCount = summary.details?.filter(d => d.isCorrect).length || summary.score;
                    const incorrectCount = (summary.details?.length || summary.total) - correctCount;
                    
                    // Analyze question types if available
                    const questionTypeStats = summary.questions?.reduce((acc, q) => {
                      const type = q.type || 'Unknown';
                      if (!acc[type]) acc[type] = { correct: 0, total: 0 };
                      acc[type].total++;
                      if (q.isCorrect) acc[type].correct++;
                      return acc;
                    }, {}) || {};

                    // Find weak areas (types with < 70% correct)
                    const weakAreas = Object.entries(questionTypeStats)
                      .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.7)
                      .map(([type]) => type);

                    // Find strong areas (types with >= 80% correct)
                    const strongAreas = Object.entries(questionTypeStats)
                      .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) >= 0.8)
                      .map(([type]) => type);

                    return (
                      <div key={summary.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        {/* Header with score */}
                        <div className="p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {summary.examMode === 'practice' ? (
                                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Target className="w-4 h-4 text-indigo-600" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <ClipboardList className="w-4 h-4 text-amber-600" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-medium text-gray-800">
                                    {summary.examMode === 'practice' ? 'Practice Exam' : 'Exam'}
                                  </h3>
                                  <p className="text-xs text-gray-400">{formatDate(summary.timestamp)}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{summary.documentName}</p>
                            </div>
                            
                            {/* Score Circle */}
                            <div className="relative w-16 h-16">
                              <svg className="w-16 h-16 transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                <circle 
                                  cx="32" cy="32" r="28" 
                                  stroke={percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'}
                                  strokeWidth="4" 
                                  fill="none"
                                  strokeDasharray={`${(percentage / 100) * 176} 176`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-lg font-bold ${getPerformanceColor(percentage)}`}>{percentage}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          <div className="flex items-center gap-4 text-xs mb-3">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check className="w-3 h-3" /> {correctCount} correct
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="w-3 h-3" /> {incorrectCount} incorrect
                            </span>
                            <span className="text-gray-400">
                              {summary.total} questions
                            </span>
                          </div>

                          {/* Topics Tags */}
                          {summary.topics && summary.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {summary.topics.slice(0, 4).map((topic, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  {topic}
                                </span>
                              ))}
                              {summary.topics.length > 4 && (
                                <span className="text-xs text-gray-400">+{summary.topics.length - 4} more</span>
                              )}
                            </div>
                          )}

                          {/* Question Types */}
                          {summary.questionTypes && summary.questionTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {summary.questionTypes.map((type, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded text-xs">
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Strengths & Weaknesses */}
                          {(strongAreas.length > 0 || weakAreas.length > 0) && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {strongAreas.length > 0 && (
                                <div className="bg-emerald-50 rounded-lg p-2">
                                  <div className="text-xs font-medium text-emerald-700 mb-1 flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" /> Strengths
                                  </div>
                                  <div className="text-xs text-emerald-600">
                                    {strongAreas.join(', ')}
                                  </div>
                                </div>
                              )}
                              {weakAreas.length > 0 && (
                                <div className="bg-amber-50 rounded-lg p-2">
                                  <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Needs Work
                                  </div>
                                  <div className="text-xs text-amber-600">
                                    {weakAreas.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {summary.questions && (
                              <button
                                onClick={() => setExpandedExam(expandedExam === summary.id ? null : summary.id)}
                                className="flex-1 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                {expandedExam === summary.id ? (
                                  <><ChevronDown className="w-4 h-4" /> Hide Details</>
                                ) : (
                                  <><ChevronRight className="w-4 h-4" /> Review Answers</>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // Find matching history item and load it for retake
                                const historyItem = history.find(h => 
                                  h.documentName === summary.documentName && 
                                  (h.feature === 'exam' || h.feature === 'quiz')
                                );
                                if (historyItem) {
                                  onLoadFromHistory(historyItem);
                                  onClose();
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Retake
                            </button>
                          </div>
                        </div>

                        {/* Expanded Question Details */}
                        {expandedExam === summary.id && summary.questions && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Question Breakdown</h4>
                            {summary.questions.map((question, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 space-y-2 border border-gray-100">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                        question.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      {question.type && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                          {question.type}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-800">{question.question}</p>
                                  </div>
                                  <div className={`ml-2 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                    question.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {question.isCorrect ? (
                                      <><Check className="w-3 h-3" /> Correct</>
                                    ) : (
                                      <><XCircle className="w-3 h-3" /> Incorrect</>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div className={`p-2 rounded border ${question.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="font-medium text-gray-600 mb-1">Your Answer:</div>
                                    <div className="text-gray-800">{question.userAnswer || 'No answer'}</div>
                                  </div>
                                  {!question.isCorrect && (
                                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                      <div className="font-medium text-gray-600 mb-1">Correct Answer:</div>
                                      <div className="text-emerald-700">{question.answer}</div>
                                    </div>
                                  )}
                                </div>
                                
                                {question.explanation && (
                                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border-l-2 border-blue-400">
                                    <span className="font-medium">💡 </span>{question.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {activeTab === 'library' 
              ? `${totalItems} study material${totalItems !== 1 ? 's' : ''}`
              : `${performanceSummaries.length} performance record${performanceSummaries.length !== 1 ? 's' : ''}`
            }
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

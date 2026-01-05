'use client';
import { useState, useMemo } from 'react';
import { BookOpen, Layers, HelpCircle, ClipboardList, FileText, X, ChevronDown, ChevronRight, Target, BarChart3, Check, XCircle, Library, Search, Filter } from 'lucide-react';

const FEATURE_CONFIG = {
  studyGuide: { Icon: BookOpen, color: 'indigo', label: 'Study Guides' },
  flashcards: { Icon: Layers, color: 'emerald', label: 'Flashcards' },
  quiz: { Icon: HelpCircle, color: 'violet', label: 'Quizzes' },
  exam: { Icon: ClipboardList, color: 'amber', label: 'Exams' },
};

export default function HistoryPanel({ history, performanceSummaries, onLoadFromHistory, onClearHistory, onClose }) {
  const [activeTab, setActiveTab] = useState('library');
  const [expandedExam, setExpandedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedFeatures, setExpandedFeatures] = useState(new Set(['studyGuide', 'flashcards', 'quiz', 'exam']));
  const [fullyExpandedFeatures, setFullyExpandedFeatures] = useState(new Set());

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
      // Also collapse the "show all" when closing the section
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

  // Filter and group history items
  const filteredHistory = useMemo(() => {
    let items = [...history];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.documentName?.toLowerCase().includes(query) ||
        item.text?.toLowerCase().includes(query) ||
        item.topics?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      items = items.filter(item => item.feature === filterType);
    }
    
    return items;
  }, [history, searchQuery, filterType]);

  // Group by feature type
  const groupedHistory = useMemo(() => {
    const groups = {
      studyGuide: [],
      flashcards: [],
      quiz: [],
      exam: [],
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
    
    return (
      <div key={item.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors group">
        <div className="flex items-start justify-between gap-3">
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
    
    // Show only first 3 items unless fully expanded
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
                {displayItems.map(renderResourceItem)}
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
              {/* Search and Filter */}
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
                    <option value="studyGuide">Study Guides</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="quiz">Quizzes</option>
                    <option value="exam">Exams</option>
                  </select>
                </div>
              </div>

              {/* Grouped Content */}
              {filterType === 'all' ? (
                <div className="space-y-3">
                  {Object.entries(groupedHistory).map(([feature, items]) => 
                    renderFeatureSection(feature, items)
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
                    filteredHistory.map(renderResourceItem)
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
            <div className="p-5 space-y-3">
              {performanceSummaries.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No performance data yet</p>
                  <p className="text-sm">Complete quizzes and exams to track your progress</p>
                </div>
              ) : (
                performanceSummaries.map((summary) => (
                  <div key={summary.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                          {summary.examMode === 'practice' ? (
                            <Target className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ClipboardList className="w-4 h-4 text-amber-600" />
                          )}
                          {summary.examMode === 'practice' ? 'Practice Exam' : 'Exam'} 
                          <span className="text-gray-400 font-normal">• {formatDate(summary.timestamp)}</span>
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{summary.documentName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${getPerformanceColor(summary.percentage || (summary.score/summary.total)*100)}`}>
                          {summary.percentage || Math.round((summary.score/summary.total)*100)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          {summary.score}/{summary.total}
                        </div>
                      </div>
                    </div>
                    
                    {summary.questions && (
                      <button
                        onClick={() => setExpandedExam(expandedExam === summary.id ? null : summary.id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                      >
                        {expandedExam === summary.id ? (
                          <><ChevronDown className="w-4 h-4" /> Hide Details</>
                        ) : (
                          <><ChevronRight className="w-4 h-4" /> View Details</>
                        )}
                      </button>
                    )}

                    {expandedExam === summary.id && summary.questions && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        {summary.questions.map((question, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-800 mb-1">
                                  Q{idx + 1}: {question.question}
                                </div>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="font-medium text-gray-600 mb-1">Your Answer:</div>
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  {question.userAnswer || 'No answer'}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-600 mb-1">Correct Answer:</div>
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  {question.answer}
                                </div>
                              </div>
                            </div>
                            
                            {question.explanation && (
                              <div className="bg-indigo-50 p-2 rounded border-l-4 border-indigo-300 text-xs">
                                {question.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
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
          <div className="flex gap-2">
            {totalItems > 0 && (
              <button
                onClick={onClearHistory}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

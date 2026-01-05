'use client';
import { useState, useEffect } from 'react';
import { Rocket, RefreshCw, ClipboardList, BarChart2, Target, PartyPopper, ArrowLeft } from 'lucide-react';
import TopicBreakdown from './TopicBreakdown';
import ReadinessAssessment from './ReadinessAssessment';
import AdaptiveLearning from './AdaptiveLearning';
import StudyGuide from './StudyGuide';
import TopicContentPage from './TopicContentPage';
import LottieLoader from './LottieLoader';

/**
 * ExamCram Component
 * 
 * Features:
 * - Generates topic breakdown and readiness assessment for exam preparation
 * - Saves generated content to localStorage for persistence
 * - Provides regeneration option with previously generated content as default
 * - Shows adaptive learning progress and statistics
 * 
 * @param {string} content - The document content to analyze
 * @param {string} documentName - Name of the document for localStorage key
 * @param {string} apiKey - Gemini API key for content generation
 * @param {function} onGenerateContent - Callback for content generation
 */
export default function ExamCram({ content, documentName, apiKey, onGenerateContent }) {
  const [currentView, setCurrentView] = useState('overview'); // overview, breakdown, assessment, learning, study, topicContent
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicBreakdown, setTopicBreakdown] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [learningProgress, setLearningProgress] = useState({
    completedTopics: [],
    weakAreas: [],
    currentFocus: null,
    practiceSessions: []
  });
  const [loading, setLoading] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0); // Track last API call time
  const [stats, setStats] = useState({
    totalTopics: 0,
    masteredTopics: 0,
    weakTopics: 0,
    averageResponseTime: 0,
    totalPracticeQuestions: 0,
    correctAnswers: 0
  });

  // New state for tracking previously generated content
  const [previouslyGenerated, setPreviouslyGenerated] = useState({
    topicBreakdown: null,
    readinessData: null,
    hasBeenGenerated: false,
    lastGenerated: null
  });
  const [showRegenerateOption, setShowRegenerateOption] = useState(false);


  // Check if content has been previously generated for this document
  useEffect(() => {
    if (content && documentName) {
      const savedData = localStorage.getItem(`examCram_${documentName}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setPreviouslyGenerated({
            topicBreakdown: parsed.topicBreakdown,
            readinessData: parsed.readinessData,
            hasBeenGenerated: true,
            lastGenerated: parsed.timestamp
          });
          setShowRegenerateOption(true);
          
          // Automatically load the previous content as default
          if (parsed.topicBreakdown) {
            setTopicBreakdown(parsed.topicBreakdown);
            setStats(prev => ({ ...prev, totalTopics: parsed.topicBreakdown.topics.length }));
          }
          if (parsed.readinessData) {
            setReadinessData(parsed.readinessData);
          }
        } catch (error) {
          console.error('Error parsing saved exam cram data:', error);
          // Clear corrupted data
          localStorage.removeItem(`examCram_${documentName}`);
        }
      } else {
        // No previous content found, allow generation
        setPreviouslyGenerated({
          topicBreakdown: null,
          readinessData: null,
          hasBeenGenerated: false,
          lastGenerated: null
        });
      }
    }
  }, [content, documentName]);

  // Save generated content to localStorage
  const saveToLocalStorage = (newTopicBreakdown, newReadinessData) => {
    if (documentName) {
      const dataToSave = {
        topicBreakdown: newTopicBreakdown,
        readinessData: newReadinessData,
        timestamp: Date.now()
      };
      localStorage.setItem(`examCram_${documentName}`, JSON.stringify(dataToSave));
    }
  };

  // Load previously generated content
  const loadPreviousContent = () => {
    if (previouslyGenerated.topicBreakdown) {
      setTopicBreakdown(previouslyGenerated.topicBreakdown);
      setStats(prev => ({ ...prev, totalTopics: previouslyGenerated.topicBreakdown.topics.length }));
    }
    if (previouslyGenerated.readinessData) {
      setReadinessData(previouslyGenerated.readinessData);
    }
    setShowRegenerateOption(false);
  };

  // Generate topic breakdown on component mount (only if no previous content exists)
  useEffect(() => {
    // Only generate if we have content, no current breakdown, and no previous content exists
    if (content && !topicBreakdown) {
      // Check localStorage directly to avoid race conditions
      if (documentName) {
        const savedData = localStorage.getItem(`examCram_${documentName}`);
        if (!savedData) {
          // No previous content exists, safe to generate
          generateTopicBreakdown();
        }
      } else {
        // No document name, safe to generate
        generateTopicBreakdown();
      }
    }
  }, [content, topicBreakdown, documentName]);
  

  // Regenerate content
  const regenerateContent = async () => {
    setLoading(true);
    
    try {
      // Generate new topic breakdown
      const breakdownResponse = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateTopicBreakdown',
          content,
          geminiApiKey: apiKey
        }),
      });
      const breakdownData = await breakdownResponse.json();
      const newTopicBreakdown = breakdownData.breakdown;
      setTopicBreakdown(newTopicBreakdown);
      setStats(prev => ({ ...prev, totalTopics: newTopicBreakdown.topics.length }));

      // Generate new readiness assessment
      const assessmentResponse = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateReadinessAssessment',
          content,
          topicBreakdown: newTopicBreakdown,
          geminiApiKey: apiKey
        }),
      });
      const assessmentData = await assessmentResponse.json();
      const newReadinessData = assessmentData.assessment;
      setReadinessData(newReadinessData);

      // Save new content
      saveToLocalStorage(newTopicBreakdown, newReadinessData);
      setShowRegenerateOption(false);
    } catch (error) {
      console.error('Error regenerating content:', error);
    } finally {
      setLoading(false);
      
    }
  };

  // Debounce function to prevent duplicate API calls
  const debounceCall = (func, delay = 2000) => {
    const now = Date.now();
    if (now - lastCallTime < delay) {
      console.log('API call debounced - too soon since last call');
      return;
    }
    setLastCallTime(now);
    return func();
  };

  const generateTopicBreakdown = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateTopicBreakdown',
          content,
          geminiApiKey: apiKey
        }),
      });
      const data = await response.json();
      setTopicBreakdown(data.breakdown);
      setStats(prev => ({ ...prev, totalTopics: data.breakdown.topics.length }));
      
      // Save to localStorage
      saveToLocalStorage(data.breakdown, readinessData);
    } catch (error) {
      console.error('Error generating topic breakdown:', error);
    } finally {
      setLoading(false);
      
    }
  };

  const generateReadinessAssessment = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateReadinessAssessment',
          content,
          topicBreakdown,
          geminiApiKey: apiKey
        }),
      });
      const data = await response.json();
      setReadinessData(data.assessment);
      
      // Save to localStorage
      saveToLocalStorage(topicBreakdown, data.assessment);
    } catch (error) {
      console.error('Error generating readiness assessment:', error);
    } finally {
      setLoading(false);
      
    }
  };

  const updateLearningProgress = (topicId, performance) => {
    setLearningProgress(prev => {
      const updated = { ...prev };
      
      if (performance.score >= 0.8) {
        // Topic mastered
        if (!updated.completedTopics.includes(topicId)) {
          updated.completedTopics.push(topicId);
        }
        updated.weakAreas = updated.weakAreas.filter(id => id !== topicId);
      } else {
        // Topic needs more work
        if (!updated.weakAreas.includes(topicId)) {
          updated.weakAreas.push(topicId);
        }
        updated.completedTopics = updated.completedTopics.filter(id => id !== topicId);
      }

      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        masteredTopics: updated.completedTopics.length,
        weakTopics: updated.weakAreas.length,
        totalPracticeQuestions: prevStats.totalPracticeQuestions + performance.totalQuestions,
        correctAnswers: prevStats.correctAnswers + performance.correctAnswers,
        averageResponseTime: (prevStats.averageResponseTime + performance.averageTime) / 2
      }));

      return updated;
    });
  };

  const startAdaptiveLearning = async (topicId) => {
    setPracticeLoading(true);
    try {
      if (topicId) {
        // If a specific topic is provided, set it as current focus and ensure question bank is loaded
        setLearningProgress(prev => ({ ...prev, currentFocus: topicId }));
        
        // Import question bank manager to ensure question bank is available
        const { questionBankManager } = await import('../utils/questionBankManager');
        
        // Find the topic
        const topic = topicBreakdown?.topics.find(t => t.id === topicId);
        if (topic && !questionBankManager.questionBanks.has(topicId)) {
          // Preload question bank if not already loaded
          try {
            await questionBankManager.getQuestionBank(topic, content, apiKey);
          } catch (error) {
            console.error('Error preloading question bank:', error);
          }
        }
      } else {
        // If no topic provided (from overview), clear current focus to show topic selection
        setLearningProgress(prev => ({ ...prev, currentFocus: null }));
      }
      setCurrentView('learning');
    } catch (error) {
      console.error('Error starting practice session:', error);
    } finally {
      setPracticeLoading(false);
    }
  };

  const viewTopicContent = (topic) => {
    setSelectedTopic(topic);
    setCurrentView('topicContent');
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <Rocket className="w-10 h-10 text-blue-600" />
          Exam Cram
        </h2>
        <p className="text-gray-600 text-lg">Accelerated study with smart topic breakdown and adaptive learning</p>
      </div>

      {/* Regeneration Option */}
      {previouslyGenerated.hasBeenGenerated && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-start space-x-3">
              <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base lg:text-lg text-blue-800">Previously Generated Content Available</h3>
                <p className="text-blue-600 text-sm lg:text-base">
                  You can use the previous content or generate new content
                  {previouslyGenerated.lastGenerated && (
                    <span className="block text-xs lg:text-sm text-blue-500 mt-1">
                      Last generated: {new Date(previouslyGenerated.lastGenerated).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowRegenerateOption(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors text-sm lg:text-base"
              >
                Continue with Previous
              </button>
              <button
                onClick={regenerateContent}
                disabled={loading}
                className={`w-full px-4 py-3 lg:px-6 lg:py-3 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                  loading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-50 text-blue-600 border border-blue-600'
                }`}
              >
                {loading ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 lg:p-6 text-center shadow-lg">
          <div className="text-2xl lg:text-3xl font-bold mb-1">{stats.totalTopics}</div>
          <div className="text-xs lg:text-sm opacity-90">Total Topics</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 lg:p-6 text-center shadow-lg">
          <div className="text-2xl lg:text-3xl font-bold mb-1">{stats.masteredTopics}</div>
          <div className="text-xs lg:text-sm opacity-90">Mastered</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 lg:p-6 text-center shadow-lg">
          <div className="text-2xl lg:text-3xl font-bold mb-1">{stats.weakTopics}</div>
          <div className="text-xs lg:text-sm opacity-90">Need Work</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 lg:p-6 text-center shadow-lg">
          <div className="text-2xl lg:text-3xl font-bold mb-1">{stats.averageResponseTime.toFixed(1)}s</div>
          <div className="text-xs lg:text-sm opacity-90">Avg Time</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <button
          onClick={() => setCurrentView('breakdown')}
          className="bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 text-left group hover:scale-105"
        >
          <ClipboardList className="w-8 h-8 lg:w-10 lg:h-10 mb-3 lg:mb-4 text-blue-600" />
          <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3 text-gray-800">Topic Breakdown</h3>
          <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base">See the most important concepts at a glance</p>
          <div className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors text-sm lg:text-base">
            View Breakdown →
          </div>
        </button>

        <button
          onClick={() => {
            if (!readinessData) {
              debounceCall(() => generateReadinessAssessment());
            }
            setCurrentView('assessment');
          }}
          className="bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 text-left group hover:scale-105"
        >
          <BarChart2 className="w-8 h-8 lg:w-10 lg:h-10 mb-3 lg:mb-4 text-green-600" />
          <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3 text-gray-800">Readiness Assessment</h3>
          <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base">Evaluate your exam preparedness</p>
          <div className="text-green-600 font-semibold group-hover:text-green-700 transition-colors text-sm lg:text-base">
            Take Assessment →
          </div>
        </button>

        <button
          onClick={() => startAdaptiveLearning()}
          className="bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 text-left group hover:scale-105"
        >
          <Target className="w-8 h-8 lg:w-10 lg:h-10 mb-3 lg:mb-4 text-purple-600" />
          <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3 text-gray-800">Adaptive Learning</h3>
          <p className="text-gray-600 mb-4 lg:mb-6 text-sm lg:text-base">Practice until you master each concept</p>
          <div className="text-purple-600 font-semibold group-hover:text-purple-700 transition-colors text-sm lg:text-base">
            Start Learning →
          </div>
        </button>
      </div>

      {/* Progress Overview */}
      {learningProgress.completedTopics.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 lg:p-8">
          <h3 className="font-bold text-lg lg:text-xl mb-4 text-green-800 flex items-center">
            <PartyPopper className="w-5 h-5 mr-2" />
            Progress Made!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <p className="text-green-700 font-medium mb-3 text-sm lg:text-base">Mastered Topics:</p>
              <div className="flex flex-wrap gap-2">
                {learningProgress.completedTopics.slice(0, 5).map(topicId => {
                  const topic = topicBreakdown?.topics.find(t => t.id === topicId);
                  return (
                    <span key={topicId} className="bg-green-100 text-green-800 px-2 lg:px-3 py-1 lg:py-2 rounded-lg text-xs lg:text-sm font-medium">
                      {topic?.title || topicId}
                    </span>
                  );
                })}
                {learningProgress.completedTopics.length > 5 && (
                  <span className="text-green-600 text-xs lg:text-sm font-medium">+{learningProgress.completedTopics.length - 5} more</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-orange-700 font-medium mb-3 text-sm lg:text-base">Still Working On:</p>
              <div className="flex flex-wrap gap-2">
                {learningProgress.weakAreas.slice(0, 3).map(topicId => {
                  const topic = topicBreakdown?.topics.find(t => t.id === topicId);
                  return (
                    <span key={topicId} className="bg-orange-100 text-orange-800 px-2 lg:px-3 py-1 lg:py-2 rounded-lg text-xs lg:text-sm font-medium">
                      {topic?.title || topicId}
                    </span>
                  );
                })}
                {learningProgress.weakAreas.length > 3 && (
                  <span className="text-orange-600 text-xs lg:text-sm font-medium">+{learningProgress.weakAreas.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'breakdown':
        return (
          <TopicBreakdown 
            breakdown={topicBreakdown}
            onBack={() => setCurrentView('overview')}
            onStartLearning={startAdaptiveLearning}
            onViewContent={viewTopicContent}
            loading={loading}
            content={content}
            apiKey={apiKey}
          />
        );
      case 'assessment':
        return (
          <ReadinessAssessment 
            assessment={readinessData}
            onBack={() => setCurrentView('overview')}
            onStartLearning={startAdaptiveLearning}
            loading={loading}
          />
        );
      case 'learning':
        return (
          <AdaptiveLearning 
            topicBreakdown={topicBreakdown}
            learningProgress={learningProgress}
            onBack={() => {
              // Clear current focus when going back to overview
              setLearningProgress(prev => ({ ...prev, currentFocus: null }));
              setCurrentView('overview');
            }}
            onProgressUpdate={updateLearningProgress}
            apiKey={apiKey}
            content={content}
            skipReview={learningProgress.currentFocus !== null} // Skip review when coming from topic breakdown
          />
        );
      case 'study':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('overview')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Exam Cram
              </button>
            </div>
            <StudyGuide 
              content={content} 
              onRegenerate={() => regenerateContent()}
            />
          </div>
        );
      case 'topicContent':
        return (
          <TopicContentPage 
            topic={selectedTopic}
            onBack={() => setCurrentView('breakdown')}
            content={content}
            apiKey={apiKey}
            onStartPractice={startAdaptiveLearning}
            practiceLoading={practiceLoading}
          />
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
      {loading && (
        <LottieLoader 
          overlay={true} 
          text="Generating content..." 
          size="large"
        />
      )}
      
      {renderCurrentView()}
    </div>
  );
} 
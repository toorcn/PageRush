'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Target, BarChart2, Zap, ChevronLeft, RefreshCw,
  TrendingUp, Award, Layers, Brain, Sparkles, Timer, Pause, Play,
  ChevronRight, GraduationCap, Coffee, Shuffle, ArrowRight
} from 'lucide-react';
import StudyGuide from './StudyGuide';
import TopicBreakdown from './TopicBreakdown';
import AdaptiveLearning from './AdaptiveLearning';
import ReadinessAssessment from './ReadinessAssessment';
import TopicContentPage from './TopicContentPage';
import LottieLoader from './LottieLoader';
import { useStudyStore } from '@/stores';

/**
 * SmartStudy - Unified Study Experience
 * 
 * Features:
 * - Study Guide, Topics, Practice, Assessment modes
 * - Study session timer with break reminders
 * - Quick Quiz across all topics
 * - Continue where you left off
 * - Keyboard navigation support
 */

const STUDY_MODES = {
  OVERVIEW: 'overview',
  GUIDE: 'guide',
  TOPICS: 'topics',
  PRACTICE: 'practice',
  ASSESSMENT: 'assessment',
  TOPIC_CONTENT: 'topicContent',
  QUICK_QUIZ: 'quickQuiz'
};

// Helper to get loading text
const getLoadingText = (type) => {
  const texts = {
    all: 'Generating study materials...',
    guide: 'Creating study guide...',
    topics: 'Analyzing topics...',
    assessment: 'Preparing assessment...'
  };
  return texts[type] || 'Loading...';
};

// Study Session Timer Component
const StudyTimer = ({ sessionTime, isRunning, onToggle, onBreak }) => {
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showBreakReminder = sessionTime > 0 && sessionTime % 1500 === 0 && sessionTime > 0; // Every 25 mins

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 rounded-lg px-2 sm:px-3 py-2">
      <Timer className="w-4 h-4 text-slate-600 flex-shrink-0" />
      <span className="font-mono text-sm font-medium text-slate-700">{formatTime(sessionTime)}</span>
      <button
        onClick={onToggle}
        className="p-1.5 sm:p-1 hover:bg-slate-200 rounded transition-colors touch-manipulation"
        title={isRunning ? 'Pause timer' : 'Resume timer'}
      >
        {isRunning ? <Pause className="w-4 h-4 text-slate-600" /> : <Play className="w-4 h-4 text-slate-600" />}
      </button>
      {showBreakReminder && (
        <button
          onClick={onBreak}
          className="flex items-center gap-1 px-2 py-1.5 sm:py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition-colors touch-manipulation"
        >
          <Coffee className="w-3 h-3" /> <span className="hidden xs:inline">Take a</span> break
        </button>
      )}
    </div>
  );
};

// Progress Dashboard Component
const ProgressDashboard = ({ stats, studyTime }) => {
  const masteryPercent = stats.totalTopics > 0 
    ? Math.round((stats.masteredTopics / stats.totalTopics) * 100) 
    : 0;
  
  const formatStudyTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };
  
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        Your Progress
      </h3>
      {/* Mobile: 3 columns top row, 2 columns bottom row. Tablet+: 5 columns */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-400">{stats.totalTopics}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">Topics</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.masteredTopics}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">Mastered</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-amber-400">{stats.weakTopics}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">Need Work</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 text-center col-span-1 sm:col-span-1">
          <div className="text-2xl sm:text-3xl font-bold text-violet-400">{masteryPercent}%</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">Mastery</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{formatStudyTime(studyTime)}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">Study Time</div>
        </div>
      </div>

      {stats.totalTopics > 0 && (
        <div className="mt-3 sm:mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Overall Mastery</span>
            <span>{masteryPercent}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Mode Card Component
const ModeCard = ({ icon: Icon, title, description, color, onClick, badge, disabled, shortcut }) => {
  const colorStyles = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800',
    emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800',
    violet: 'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 active:from-violet-700 active:to-violet-800',
    amber: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800',
    rose: 'from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:from-rose-700 active:to-rose-800',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative bg-gradient-to-br ${colorStyles[color]} text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left 
        shadow-lg hover:shadow-xl transition-all duration-300 sm:hover:-translate-y-1 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        touch-manipulation active:scale-[0.98] min-h-[120px] sm:min-h-[160px]`}
    >
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16 group-hover:scale-150 transition-transform duration-500" />
      
      <Icon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-4 relative z-10" />
      <h3 className="font-bold text-base sm:text-xl mb-1 sm:mb-2 relative z-10">{title}</h3>
      <p className="text-white/80 text-xs sm:text-sm relative z-10 line-clamp-2">{description}</p>
      
      {badge && (
        <span className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/20 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
          {badge}
        </span>
      )}
      
      <div className="flex items-center justify-between mt-3 sm:mt-4 relative z-10">
        <span className="flex items-center gap-1 text-white/80 text-xs sm:text-sm font-medium">
          Start <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </span>
        {shortcut && (
          <kbd className="hidden sm:inline-block px-2 py-0.5 bg-white/20 rounded text-xs font-mono">{shortcut}</kbd>
        )}
      </div>
    </button>
  );
};

// Quick Actions Component with Quick Quiz
const QuickActions = ({ onAction, hasTopics, hasGuide, lastMode, lastSection }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200">
    <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
      <Zap className="w-4 h-4" /> Quick Actions
    </h4>
    <div className="flex flex-wrap gap-2">
      {/* Continue where left off */}
      {lastMode && lastMode !== 'overview' && (
        <button
          onClick={() => onAction(lastMode, lastSection)}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation active:bg-indigo-800"
        >
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
          <span className="hidden xs:inline">Continue</span>
          <span className="xs:hidden">Go</span>
          {' '}{lastMode === 'guide' ? 'Reading' : lastMode === 'topics' ? 'Exploring' : 'Practicing'}
        </button>
      )}
      {hasGuide && (
        <button
          onClick={() => onAction('guide')}
          className="px-3 py-2 bg-white rounded-lg text-xs sm:text-sm font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation active:bg-blue-100"
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Study</span> Guide
        </button>
      )}
      {hasTopics && (
        <>
          <button
            onClick={() => onAction('quickQuiz')}
            className="px-3 py-2 bg-rose-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-rose-700 transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation active:bg-rose-800"
          >
            <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quiz
          </button>
          <button
            onClick={() => onAction('practice')}
            className="px-3 py-2 bg-white rounded-lg text-xs sm:text-sm font-medium text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation active:bg-emerald-100"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Practice
          </button>
          <button
            onClick={() => onAction('assessment')}
            className="px-3 py-2 bg-white rounded-lg text-xs sm:text-sm font-medium text-violet-700 hover:bg-violet-50 border border-violet-200 transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation active:bg-violet-100"
          >
            <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Readiness</span><span className="sm:hidden">Ready</span>
          </button>
        </>
      )}
    </div>
  </div>
);

// Break Reminder Modal
const BreakModal = ({ onDismiss, onTakeBreak, studyTime }) => {
  const mins = Math.floor(studyTime / 60);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Time for a Break!</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-3 sm:mb-4">
            You&apos;ve been studying for {mins} minutes. Taking short breaks helps improve retention and focus.
          </p>
          <div className="bg-amber-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
            <h4 className="font-semibold text-amber-800 mb-2 text-sm sm:text-base">Quick break ideas:</h4>
            <ul className="text-xs sm:text-sm text-amber-700 space-y-1">
              <li>• Stretch or walk around for 5 minutes</li>
              <li>• Get some water or a healthy snack</li>
              <li>• Look away from the screen</li>
              <li>• Take a few deep breaths</li>
            </ul>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-3 sm:py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors touch-manipulation active:bg-slate-100"
            >
              Keep Studying
            </button>
            <button
              onClick={onTakeBreak}
              className="flex-1 px-4 py-3 sm:py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors touch-manipulation active:bg-amber-800"
            >
              Take 5 min Break
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SmartStudy({ content, documentName, apiKey }) {
  // Study store for saving to library
  const addHistoryItem = useStudyStore((s) => s.addHistoryItem);
  
  // Current view/mode
  const [currentMode, setCurrentMode] = useState(STUDY_MODES.OVERVIEW);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Content state
  const [studyGuideContent, setStudyGuideContent] = useState(null);
  const [topicBreakdown, setTopicBreakdown] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  
  // Learning progress
  const [learningProgress, setLearningProgress] = useState({
    completedTopics: [],
    weakAreas: [],
    currentFocus: null,
    practiceSessions: [],
    lastMode: null,
    lastSection: null
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalTopics: 0,
    masteredTopics: 0,
    weakTopics: 0,
    totalPracticeQuestions: 0,
    correctAnswers: 0
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [practiceLoading, setPracticeLoading] = useState(false);
  
  // Session tracking
  const [sessionTime, setSessionTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const timerRef = useRef(null);
  const lastBreakRef = useRef(0);
  
  // Previous content tracking
  const [previouslyGenerated, setPreviouslyGenerated] = useState({
    hasBeenGenerated: false,
    lastGenerated: null
  });

  // Session timer
  useEffect(() => {
    if (timerRunning && currentMode !== STUDY_MODES.OVERVIEW) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Check for break reminder every 25 minutes
          if (newTime - lastBreakRef.current >= 1500 && newTime > 0) {
            setShowBreakModal(true);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, currentMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when not in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (currentMode === STUDY_MODES.OVERVIEW) {
        switch (e.key) {
          case '1': navigateToMode(STUDY_MODES.GUIDE); break;
          case '2': navigateToMode(STUDY_MODES.TOPICS); break;
          case '3': if (topicBreakdown) navigateToMode(STUDY_MODES.PRACTICE); break;
          case '4': if (topicBreakdown) navigateToMode(STUDY_MODES.ASSESSMENT); break;
          case 'q': if (topicBreakdown) navigateToMode(STUDY_MODES.QUICK_QUIZ); break;
        }
      }
      
      // Escape to go back
      if (e.key === 'Escape' && currentMode !== STUDY_MODES.OVERVIEW) {
        setCurrentMode(STUDY_MODES.OVERVIEW);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, topicBreakdown]);

  // Load saved data on mount
  useEffect(() => {
    if (content && documentName) {
      const savedData = localStorage.getItem(`smartStudy_${documentName}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.studyGuideContent) setStudyGuideContent(parsed.studyGuideContent);
          if (parsed.topicBreakdown) {
            setTopicBreakdown(parsed.topicBreakdown);
            setStats(prev => ({ ...prev, totalTopics: parsed.topicBreakdown.topics?.length || 0 }));
          }
          if (parsed.readinessData) setReadinessData(parsed.readinessData);
          if (parsed.learningProgress) setLearningProgress(parsed.learningProgress);
          if (parsed.stats) setStats(parsed.stats);
          if (parsed.totalStudyTime) setTotalStudyTime(parsed.totalStudyTime);
          
          setPreviouslyGenerated({
            hasBeenGenerated: true,
            lastGenerated: parsed.timestamp
          });
        } catch (error) {
          console.error('Error parsing saved data:', error);
          localStorage.removeItem(`smartStudy_${documentName}`);
        }
      }
    }
  }, [content, documentName]);

  // Save data to localStorage
  const saveToLocalStorage = useCallback((updates = {}) => {
    if (!documentName) return;
    
    const dataToSave = {
      studyGuideContent: updates.studyGuideContent ?? studyGuideContent,
      topicBreakdown: updates.topicBreakdown ?? topicBreakdown,
      readinessData: updates.readinessData ?? readinessData,
      learningProgress: updates.learningProgress ?? learningProgress,
      stats: updates.stats ?? stats,
      totalStudyTime: updates.totalStudyTime ?? (totalStudyTime + sessionTime),
      timestamp: Date.now()
    };
    
    localStorage.setItem(`smartStudy_${documentName}`, JSON.stringify(dataToSave));
  }, [documentName, studyGuideContent, topicBreakdown, readinessData, learningProgress, stats, totalStudyTime, sessionTime]);

  // Save on mode change
  useEffect(() => {
    if (currentMode !== STUDY_MODES.OVERVIEW) {
      setLearningProgress(prev => ({
        ...prev,
        lastMode: currentMode,
        lastSection: selectedTopic?.id || null
      }));
    }
  }, [currentMode, selectedTopic]);

  // Generate study guide content
  const generateStudyGuide = async () => {
    setLoading(true);
    setLoadingType('guide');
    
    try {
      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          promptType: 'studyGuide',
          geminiApiKey: apiKey
        }),
      });
      
      const data = await response.json();
      const guideContent = data.result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setStudyGuideContent(guideContent);
      saveToLocalStorage({ studyGuideContent: guideContent });
    } catch (error) {
      console.error('Error generating study guide:', error);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  // Generate topic breakdown
  const generateTopicBreakdown = async () => {
    setLoading(true);
    setLoadingType('topics');
    
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
      setStats(prev => ({ ...prev, totalTopics: data.breakdown?.topics?.length || 0 }));
      saveToLocalStorage({ topicBreakdown: data.breakdown });
    } catch (error) {
      console.error('Error generating topic breakdown:', error);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  // Generate readiness assessment
  const generateReadinessAssessment = async () => {
    setLoading(true);
    setLoadingType('assessment');
    
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
      saveToLocalStorage({ readinessData: data.assessment });
    } catch (error) {
      console.error('Error generating readiness assessment:', error);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  // Generate all content
  const generateAllContent = async () => {
    setLoading(true);
    setLoadingType('all');
    
    try {
      // Generate study guide
      const guideResponse = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          promptType: 'studyGuide',
          geminiApiKey: apiKey
        }),
      });
      const guideData = await guideResponse.json();
      const guideContent = guideData.result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setStudyGuideContent(guideContent);
      
      // Generate topic breakdown
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
      setTopicBreakdown(breakdownData.breakdown);
      setStats(prev => ({ ...prev, totalTopics: breakdownData.breakdown?.topics?.length || 0 }));
      
      // Save all to localStorage
      saveToLocalStorage({
        studyGuideContent: guideContent,
        topicBreakdown: breakdownData.breakdown
      });
      
      setPreviouslyGenerated({
        hasBeenGenerated: true,
        lastGenerated: Date.now()
      });
      
      // Save to study library
      addHistoryItem({
        feature: 'smartStudy',
        documentName: documentName || 'Untitled Document',
        text: content?.substring(0, 100) + '...',
        result: guideData,
        topics: breakdownData.breakdown?.topics?.map(t => t.name || t.title) || [],
      });
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  // Update learning progress
  const updateLearningProgress = useCallback((topicId, performance) => {
    setLearningProgress(prev => {
      const updated = { ...prev };
      
      if (performance.score >= 0.8) {
        if (!updated.completedTopics.includes(topicId)) {
          updated.completedTopics = [...updated.completedTopics, topicId];
        }
        updated.weakAreas = updated.weakAreas.filter(id => id !== topicId);
      } else {
        if (!updated.weakAreas.includes(topicId)) {
          updated.weakAreas = [...updated.weakAreas, topicId];
        }
        updated.completedTopics = updated.completedTopics.filter(id => id !== topicId);
      }
      
      return updated;
    });
    
    setStats(prev => {
      const newStats = {
        ...prev,
        masteredTopics: learningProgress.completedTopics.length + (performance.score >= 0.8 ? 1 : 0),
        weakTopics: learningProgress.weakAreas.length + (performance.score < 0.8 ? 1 : 0),
        totalPracticeQuestions: prev.totalPracticeQuestions + (performance.totalQuestions || 0),
        correctAnswers: prev.correctAnswers + (performance.correctAnswers || 0),
      };
      saveToLocalStorage({ stats: newStats });
      return newStats;
    });
  }, [learningProgress, saveToLocalStorage]);

  // Start practice for a specific topic
  const startPractice = useCallback(async (topicId = null) => {
    setPracticeLoading(true);
    try {
      if (topicId) {
        setLearningProgress(prev => ({ ...prev, currentFocus: topicId }));
        
        const { questionBankManager } = await import('../utils/questionBankManager');
        const topic = topicBreakdown?.topics.find(t => t.id === topicId);
        if (topic && !questionBankManager.questionBanks.has(topicId)) {
          await questionBankManager.getQuestionBank(topic, content, apiKey);
        }
      } else {
        setLearningProgress(prev => ({ ...prev, currentFocus: null }));
      }
      setCurrentMode(STUDY_MODES.PRACTICE);
    } catch (error) {
      console.error('Error starting practice:', error);
    } finally {
      setPracticeLoading(false);
    }
  }, [topicBreakdown, content, apiKey]);

  // View topic content
  const viewTopicContent = useCallback((topic) => {
    setSelectedTopic(topic);
    setCurrentMode(STUDY_MODES.TOPIC_CONTENT);
  }, []);

  // Navigate to mode
  const navigateToMode = useCallback((mode, section = null) => {
    // Generate content if needed
    if (mode === STUDY_MODES.GUIDE && !studyGuideContent) {
      generateStudyGuide();
    }
    if (mode === STUDY_MODES.TOPICS && !topicBreakdown) {
      generateTopicBreakdown();
    }
    if (mode === STUDY_MODES.ASSESSMENT && !readinessData) {
      generateReadinessAssessment();
    }
    if ((mode === STUDY_MODES.PRACTICE || mode === STUDY_MODES.QUICK_QUIZ) && !topicBreakdown) {
      generateTopicBreakdown();
    }
    
    // Handle section navigation for continue feature
    if (section && mode === STUDY_MODES.TOPIC_CONTENT) {
      const topic = topicBreakdown?.topics.find(t => t.id === section);
      if (topic) setSelectedTopic(topic);
    }
    
    setCurrentMode(mode);
  }, [studyGuideContent, topicBreakdown, readinessData]);

  // Handle break
  const handleTakeBreak = () => {
    setTimerRunning(false);
    setShowBreakModal(false);
    lastBreakRef.current = sessionTime;
    
    // Auto-resume after 5 minutes
    setTimeout(() => {
      setTimerRunning(true);
    }, 5 * 60 * 1000);
  };

  // Auto-generate on first load if no content
  useEffect(() => {
    if (content && !previouslyGenerated.hasBeenGenerated && !topicBreakdown && !studyGuideContent && !loading) {
      generateAllContent();
    }
  }, [content, previouslyGenerated.hasBeenGenerated, topicBreakdown, studyGuideContent, loading]);

  // Render Overview
  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Timer */}
      <div className="flex flex-col gap-4">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-3 sm:mb-4">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Smart Study</h2>
          <p className="text-slate-600 text-sm sm:text-base">Your personalized learning experience</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <StudyTimer 
            sessionTime={sessionTime}
            isRunning={timerRunning}
            onToggle={() => setTimerRunning(!timerRunning)}
            onBreak={() => setShowBreakModal(true)}
          />
        </div>
      </div>

      {/* Progress Dashboard */}
      {(stats.totalTopics > 0 || learningProgress.completedTopics.length > 0) && (
        <ProgressDashboard 
          stats={stats} 
          studyTime={totalStudyTime + sessionTime}
        />
      )}

      {/* Quick Actions */}
      {(studyGuideContent || topicBreakdown) && (
        <QuickActions 
          onAction={navigateToMode}
          hasTopics={!!topicBreakdown}
          hasGuide={!!studyGuideContent}
          lastMode={learningProgress.lastMode}
          lastSection={learningProgress.lastSection}
        />
      )}

      {/* Study Modes */}
      <div>
        <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Study Modes
          <span className="hidden sm:inline text-xs text-slate-500 font-normal ml-2">Press 1-4 or Q for quick access</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <ModeCard
            icon={BookOpen}
            title="Study Guide"
            description="Comprehensive notes with diagrams and key concepts"
            color="blue"
            onClick={() => navigateToMode(STUDY_MODES.GUIDE)}
            badge={studyGuideContent ? 'Ready' : null}
            shortcut="1"
          />
          <ModeCard
            icon={Target}
            title="Topic Explorer"
            description="Browse topics by priority and dive deep"
            color="emerald"
            onClick={() => navigateToMode(STUDY_MODES.TOPICS)}
            badge={topicBreakdown ? `${topicBreakdown.topics?.length || 0} topics` : null}
            shortcut="2"
          />
          <ModeCard
            icon={Brain}
            title="Practice Mode"
            description="Adaptive questions until you master each topic"
            color="violet"
            onClick={() => navigateToMode(STUDY_MODES.PRACTICE)}
            disabled={!topicBreakdown}
            shortcut="3"
          />
          <ModeCard
            icon={BarChart2}
            title="Readiness Check"
            description="Evaluate exam preparedness and weak areas"
            color="amber"
            onClick={() => navigateToMode(STUDY_MODES.ASSESSMENT)}
            disabled={!topicBreakdown}
            shortcut="4"
          />
          <ModeCard
            icon={Shuffle}
            title="Quick Quiz"
            description="Random questions across all topics"
            color="rose"
            onClick={() => navigateToMode(STUDY_MODES.QUICK_QUIZ)}
            disabled={!topicBreakdown}
            shortcut="Q"
          />
        </div>
      </div>

      {/* Getting Started */}
      {!previouslyGenerated.hasBeenGenerated && !loading && (
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 sm:p-6 border border-indigo-200">
          <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <Sparkles className="w-5 h-5" /> Getting Started
          </h4>
          <p className="text-indigo-700 text-xs sm:text-sm mb-3 sm:mb-4">
            We&apos;ll analyze your document and create personalized study materials including a study guide, topic breakdown, and practice questions.
          </p>
          <button
            onClick={generateAllContent}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 touch-manipulation active:bg-indigo-800"
          >
            <Sparkles className="w-4 h-4" /> Generate Study Materials
          </button>
        </div>
      )}

      {/* Regenerate Option */}
      {previouslyGenerated.hasBeenGenerated && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200">
          <div className="text-xs sm:text-sm text-slate-600">
            <span className="font-medium">Last updated:</span>{' '}
            {previouslyGenerated.lastGenerated 
              ? new Date(previouslyGenerated.lastGenerated).toLocaleString()
              : 'Unknown'}
          </div>
          <button
            onClick={generateAllContent}
            disabled={loading}
            className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate All
          </button>
        </div>
      )}

      {/* Learning Tips */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 sm:p-5 border border-amber-200">
        <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
          <Award className="w-5 h-5" /> Study Tips
        </h4>
        <ul className="text-amber-700 text-xs sm:text-sm space-y-1">
          <li>• Start with the <strong>Study Guide</strong> for an overview</li>
          <li>• Use <strong>Topic Explorer</strong> to focus on high-priority areas</li>
          <li>• Try <strong>Quick Quiz</strong> to test yourself across all topics</li>
          <li>• Take the <strong>Readiness Check</strong> before your exam</li>
          <li>• Take breaks every 25 minutes for better retention</li>
        </ul>
      </div>
    </div>
  );

  // Render current mode
  const renderCurrentMode = () => {
    switch (currentMode) {
      case STUDY_MODES.GUIDE:
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => setCurrentMode(STUDY_MODES.OVERVIEW)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base touch-manipulation py-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Overview
              </button>
              <StudyTimer 
                sessionTime={sessionTime}
                isRunning={timerRunning}
                onToggle={() => setTimerRunning(!timerRunning)}
                onBreak={() => setShowBreakModal(true)}
              />
            </div>
            {studyGuideContent ? (
              <StudyGuide 
                content={studyGuideContent} 
                onRegenerate={generateStudyGuide}
              />
            ) : (
              <div className="text-center py-12">
                <LottieLoader text="Generating study guide..." size="large" />
              </div>
            )}
          </div>
        );

      case STUDY_MODES.TOPICS:
        return (
          <TopicBreakdown 
            breakdown={topicBreakdown}
            onBack={() => setCurrentMode(STUDY_MODES.OVERVIEW)}
            onStartLearning={startPractice}
            onViewContent={viewTopicContent}
            loading={loading && loadingType === 'topics'}
            content={content}
            apiKey={apiKey}
          />
        );

      case STUDY_MODES.PRACTICE:
        return (
          <AdaptiveLearning 
            topicBreakdown={topicBreakdown}
            learningProgress={learningProgress}
            onBack={() => {
              setLearningProgress(prev => ({ ...prev, currentFocus: null }));
              setCurrentMode(STUDY_MODES.OVERVIEW);
            }}
            onProgressUpdate={updateLearningProgress}
            apiKey={apiKey}
            content={content}
            skipReview={learningProgress.currentFocus !== null}
          />
        );

      case STUDY_MODES.QUICK_QUIZ:
        // Quick Quiz uses AdaptiveLearning but with random topic selection
        return (
          <AdaptiveLearning 
            topicBreakdown={topicBreakdown}
            learningProgress={{ ...learningProgress, currentFocus: null }}
            onBack={() => setCurrentMode(STUDY_MODES.OVERVIEW)}
            onProgressUpdate={updateLearningProgress}
            apiKey={apiKey}
            content={content}
            skipReview={true}
            quickQuizMode={true}
          />
        );

      case STUDY_MODES.ASSESSMENT:
        return (
          <ReadinessAssessment 
            assessment={readinessData}
            onBack={() => setCurrentMode(STUDY_MODES.OVERVIEW)}
            onStartLearning={startPractice}
            loading={loading && loadingType === 'assessment'}
          />
        );

      case STUDY_MODES.TOPIC_CONTENT:
        return (
          <TopicContentPage 
            topic={selectedTopic}
            onBack={() => setCurrentMode(STUDY_MODES.TOPICS)}
            content={content}
            apiKey={apiKey}
            onStartPractice={startPractice}
            practiceLoading={practiceLoading}
          />
        );

      default:
        return renderOverview();
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
      {loading && (
        <LottieLoader 
          overlay={true} 
          text={getLoadingText(loadingType)}
          size="large"
        />
      )}
      
      {showBreakModal && (
        <BreakModal 
          onDismiss={() => {
            setShowBreakModal(false);
            lastBreakRef.current = sessionTime;
          }}
          onTakeBreak={handleTakeBreak}
          studyTime={sessionTime}
        />
      )}
      
      {renderCurrentMode()}
    </div>
  );
}

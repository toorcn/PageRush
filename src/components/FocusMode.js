'use client';
import React, { useState, useEffect, useRef } from 'react';
import LessonContent from './LessonContent';
import { 
  BookOpen, Layers, HelpCircle, ClipboardList, Pause, Play, 
  ChevronLeft, Target, Sparkles, Trophy, ThumbsUp, Rocket, Zap, Star, Flame,
  PartyPopper
} from 'lucide-react';

const FocusMode = ({ 
  activeDocument, 
  apiKey, 
  onExit, 
  currentProgress = null 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [streak, setStreak] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [sessionGoal, setSessionGoal] = useState(3); // Default 3 lessons
  const [timer, setTimer] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showBreak, setShowBreak] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    lessonsCompleted: 0,
    timeSpent: 0,
    accuracy: 0,
    focusScore: 0
  });
  const [lessonContent, setLessonContent] = useState(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [lessonResult, setLessonResult] = useState(null);

  const timerRef = useRef(null);
  const breakTimerRef = useRef(null);

  // Encouragement messages for dopamine boost
  const encouragementMessages = [
    { icon: <PartyPopper className="w-5 h-5" />, text: "Amazing progress! You're crushing it!" },
    { icon: <Flame className="w-5 h-5" />, text: "Your dedication is inspiring!" },
    { icon: <Rocket className="w-5 h-5" />, text: "You're building unstoppable momentum!" },
    { icon: <Star className="w-5 h-5" />, text: "Every lesson makes you stronger!" },
    { icon: <Flame className="w-5 h-5" />, text: "You're on fire today!" },
    { icon: <Target className="w-5 h-5" />, text: "Laser focus! You're unstoppable!" },
    { icon: <Sparkles className="w-5 h-5" />, text: "You're turning knowledge into power!" },
    { icon: <Star className="w-5 h-5" />, text: "Your future self thanks you!" },
    { icon: <Zap className="w-5 h-5" />, text: "You're learning at lightning speed!" },
    { icon: <Trophy className="w-5 h-5" />, text: "You're becoming an expert!" }
  ];

  // Focus mode study tools - using existing polished components
  const studyTools = [
    {
      key: 'studyGuide',
      title: 'Study Guide',
      icon: <BookOpen className="w-8 h-8" />,
      description: 'Organized notes and summaries',
      duration: 5,
      color: 'blue',
      feature: 'studyGuide'
    },
    {
      key: 'flashcards',
      title: 'Flashcards',
      icon: <Layers className="w-8 h-8" />,
      description: 'Interactive study cards',
      duration: 3,
      color: 'green',
      feature: 'flashcards'
    },
    {
      key: 'quiz',
      title: 'Quick Quiz',
      icon: <HelpCircle className="w-8 h-8" />,
      description: 'Test your knowledge',
      duration: 4,
      color: 'purple',
      feature: 'quiz'
    },
    {
      key: 'exam',
      title: 'Practice Exam',
      icon: <ClipboardList className="w-8 h-8" />,
      description: 'Full practice test',
      duration: 6,
      color: 'orange',
      feature: 'exam'
    }
  ];

  useEffect(() => {
    if (sessionStartTime && !isPaused) {
      timerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStartTime, isPaused]);

  useEffect(() => {
    // Start session when component mounts
    setSessionStartTime(Date.now());
    
    // Load streak from localStorage
    const savedStreak = localStorage.getItem('focusModeStreak') || 0;
    setStreak(parseInt(savedStreak));
    
    // Load completed lessons
    const savedCompleted = localStorage.getItem('focusModeCompleted') || '[]';
    setCompletedLessons(JSON.parse(savedCompleted));
  }, []);

  useEffect(() => {
    // Save streak to localStorage
    localStorage.setItem('focusModeStreak', streak.toString());
    localStorage.setItem('focusModeCompleted', JSON.stringify(completedLessons));
  }, [streak, completedLessons]);

  const startLesson = async (studyTool) => {
    setCurrentLesson(studyTool);
    setCurrentStep(1);
    setIsGeneratingContent(true);
    setLessonContent(null);
    setLessonResult(null);
    
    // Generate content directly for focus mode
    try {
      console.log('Starting lesson generation for:', studyTool.feature);
      
      const res = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: Array.isArray(activeDocument) ? activeDocument.map(doc => doc.text).join('\n\n---\n\n') : activeDocument?.text || '', 
          promptType: studyTool.feature, 
          geminiApiKey: apiKey
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      console.log('Generated result:', result);
      setLessonResult(result);
      
      if (result && result.result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const content = result.result.candidates[0].content.parts[0].text;
        console.log('Setting lesson content:', content.substring(0, 100) + '...');
        setLessonContent(content);
      } else {
        console.log('No content found in result:', result);
        setLessonContent(`This is a ${studyTool.title.toLowerCase()} session. Focus on understanding the key concepts and take your time to absorb the information.`);
      }
    } catch (error) {
      console.error('Error generating lesson:', error);
      // Set fallback content
      setLessonContent(`This is a ${studyTool.title.toLowerCase()} session. Focus on understanding the key concepts and take your time to absorb the information.`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const completeLesson = () => {
    const lesson = {
      id: Date.now(),
      type: currentLesson.key,
      title: currentLesson.title,
      completedAt: new Date().toISOString(),
      duration: sessionDuration
    };

    setCompletedLessons(prev => [...prev, lesson]);
    setSessionStats(prev => ({
      ...prev,
      lessonsCompleted: prev.lessonsCompleted + 1
    }));

    // Show encouragement
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    setEncouragementMessage(randomMessage.text);
    setShowEncouragement(true);

    // Increase streak
    setStreak(prev => prev + 1);

    // Check if session goal is reached
    if (completedLessons.length + 1 >= sessionGoal) {
      setTimeout(() => {
        setShowBreak(true);
        startBreakTimer();
      }, 2000);
    } else {
      setCurrentStep(0);
      setCurrentLesson(null);
    }

    setTimeout(() => setShowEncouragement(false), 3000);
  };

  const startBreakTimer = () => {
    setBreakTime(300); // 5 minutes
    breakTimerRef.current = setInterval(() => {
      setBreakTime(prev => {
        if (prev <= 1) {
          clearInterval(breakTimerRef.current);
          setShowBreak(false);
          setCurrentStep(0);
          setCurrentLesson(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateFocusScore = () => {
    const timeEfficiency = Math.min(sessionStats.lessonsCompleted / sessionGoal, 1);
    const timeSpent = sessionDuration / 60; // in minutes
    const efficiency = timeEfficiency / Math.max(timeSpent / 30, 0.1); // 30 min baseline
    return Math.min(Math.round(efficiency * 100), 100);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  if (showBreak) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <PartyPopper className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Great Job!</h2>
          <p className="text-gray-600 mb-6">
            You've completed {sessionGoal} lessons! Time for a well-deserved break.
          </p>
          
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-green-700 mb-2">
              {formatTime(breakTime)}
            </div>
            <p className="text-green-600 text-sm">Break time remaining</p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Lessons completed:</span>
              <span className="font-semibold">{sessionStats.lessonsCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span>Current streak:</span>
              <span className="font-semibold">{streak} days</span>
            </div>
            <div className="flex justify-between">
              <span>Focus score:</span>
              <span className="font-semibold">{calculateFocusScore()}%</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowBreak(false);
              setBreakTime(0);
              if (breakTimerRef.current) clearInterval(breakTimerRef.current);
            }}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            End Break Early
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onExit}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Exit Focus
            </button>
            <div>
              <h1 className="text-xl font-bold">Focus Mode</h1>
              <p className="text-blue-100 text-sm">Minimal • Structured • Results-Driven</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{streak}</div>
              <div className="text-xs text-blue-100">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(sessionDuration)}</div>
              <div className="text-xs text-blue-100">Session Time</div>
            </div>
            <button
              onClick={togglePause}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-100 h-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 transition-all duration-300"
          style={{ width: `${(completedLessons.length / sessionGoal) * 100}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {currentStep === 0 && (
          <div className="text-center space-y-8">
            {/* Session Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              Ready to Focus? <Target className="w-8 h-8" />
            </h2>
              <p className="text-gray-600 mb-6">
                Complete {sessionGoal} bite-sized lessons to build momentum
              </p>
              
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 {studyTools.map((tool) => (
                   <button
                     key={tool.key}
                     onClick={() => startLesson(tool)}
                     className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-blue-200"
                   >
                     <div className="mb-2 flex justify-center text-blue-600">{tool.icon}</div>
                     <div className="font-semibold text-gray-800 text-sm">{tool.title}</div>
                     <div className="text-xs text-gray-500">{tool.duration} min</div>
                   </button>
                 ))}
               </div>

              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{completedLessons.length}</div>
                  <div>Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{sessionGoal}</div>
                  <div>Goal</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{sessionGoal - completedLessons.length}</div>
                  <div>Remaining</div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            {completedLessons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                                     {completedLessons.slice(-3).map((lesson) => (
                     <div key={lesson.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                       <div className="text-blue-600">
                         {studyTools.find(st => st.key === lesson.type)?.icon}
                       </div>
                       <div className="flex-1">
                         <div className="font-semibold text-gray-800">{lesson.title}</div>
                         <div className="text-sm text-gray-500">
                           Completed {new Date(lesson.completedAt).toLocaleTimeString()}
                         </div>
                       </div>
                       <div className="text-sm text-gray-500">
                         {formatTime(lesson.duration)}
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && currentLesson && (
          <div className="space-y-6">
            {/* Lesson Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center space-x-4">
                <div className="text-blue-600">{currentLesson.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{currentLesson.title}</h2>
                  <p className="text-gray-600">{currentLesson.description}</p>
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <LessonContent
                lessonType={currentLesson.key}
                content={lessonContent}
                onComplete={completeLesson}
                result={lessonResult}
              />
            </div>
          </div>
        )}
      </div>

      {/* Encouragement Overlay */}
      {showEncouragement && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-slideUp">
            <PartyPopper className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Excellent!</h3>
            <p className="text-gray-600">{encouragementMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusMode; 
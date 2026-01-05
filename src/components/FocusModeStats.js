'use client';
import { useState, useEffect } from 'react';
import { Target, Flame, BookOpen, Clock, Star } from 'lucide-react';

const ACHIEVEMENT_ICONS = {
  streak: Flame,
  lessons: BookOpen,
  time: Clock,
  dedication: Star,
};

const FocusModeStats = ({ onEnterFocusMode }) => {
  const [stats, setStats] = useState({
    streak: 0,
    totalLessons: 0,
    totalTime: 0,
    lastSession: null,
    achievements: []
  });

  useEffect(() => {
    const savedStreak = localStorage.getItem('focusModeStreak') || 0;
    const savedCompleted = localStorage.getItem('focusModeCompleted') || '[]';
    const completedLessons = JSON.parse(savedCompleted);
    
    const totalTime = completedLessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);
    const lastSession = completedLessons.length > 0 ? completedLessons[0] : null;
    
    const achievements = [];
    if (parseInt(savedStreak) >= 1) achievements.push({ type: 'streak', value: savedStreak });
    if (completedLessons.length >= 5) achievements.push({ type: 'lessons', value: completedLessons.length });
    if (totalTime >= 1800) achievements.push({ type: 'time', value: Math.floor(totalTime / 60) });
    if (completedLessons.length >= 10) achievements.push({ type: 'dedication', value: '10+' });
    
    setStats({
      streak: parseInt(savedStreak),
      totalLessons: completedLessons.length,
      totalTime,
      lastSession,
      achievements
    });
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (stats.totalLessons === 0) {
    return (
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Focus?</h3>
          <p className="text-gray-500 mb-4 text-sm">
            Start your first focus session and build momentum with bite-sized learning
          </p>
          <button
            onClick={onEnterFocusMode}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 shadow-md"
          >
            Start Focus Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" />
          Focus Mode Stats
        </h3>
        <button
          onClick={onEnterFocusMode}
          className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200"
        >
          Continue
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-violet-600">{stats.streak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalLessons}</div>
          <div className="text-xs text-gray-500">Lessons</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{formatTime(stats.totalTime)}</div>
          <div className="text-xs text-gray-500">Total Time</div>
        </div>
      </div>

      {stats.achievements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map((achievement, index) => {
              const IconComponent = ACHIEVEMENT_ICONS[achievement.type] || Star;
              return (
                <div key={index} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
                  <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-gray-700">{achievement.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.lastSession && (
        <div className="text-xs text-gray-400">
          Last session: {formatDate(stats.lastSession.completedAt)}
        </div>
      )}
    </div>
  );
};

export default FocusModeStats;

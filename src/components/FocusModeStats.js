'use client';
import React, { useState, useEffect } from 'react';

const FocusModeStats = ({ onEnterFocusMode }) => {
  const [stats, setStats] = useState({
    streak: 0,
    totalLessons: 0,
    totalTime: 0,
    lastSession: null,
    achievements: []
  });

  useEffect(() => {
    // Load stats from localStorage
    const savedStreak = localStorage.getItem('focusModeStreak') || 0;
    const savedCompleted = localStorage.getItem('focusModeCompleted') || '[]';
    const completedLessons = JSON.parse(savedCompleted);
    
    const totalTime = completedLessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);
    const lastSession = completedLessons.length > 0 ? completedLessons[0] : null;
    
    // Calculate achievements
    const achievements = [];
    if (parseInt(savedStreak) >= 1) achievements.push({ type: 'streak', value: savedStreak, icon: '🔥' });
    if (completedLessons.length >= 5) achievements.push({ type: 'lessons', value: completedLessons.length, icon: '📚' });
    if (totalTime >= 1800) achievements.push({ type: 'time', value: Math.floor(totalTime / 60), icon: '⏱️' });
    if (completedLessons.length >= 10) achievements.push({ type: 'dedication', value: '10+', icon: '⭐' });
    
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
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Ready to Focus?</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Start your first focus session and build momentum with bite-sized learning
          </p>
          <button
            onClick={onEnterFocusMode}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Focus Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="mr-2">🎯</span>
          Focus Mode Stats
        </h3>
        <button
          onClick={onEnterFocusMode}
          className="text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
        >
          Continue
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.streak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalLessons}</div>
          <div className="text-xs text-gray-500">Lessons</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatTime(stats.totalTime)}</div>
          <div className="text-xs text-gray-500">Total Time</div>
        </div>
      </div>

      {stats.achievements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Achievements</h4>
          <div className="flex space-x-2">
            {stats.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1">
                <span className="text-sm">{achievement.icon}</span>
                <span className="text-xs font-medium text-gray-700">{achievement.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.lastSession && (
        <div className="text-xs text-gray-500">
          Last session: {formatDate(stats.lastSession.completedAt)}
        </div>
      )}
    </div>
  );
};

export default FocusModeStats; 
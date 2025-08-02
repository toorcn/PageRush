'use client';
import React from 'react';

export default function Insights({ score, total, details }) {
  console.log('Insights component received:', { score, total, details });
  
  // Handle undefined or null values
  if (score === undefined || score === null || total === undefined || total === null) {
    console.warn('Insights component received invalid score/total:', { score, total });
    return (
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Performance Insights</h2>
          <p className="text-gray-600">Unable to display results - missing score data</p>
        </div>
      </div>
    );
  }
  
  const percentage = Math.round((score / total) * 100);
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excellent', color: 'green', icon: '🏆' };
    if (percentage >= 80) return { level: 'Great', color: 'blue', icon: '🎉' };
    if (percentage >= 70) return { level: 'Good', color: 'yellow', icon: '👍' };
    if (percentage >= 60) return { level: 'Fair', color: 'orange', icon: '📚' };
    return { level: 'Needs Improvement', color: 'red', icon: '💪' };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Performance Insights</h2>
        <p className="text-gray-600">Here's how you performed on your assessment</p>
      </div>

      {/* Score Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">{performance.icon}</div>
        <div className="text-3xl font-bold text-gray-800 mb-1">
          {score} / {total}
        </div>
        <div className="text-lg text-gray-600 mb-4">
          {percentage}% - {performance.level}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              performance.color === 'green' ? 'bg-green-500' :
              performance.color === 'blue' ? 'bg-blue-500' :
              performance.color === 'yellow' ? 'bg-yellow-500' :
              performance.color === 'orange' ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Performance Message */}
        <div className={`text-sm font-medium ${
          performance.color === 'green' ? 'text-green-700' :
          performance.color === 'blue' ? 'text-blue-700' :
          performance.color === 'yellow' ? 'text-yellow-700' :
          performance.color === 'orange' ? 'text-orange-700' :
          'text-red-700'
        }`}>
          {percentage >= 90 && "Outstanding work! You've mastered this material."}
          {percentage >= 80 && percentage < 90 && "Great job! You have a solid understanding."}
          {percentage >= 70 && percentage < 80 && "Good work! Keep reviewing to improve."}
          {percentage >= 60 && percentage < 70 && "You're on the right track. Focus on weak areas."}
          {percentage < 60 && "Keep studying! Review the material and try again."}
        </div>
      </div>

      {/* Detailed Breakdown */}
      {details && details.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-800">📋 Detailed Breakdown</h3>
          <div className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{detail}</span>
                <span className="text-green-600">✅</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Next Steps</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          {percentage >= 90 && (
            <>
              <li>• Challenge yourself with more advanced topics</li>
              <li>• Help others by explaining concepts you've mastered</li>
            </>
          )}
          {percentage >= 80 && percentage < 90 && (
            <>
              <li>• Review the questions you missed</li>
              <li>• Practice similar problems to reinforce learning</li>
            </>
          )}
          {percentage >= 70 && percentage < 80 && (
            <>
              <li>• Focus on the topics where you struggled</li>
              <li>• Create additional flashcards for weak areas</li>
            </>
          )}
          {percentage >= 60 && percentage < 70 && (
            <>
              <li>• Review the study guide thoroughly</li>
              <li>• Take the quiz again after studying</li>
            </>
          )}
          {percentage < 60 && (
            <>
              <li>• Go back to the study guide and review all material</li>
              <li>• Break down complex topics into smaller parts</li>
              <li>• Consider seeking additional resources or help</li>
            </>
          )}
        </ul>
      </div>

      {/* Retry Option */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
} 
'use client';
import React from 'react';
import { 
  BarChart3, Trophy, PartyPopper, ThumbsUp, BookOpen, Lightbulb, 
  ClipboardList, Check, X, RefreshCw, Flame
} from 'lucide-react';

export default function Insights({ score, total, details }) {
  console.log('Insights component received:', { score, total, details });
  
  // Handle undefined or null values
  if (score === undefined || score === null || total === undefined || total === null) {
    console.warn('Insights component received invalid score/total:', { score, total });
    return (
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <BarChart3 className="w-6 h-6" /> Performance Insights
          </h2>
          <p className="text-gray-600">Unable to display results - missing score data</p>
        </div>
      </div>
    );
  }
  
  const percentage = Math.round((score / total) * 100);
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excellent', color: 'green', icon: <Trophy className="w-10 h-10 text-yellow-500" /> };
    if (percentage >= 80) return { level: 'Great', color: 'blue', icon: <PartyPopper className="w-10 h-10 text-blue-500" /> };
    if (percentage >= 70) return { level: 'Good', color: 'yellow', icon: <ThumbsUp className="w-10 h-10 text-yellow-500" /> };
    if (percentage >= 60) return { level: 'Fair', color: 'orange', icon: <BookOpen className="w-10 h-10 text-orange-500" /> };
    return { level: 'Needs Improvement', color: 'red', icon: <Flame className="w-10 h-10 text-red-500" /> };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <BarChart3 className="w-6 h-6" /> Performance Insights
        </h2>
        <p className="text-gray-600">Here's how you performed on your assessment</p>
      </div>

      {/* Score Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center">
        <div className="mb-2">{performance.icon}</div>
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
          <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-1"><ClipboardList className="w-5 h-5" /> Detailed Breakdown</h3>
          <div className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="flex flex-col p-3 bg-gray-50 rounded-lg mb-2">
                <span className="text-gray-800 font-medium mb-1">{detail.question}</span>
                <span className="text-gray-700 mb-1">{detail.feedback}</span>
                <span className="text-xs text-gray-500">
                  Your answer: {detail.userAnswer} | Correct: {detail.correctAnswer}
                </span>
                <span className={`text-sm font-semibold flex items-center gap-1 ${detail.isCorrect ? 'text-green-600' : 'text-red-600'}`}> 
                  {detail.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {detail.isCorrect ? 'Correct' : 'Incorrect'} ({detail.points}/{detail.maxPoints} pts)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-1"><Lightbulb className="w-5 h-5" /> Next Steps</h3>
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
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
} 
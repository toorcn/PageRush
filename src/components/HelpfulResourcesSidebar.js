'use client';
import React from 'react';

export default function HelpfulResourcesSidebar({ history, performanceSummaries, onLoadFromHistory }) {
  // Get the most recent resource of each type
  const getLatestByFeature = (feature) => {
    return history.find(item => item.feature === feature);
  };

  const studyGuide = getLatestByFeature('studyGuide');
  const flashcards = getLatestByFeature('flashcards');
  const quiz = getLatestByFeature('quiz');
  const exam = getLatestByFeature('exam');

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
        <span className="mr-2">🧰</span>
        Helpful Resources
      </h3>
      <div className="space-y-4">
        {studyGuide && (
          <div className="border-b pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-blue-700">Study Guide</span>
              <button
                onClick={() => onLoadFromHistory(studyGuide)}
                className="text-xs text-blue-600 hover:underline"
              >
                View
              </button>
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {studyGuide.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 120) || 'No preview available.'}
            </div>
          </div>
        )}
        {flashcards && (
          <div className="border-b pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-green-700">Flashcards</span>
              <button
                onClick={() => onLoadFromHistory(flashcards)}
                className="text-xs text-green-600 hover:underline"
              >
                View
              </button>
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {flashcards.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 120) || 'No preview available.'}
            </div>
          </div>
        )}
        {quiz && (
          <div className="border-b pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-purple-700">Quiz</span>
              <button
                onClick={() => onLoadFromHistory(quiz)}
                className="text-xs text-purple-600 hover:underline"
              >
                View
              </button>
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {quiz.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 120) || 'No preview available.'}
            </div>
          </div>
        )}
        {exam && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-orange-700">Exam</span>
              <button
                onClick={() => onLoadFromHistory(exam)}
                className="text-xs text-orange-600 hover:underline"
              >
                View
              </button>
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {exam.result?.result?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 120) || 'No preview available.'}
            </div>
          </div>
        )}
        {!studyGuide && !flashcards && !quiz && !exam && (
          <div className="text-xs text-gray-500 text-center py-4">No resources generated yet.</div>
        )}
      </div>
    </div>
  );
} 
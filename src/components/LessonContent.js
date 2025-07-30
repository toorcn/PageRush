'use client';
import React from 'react';
import StudyGuide from './StudyGuide';
import Flashcards from './Flashcards';
import Quiz from './Quiz';
import Exam from './Exam';
import { parseFlashcards, parseQuiz, parseExam } from '../utils/parseGeminiResponse';

const LessonContent = ({ lessonType, content, onComplete, result }) => {
  console.log('LessonContent render:', { lessonType, content: content?.substring(0, 50), result: !!result });
  
  const renderContent = () => {
    if (!content && !result) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Generating your lesson content...</p>
        </div>
      );
    }

    // Use the actual result if available, otherwise fall back to content
    const actualResult = result || { result: { candidates: [{ content: { parts: [{ text: content }] } }] } };
    console.log('Using actualResult:', actualResult);

    switch (lessonType) {
      case 'studyGuide':
        return <StudyGuide content={content} />;
      case 'flashcards':
        return <Flashcards cards={parseFlashcards(actualResult)} />;
      case 'quiz':
        return <Quiz questions={parseQuiz(actualResult)} onSubmit={() => onComplete()} />;
      case 'exam':
        return <Exam questions={parseExam(actualResult)} onSubmit={() => onComplete()} />;
      default:
        return renderDefaultContent(content);
    }
  };



  const renderDefaultContent = (content) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Lesson Content</h3>
          <p className="text-gray-700 text-sm">Your personalized learning material</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((line, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-3">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderContent()}
      
      <div className="flex justify-center pt-6">
        <button
          onClick={onComplete}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
        >
          <span>✅</span>
          <span>Complete Lesson</span>
        </button>
      </div>
    </div>
  );
};

export default LessonContent; 
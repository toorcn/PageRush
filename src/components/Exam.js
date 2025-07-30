'use client';
import React, { useState } from 'react';

export default function Exam({ questions, onSubmit }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(Array(questions.length).fill(null));

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = option;
    setAnswers(newAnswers);
  };

  const handleTextChange = (qIdx, value) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Calculate feedback for each question
    const newFeedback = questions.map((q, i) => {
      if (q.type === 'mcq') {
        return answers[i] === q.answer;
      } else {
        // For short answer, do a simple text comparison
        return answers[i]?.trim().toLowerCase() === q.answer?.trim().toLowerCase();
      }
    });
    setFeedback(newFeedback);
    onSubmit(answers);
  };

  if (!questions || !questions.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-4xl mb-4">📝</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Exam Available</h2>
        <p className="text-gray-600">Try generating an exam from your study materials</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📝 Practice Exam</h2>
        <p className="text-gray-600">Complete exam with mixed question types</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const isSelected = answers[idx];
          const isCorrect = submitted && feedback[idx];
          const isWrong = submitted && isSelected && !feedback[idx];

          return (
            <div key={idx} className="bg-white rounded-xl shadow p-6 space-y-4">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="font-semibold text-lg text-gray-800">
                  {idx + 1}. {q.question}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  q.type === 'mcq' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                </span>
              </div>

              {/* Answer Options for MCQ */}
              {q.type === 'mcq' && q.options && (
                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((opt, oidx) => {
                    const isSelectedOption = answers[idx] === opt;
                    const isCorrectOption = submitted && opt === q.answer;
                    const isWrongOption = submitted && isSelectedOption && !isCorrectOption;

                    return (
                      <button
                        type="button"
                        key={oidx}
                        onClick={() => handleSelect(idx, opt)}
                        disabled={submitted}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all duration-200
                          ${isSelectedOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                          ${isCorrectOption ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : ''}
                          ${isWrongOption ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : ''}
                          hover:border-blue-400 hover:bg-blue-100 disabled:cursor-default
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                        `}
                        aria-pressed={isSelectedOption}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {isCorrectOption && <span className="text-2xl">✅</span>}
                          {isWrongOption && <span className="text-2xl">❌</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Input for Short Answer */}
              {q.type === 'short' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={answers[idx] || ''}
                    onChange={(e) => handleTextChange(idx, e.target.value)}
                    disabled={submitted}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      submitted && isCorrect ? 'border-green-500 bg-green-50' : 
                      submitted && isWrong ? 'border-red-500 bg-red-50' : 
                      'border-gray-300'
                    }`}
                    placeholder="Type your answer here..."
                  />
                </div>
              )}

              {/* Feedback */}
              {submitted && (
                <div className={`mt-3 p-3 rounded-lg ${
                  feedback[idx] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center font-medium">
                    <span className="mr-2">{feedback[idx] ? '✅' : '❌'}</span>
                    {feedback[idx] ? 'Great work!' : 'No worries, try again!'}
                  </div>
                  {!feedback[idx] && (
                    <div className="mt-2 text-sm opacity-80">
                      Correct answer: <span className="font-semibold">{q.answer}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        {!submitted && (
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg"
          >
            Submit Exam
          </button>
        )}
      </form>
    </div>
  );
} 
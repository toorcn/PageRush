'use client';
import React, { useState } from 'react';

export default function Quiz({ questions, onSubmit }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(Array(questions.length).fill(null));
  const [explainedQuestions, setExplainedQuestions] = useState(new Set());

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Calculate feedback for each question
    const newFeedback = questions.map((q, i) => {
      if (!q.options || q.options.length < 2) return false; // Invalid question
      return answers[i] === q.answer;
    });
    setFeedback(newFeedback);
    onSubmit(answers);
  };

  const toggleExplanation = (questionIndex) => {
    const newExplained = new Set(explainedQuestions);
    if (newExplained.has(questionIndex)) {
      newExplained.delete(questionIndex);
    } else {
      newExplained.add(questionIndex);
    }
    setExplainedQuestions(newExplained);
  };

  if (!questions || !questions.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-4xl mb-4">❓</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Quiz Available</h2>
        <p className="text-gray-600">Try generating a quiz from your study materials</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">❓ Quiz</h2>
        <p className="text-gray-600">Test your knowledge with multiple choice questions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const isSelected = answers[idx];
          const isCorrect = submitted && q.answer === answers[idx];
          const isWrong = submitted && isSelected && q.answer !== answers[idx];
          const hasValidOptions = q.options && q.options.length >= 2;

          return (
            <div key={idx} className="bg-white rounded-xl shadow p-6 space-y-4">
              {/* Question */}
              <div className="font-semibold text-lg text-gray-800">
                {idx + 1}. {q.question}
              </div>

              {/* Answer Options */}
              {hasValidOptions ? (
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
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ This question doesn't have proper multiple choice options. 
                    The correct answer is: <span className="font-semibold">{q.answer}</span>
                  </p>
                </div>
              )}

              {/* Feedback */}
              {submitted && (
                <div className={`mt-3 p-3 rounded-lg ${
                  feedback[idx] ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center font-medium">
                      <span className="mr-2">{feedback[idx] ? '✅' : '❌'}</span>
                      {feedback[idx] ? 'Great work!' : 'No worries, try again!'}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExplanation(idx)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
                    >
                      {explainedQuestions.has(idx) ? 'Hide Explanation' : 'Explain Answer'}
                    </button>
                  </div>
                  {!feedback[idx] && (
                    <div className="mt-2 text-sm opacity-80">
                      Correct answer: <span className="font-semibold">{q.answer}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {submitted && explainedQuestions.has(idx) && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Explanation</h4>
                  <p className="text-blue-700 text-sm">
                    {q.explanation || `The correct answer is "${q.answer}" because it best matches the information from your study materials.`}
                  </p>
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
            Submit Quiz
          </button>
        )}
      </form>
    </div>
  );
} 
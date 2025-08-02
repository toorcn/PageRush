'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function Quiz({ questions, onSubmit, currentQuestionIndex, setCurrentQuestionIndex, setTotalQuestions }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(Array(questions.length).fill(null));
  const [explainedQuestions, setExplainedQuestions] = useState(new Set());
  const questionRefs = useRef([]);

  // Set total questions when component mounts
  useEffect(() => {
    setTotalQuestions(questions.length);
  }, [questions.length, setTotalQuestions]);

  // Auto-scroll to current question
  useEffect(() => {
    if (questionRefs.current[currentQuestionIndex]) {
      questionRefs.current[currentQuestionIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentQuestionIndex]);

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = option;
    setAnswers(newAnswers);
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (qIdx < questions.length - 1) {
        setCurrentQuestionIndex(qIdx + 1);
      }
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    console.log('Quiz submission - questions:', questions);
    console.log('Quiz submission - answers:', answers);
    
    // Calculate feedback for each question
    const newFeedback = questions.map((q, i) => {
      if (!q.options || q.options.length < 2) {
        console.log(`Invalid question ${i + 1}:`, q);
        return false; // Invalid question
      }
      const isCorrect = answers[i] === q.answer;
      console.log(`Question ${i + 1}: User answer "${answers[i]}" vs correct "${q.answer}" = ${isCorrect}`);
      return isCorrect;
    });
    setFeedback(newFeedback);
    
    const numCorrect = newFeedback.filter(Boolean).length;
    const totalQuestions = questions.length;
    const percentCorrect = Math.round((numCorrect / totalQuestions) * 100);
    
    console.log('Quiz results:', { numCorrect, totalQuestions, percentCorrect });
    
    // Create details for Insights
    const details = questions.map((q, i) => {
      if (!q.options || q.options.length < 2) return `Question ${i + 1}: Invalid format`;
      return `${i + 1}. ${q.question} — ${answers[i] === q.answer ? 'Correct' : `Incorrect (Correct: ${q.answer})`}`;
    });
    
    const submissionData = { 
      answers, 
      numCorrect, 
      totalQuestions, 
      percentCorrect, 
      details 
    };
    
    console.log('Submitting quiz data:', submissionData);
    onSubmit(submissionData);
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

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Calculate summary after submission
  const numCorrect = feedback.filter(Boolean).length;
  const totalQuestions = questions.length;
  const percentCorrect = Math.round((numCorrect / totalQuestions) * 100);

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

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => navigateToQuestion(idx)}
              className={`
                w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${currentQuestionIndex === idx 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : answers[idx] 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const isSelected = answers[idx];
          const isCorrect = submitted && q.answer === answers[idx];
          const isWrong = submitted && isSelected && q.answer !== answers[idx];
          const hasValidOptions = q.options && q.options.length >= 2;
          const isCurrentQuestion = currentQuestionIndex === idx;

          return (
            <div 
              key={idx} 
              ref={el => questionRefs.current[idx] = el}
              className={`bg-white rounded-xl shadow p-6 space-y-4 transition-all duration-300 ${
                isCurrentQuestion ? 'ring-2 ring-blue-500' : ''
              }`}
            >
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
                <div className="text-red-500 text-sm">Invalid question format</div>
              )}

              {/* Feedback and Explanation */}
              {submitted && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${
                    isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="font-semibold">
                      {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </div>
                    <div className="text-sm mt-1">
                      Correct answer: <span className="font-semibold">{q.answer}</span>
                    </div>
                  </div>
                  
                  {q.explanation && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExplanation(idx)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {explainedQuestions.has(idx) ? 'Hide' : 'Show'} explanation
                      </button>
                      {explainedQuestions.has(idx) && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={submitted || answers.some(a => !a)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitted ? 'Quiz Completed!' : 'Submit Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
} 
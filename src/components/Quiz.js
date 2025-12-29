'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function Quiz({ questions, onSubmit, currentQuestionIndex, setCurrentQuestionIndex, setTotalQuestions }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(Array(questions.length).fill(null));
  const [explainedQuestions, setExplainedQuestions] = useState(new Set());
  const [structuredUnderstanding, setStructuredUnderstanding] = useState({});
  const [isRequestingUnderstanding, setIsRequestingUnderstanding] = useState({});
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

  const handleStructuredUnderstanding = async (qIdx) => {
    const question = questions[qIdx];
    if (!question) return;

    setIsRequestingUnderstanding(prev => ({ ...prev, [qIdx]: true }));

    try {
      const userAnswer = answers[qIdx];
      const correctAnswer = question.answer;

      const text = [
        `Question: ${question.question}`,
        correctAnswer ? `Correct answer: ${correctAnswer}` : '',
        userAnswer ? `Learner's current answer: ${userAnswer}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          promptType: 'structuredUnderstanding',
          geminiApiKey: window.geminiApiKey || localStorage.getItem('geminiApiKey')
        }),
      });

      if (!response.ok) {
        console.error('Failed to get structured understanding:', await response.text());
        alert('Unable to load AI learning guide for this question. Please try again.');
        return;
      }

      const data = await response.json();
      const aiText =
        data.result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.result?.candidates?.[0]?.output_text ||
        '';

      if (!aiText) {
        alert('AI did not return an explanation. Please try again.');
        return;
      }

      setStructuredUnderstanding(prev => ({
        ...prev,
        [qIdx]: aiText
      }));
    } catch (error) {
      console.error('Error requesting structured understanding:', error);
      alert('Failed to contact AI. Please check your API key and try again.');
    } finally {
      setIsRequestingUnderstanding(prev => ({ ...prev, [qIdx]: false }));
    }
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

  // Render markdown-formatted text
  const renderMarkdown = (text) => {
    if (!text || !text.trim()) return null;
    
    return text
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        
        // Handle headers
        if (trimmedLine.startsWith('##')) {
          const content = trimmedLine.replace(/^##+\s*/, '');
          return (
            <h3 key={index} className="text-lg font-semibold text-indigo-900 mt-4 mb-2 first:mt-0">
              {content}
            </h3>
          );
        }
        
        // Handle bullet points
        if (trimmedLine.match(/^[-*]\s/)) {
          const content = trimmedLine.replace(/^[-*]\s/, '');
          // Handle bold text in bullets
          const parts = content.split(/(\*\*.*?\*\*)/);
          return (
            <li key={index} className="ml-6 mb-1.5 text-indigo-800 leading-relaxed list-disc">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </li>
          );
        }
        
        // Handle bold text in regular paragraphs
        if (trimmedLine.includes('**')) {
          const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
          return (
            <p key={index} className="mb-2 text-indigo-800 leading-relaxed">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </p>
          );
        }
        
        // Regular text (skip empty lines)
        if (trimmedLine) {
          return <p key={index} className="mb-2 text-indigo-800 leading-relaxed">{trimmedLine}</p>;
        }
        
        return null;
      })
      .filter(Boolean);
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
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">❓ Quiz</h2>
        <p className="text-gray-600 text-sm lg:text-base">Test your knowledge with multiple choice questions</p>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow p-4 lg:p-6">
        <div className="flex flex-wrap gap-2 lg:gap-3 justify-center">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => navigateToQuestion(idx)}
              className={`
                w-10 h-10 lg:w-12 lg:h-12 rounded-lg text-sm lg:text-base font-medium transition-all duration-200
                ${currentQuestionIndex === idx 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : answers[idx] 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                active:scale-95
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        {questions.map((q, idx) => {
          const isSelected = answers[idx];
          const isCorrect = submitted && q.answer === answers[idx];
          const isWrong = submitted && isSelected && q.answer !== answers[idx];
          const hasValidOptions = q.options && q.options.length >= 2;
          const isCurrentQuestion = currentQuestionIndex === idx;
          const currentUnderstanding = structuredUnderstanding[idx];

          return (
            <div 
              key={idx} 
              ref={el => questionRefs.current[idx] = el}
              className={`bg-white rounded-xl shadow p-4 lg:p-6 space-y-4 lg:space-y-6 transition-all duration-300 ${
                isCurrentQuestion ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Question */}
              <div className="font-semibold text-base lg:text-lg text-gray-800 leading-relaxed">
                {idx + 1}. {q.question}
              </div>

              {/* AI Learning Guide Button - Separate Section */}
              <div className="flex justify-start border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => handleStructuredUnderstanding(idx)}
                  disabled={isRequestingUnderstanding[idx]}
                  className="px-4 py-2 lg:px-5 lg:py-2.5 bg-indigo-600 text-white rounded-lg text-sm lg:text-base font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <span>🤖</span>
                  <span>{isRequestingUnderstanding[idx] ? 'Asking AI…' : 'Get AI Learning Guide'}</span>
                </button>
              </div>

              {/* Answer Options */}
              {hasValidOptions ? (
                <div className="grid grid-cols-1 gap-3 lg:gap-4">
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
                          p-4 lg:p-5 rounded-lg border-2 text-left transition-all duration-200
                          min-h-[60px] lg:min-h-[70px] flex items-center
                          ${isSelectedOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                          ${isCorrectOption ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : ''}
                          ${isWrongOption ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : ''}
                          hover:border-blue-400 hover:bg-blue-100 disabled:cursor-default
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          active:scale-98
                        `}
                        aria-pressed={isSelectedOption}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm lg:text-base leading-relaxed">{opt}</span>
                          {isCorrectOption && <span className="text-2xl lg:text-3xl flex-shrink-0">✅</span>}
                          {isWrongOption && <span className="text-2xl lg:text-3xl flex-shrink-0">❌</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-red-500 text-sm lg:text-base">Invalid question format</div>
              )}

              {/* Feedback and Explanation */}
              {submitted && (
                <div className="space-y-3 lg:space-y-4">
                  <div className={`p-3 lg:p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg lg:text-xl">
                        {isCorrect ? '✅' : '❌'}
                      </span>
                      <span className={`font-semibold text-sm lg:text-base ${
                        isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-sm lg:text-base text-gray-700">
                      {isCorrect ? 'Great job!' : `The correct answer is: ${q.answer}`}
                    </p>
                  </div>

                  {q.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(idx)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="font-semibold text-sm lg:text-base text-blue-700">
                          {explainedQuestions.has(idx) ? 'Hide' : 'Show'} Explanation
                        </span>
                        <span className={`transform transition-transform duration-200 ${
                          explainedQuestions.has(idx) ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </button>
                      {explainedQuestions.has(idx) && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Structured Understanding */}
              {/* AI Structured Understanding Display */}
              {currentUnderstanding && (
                <div className="mt-4 lg:mt-5 p-4 lg:p-5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <div className="font-semibold text-base lg:text-lg text-indigo-900 mb-3 lg:mb-4 flex items-center gap-2">
                    <span>🤖</span>
                    <span>AI Learning Guide</span>
                  </div>
                  <div className="text-sm lg:text-base">
                    {renderMarkdown(currentUnderstanding)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        {!submitted && (
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-8 py-4 lg:px-12 lg:py-5 bg-blue-600 text-white rounded-xl font-bold text-base lg:text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Submit Quiz
            </button>
          </div>
        )}

        {/* Results Summary */}
        {submitted && (
          <div className="bg-white rounded-xl shadow p-6 lg:p-8 text-center">
            <div className="text-4xl lg:text-5xl mb-4">
              {percentCorrect >= 80 ? '🎉' : percentCorrect >= 60 ? '👍' : '📚'}
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
              Quiz Complete!
            </h3>
            <p className="text-lg lg:text-xl font-semibold text-gray-700 mb-4">
              You scored {numCorrect} out of {totalQuestions} ({percentCorrect}%)
            </p>
            <div className={`inline-block px-4 py-2 rounded-full text-sm lg:text-base font-medium ${
              percentCorrect >= 80 ? 'bg-green-100 text-green-700' :
              percentCorrect >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {percentCorrect >= 80 ? 'Excellent!' :
               percentCorrect >= 60 ? 'Good job!' :
               'Keep studying!'}
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 
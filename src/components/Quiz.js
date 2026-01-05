'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AIHelpChat, { ChatFloatingButton } from './AIHelpChat';
import { 
  HelpCircle, Check, X, Bot, ChevronDown, ChevronRight, Lightbulb,
  BookOpen, PartyPopper, ThumbsUp
} from 'lucide-react';

export default function Quiz({ questions, onSubmit, currentQuestionIndex, setCurrentQuestionIndex, setTotalQuestions, gradingFeedback }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(Array(questions.length).fill(null));
  const [explainedQuestions, setExplainedQuestions] = useState(new Set());
  const [questionsWithSuggestions, setQuestionsWithSuggestions] = useState(questions);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [initialChatMessage, setInitialChatMessage] = useState(null);
  const [chatWidth, setChatWidth] = useState(384); // 24rem = 384px
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [expandedHints, setExpandedHints] = useState(new Set());
  const questionRefs = useRef([]);
  const observerRef = useRef(null);
  const isScrollingRef = useRef(false);

  // Robust scroll to question function that works well on mobile
  const scrollToQuestion = useCallback((idx) => {
    const element = questionRefs.current[idx];
    if (!element) return;

    // Prevent scroll conflicts
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    // Get element position
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate target position (center the element with some offset for header)
    const headerOffset = 100; // Account for any fixed headers
    const elementCenter = rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const targetPosition = scrollTop + rect.top - viewportCenter + elementCenter + headerOffset;

    // Use smooth scroll with fallback
    try {
      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, Math.max(0, targetPosition));
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 500);
  }, []);

  // Handle question navigation click
  const handleQuestionNavClick = useCallback((idx) => {
    setCurrentQuestionIndex(idx);
    // Small delay to ensure state is updated before scrolling
    requestAnimationFrame(() => {
      scrollToQuestion(idx);
    });
  }, [setCurrentQuestionIndex, scrollToQuestion]);

  // Track screen size for responsive padding
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Generate AI suggestions for questions on mount
  useEffect(() => {
    const generateSuggestions = async () => {
      const updatedQuestions = await Promise.all(
        questions.map(async (q, idx) => {
          if (q.aiSuggestions) return q;
          try {
            // Build context with options if MCQ
            let questionContext = `Question: ${q.question}`;
            if (q.options && q.options.length > 0) {
              questionContext += `\nAnswer Choices:\n${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}`;
            }
            questionContext += `\nCorrect answer: ${q.answer}`;
            
            const response = await fetch('/api/gemini-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: questionContext,
                promptType: 'generateQuestionSuggestions',
                geminiApiKey: window.geminiApiKey || localStorage.getItem('geminiApiKey')
              }),
            });
            if (response.ok) {
              const data = await response.json();
              const aiText = data.result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              try {
                const suggestions = JSON.parse(aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
                return { ...q, aiSuggestions: suggestions };
              } catch {
                return { ...q, aiSuggestions: ['What is this asking?', 'Explain key terms', 'Why is this important?'] };
              }
            }
          } catch (error) {
            console.log('Failed to generate suggestions for question', idx, error);
          }
          return { ...q, aiSuggestions: ['What is this asking?', 'Explain key terms', 'Why is this important?'] };
        })
      );
      setQuestionsWithSuggestions(updatedQuestions);
    };
    if (questions.length > 0) generateSuggestions();
  }, [questions]);

  // Intersection Observer to track which question is in view
  useEffect(() => {
    if (!chatOpen) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.questionIndex, 10);
            if (!isNaN(idx)) {
              setActiveQuestionIndex(idx);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -100px 0px' }
    );

    questionRefs.current.forEach((ref) => {
      if (ref) observerRef.current.observe(ref);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [chatOpen, questionsWithSuggestions]);

  useEffect(() => {
    setTotalQuestions(questions.length);
  }, [questions.length, setTotalQuestions]);

  // Set submitted state when gradingFeedback is received (handles component remount)
  useEffect(() => {
    if (gradingFeedback && gradingFeedback.details) {
      setSubmitted(true);
      // Restore answers from grading feedback
      const restoredAnswers = questions.map((_, idx) => {
        const feedback = gradingFeedback.details.find(d => d.questionIndex === idx);
        return feedback?.userAnswer || '';
      });
      setAnswers(restoredAnswers);
    }
  }, [gradingFeedback, questions]);

  // Scroll to question when currentQuestionIndex changes from external source
  useEffect(() => {
    // Only scroll if not triggered by our own navigation
    if (!isScrollingRef.current && questionRefs.current[currentQuestionIndex]) {
      scrollToQuestion(currentQuestionIndex);
    }
  }, [currentQuestionIndex, scrollToQuestion]);

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = option;
    setAnswers(newAnswers);
    setTimeout(() => {
      if (qIdx < questions.length - 1) {
        handleQuestionNavClick(qIdx + 1);
      }
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const newFeedback = questions.map((q, i) => {
      if (!q.options || q.options.length < 2) return false;
      return answers[i] === q.answer;
    });
    setFeedback(newFeedback);
    // Pass just the answers array to onSubmit for grading
    onSubmit(answers);
  };

  const handleSuggestionClick = (questionIdx, suggestion) => {
    setActiveQuestionIndex(questionIdx);
    setInitialChatMessage(suggestion);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setInitialChatMessage(null);
  };

  const toggleExplanation = (questionIndex) => {
    const newExplained = new Set(explainedQuestions);
    if (newExplained.has(questionIndex)) newExplained.delete(questionIndex);
    else newExplained.add(questionIndex);
    setExplainedQuestions(newExplained);
  };

  const toggleHints = (questionIndex) => {
    const newExpanded = new Set(expandedHints);
    if (newExpanded.has(questionIndex)) newExpanded.delete(questionIndex);
    else newExpanded.add(questionIndex);
    setExpandedHints(newExpanded);
  };

  const numCorrect = feedback.filter(Boolean).length;
  const totalQuestions = questions.length;
  const percentCorrect = Math.round((numCorrect / totalQuestions) * 100);

  if (!questions || !questions.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Quiz Available</h2>
        <p className="text-gray-600">Try generating a quiz from your study materials</p>
      </div>
    );
  }

  const activeQuestion = questionsWithSuggestions[activeQuestionIndex];

  return (
    <div className="relative">
      <div className={`transition-all duration-300`} style={chatOpen && isLargeScreen ? { paddingRight: `${chatWidth + 16}px` } : {}}>
        {/* Quiz Content */}
        <div className="space-y-6 lg:space-y-8">
          <div className="text-center">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6" /> Quiz
            </h2>
            <p className="text-gray-600 text-sm lg:text-base">Test your knowledge with multiple choice questions</p>
          </div>

          {/* Question Navigation */}
          <div className="bg-white rounded-xl shadow p-4 lg:p-6 sticky top-0 z-10">
            <div className="flex flex-wrap gap-2 lg:gap-3 justify-center">
              {questions.map((q, idx) => {
                const apiFeedback = gradingFeedback?.details?.find(d => d.questionIndex === idx);
                const isSubmittedCorrect = submitted && (apiFeedback?.isCorrect || answers[idx] === q.answer);
                const isSubmittedPartial = submitted && apiFeedback && !apiFeedback.isCorrect && apiFeedback.points > 0;
                const isSubmittedWrong = submitted && !isSubmittedCorrect && !isSubmittedPartial;
                
                let navButtonClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200'; // default unanswered
                if (currentQuestionIndex === idx && !submitted) {
                  navButtonClass = 'bg-blue-500 text-white shadow-lg';
                } else if (isSubmittedCorrect) {
                  navButtonClass = 'bg-green-500 text-white';
                } else if (isSubmittedPartial) {
                  navButtonClass = 'bg-yellow-400 text-yellow-900';
                } else if (isSubmittedWrong) {
                  navButtonClass = 'bg-red-400 text-white';
                } else if (answers[idx]) {
                  navButtonClass = 'bg-green-100 text-green-700 border border-green-300';
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuestionNavClick(idx)}
                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg text-sm lg:text-base font-medium transition-colors duration-200 touch-manipulation
                      ${navButtonClass}
                      ${currentQuestionIndex === idx && submitted ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                      ${chatOpen && activeQuestionIndex === idx ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            {questionsWithSuggestions.map((q, idx) => {
              const isCorrect = submitted && q.answer === answers[idx];
              const hasValidOptions = q.options && q.options.length >= 2;
              const isCurrentQuestion = currentQuestionIndex === idx;
              const isActiveInChat = chatOpen && activeQuestionIndex === idx;

              return (
                <div 
                  key={idx} 
                  ref={el => questionRefs.current[idx] = el}
                  data-question-index={idx}
                  className={`bg-white rounded-xl shadow p-4 lg:p-6 space-y-4 transition-all duration-300 
                    ${isCurrentQuestion ? 'ring-2 ring-blue-500' : ''} 
                    ${isActiveInChat ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
                >
                  {/* Question */}
                  <div className="font-semibold text-base lg:text-lg text-gray-800 leading-relaxed">
                    {idx + 1}. {q.question}
                  </div>

                  {/* AI Help Suggestions - Expandable */}
                  {q.aiSuggestions && q.aiSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleHints(idx)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {expandedHints.has(idx) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Lightbulb className="w-4 h-4" />
                        <span className="font-medium">
                          {expandedHints.has(idx) ? 'Hide hints' : 'Need a hint?'}
                        </span>
                      </button>
                      {expandedHints.has(idx) && (
                        <div className="flex flex-wrap items-center gap-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                          {q.aiSuggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleSuggestionClick(idx, suggestion)}
                              className={`px-3 py-1.5 rounded-full text-xs transition-colors flex items-center gap-1.5 ${
                                isActiveInChat 
                                  ? 'bg-indigo-600 text-white border border-indigo-600' 
                                  : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                              }`}
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>{suggestion}</span>
                            </button>
                          ))}
                          <span className="text-gray-300 mx-1">|</span>
                          <button
                            type="button"
                            onClick={() => { setActiveQuestionIndex(idx); setChatOpen(true); }}
                            className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 hover:underline"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>Ask freely</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

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
                            className={`p-4 lg:p-5 rounded-lg border-2 text-left transition-all duration-200 min-h-[60px] lg:min-h-[70px] flex items-center
                              ${isSelectedOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                              ${isCorrectOption ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : ''}
                              ${isWrongOption ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : ''}
                              hover:border-blue-400 hover:bg-blue-100 disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-98`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm lg:text-base leading-relaxed">{opt}</span>
                              {isCorrectOption && <Check className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />}
                              {isWrongOption && <X className="w-6 h-6 lg:w-8 lg:h-8 text-red-600 flex-shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-red-500 text-sm lg:text-base">Invalid question format</div>
                  )}

                  {/* Feedback */}
                  {submitted && (
                    <div className="space-y-3 lg:space-y-4">
                      {/* Get feedback from API if available, otherwise use local comparison */}
                      {(() => {
                        const apiFeedback = gradingFeedback?.details?.find(d => d.questionIndex === idx);
                        const isCorrectResult = apiFeedback ? apiFeedback.isCorrect : isCorrect;
                        const userAnswerDisplay = apiFeedback?.userAnswer || answers[idx] || 'No answer provided';
                        const feedbackText = apiFeedback?.feedback;
                        const points = apiFeedback ? `${apiFeedback.points}/${apiFeedback.maxPoints} pts` : null;
                        
                        return (
                          <>
                            <div className={`p-3 lg:p-4 rounded-lg ${isCorrectResult ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {isCorrectResult ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
                                  <span className={`font-semibold text-sm lg:text-base ${isCorrectResult ? 'text-green-700' : 'text-red-700'}`}>
                                    {isCorrectResult ? 'Correct!' : 'Incorrect'}
                                  </span>
                                </div>
                                {points && (
                                  <span className={`text-sm font-medium ${isCorrectResult ? 'text-green-600' : 'text-red-600'}`}>
                                    {points}
                                  </span>
                                )}
                              </div>
                              
                              {/* Show user's answer */}
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Your answer:</span> {userAnswerDisplay}
                              </div>
                              
                              {/* Show correct answer if wrong */}
                              {!isCorrectResult && (
                                <div className="text-sm text-gray-700 mb-2">
                                  <span className="font-medium">Correct answer:</span> {q.answer}
                                </div>
                              )}
                              
                              {/* Show API feedback if available */}
                              {feedbackText && (
                                <p className="text-sm lg:text-base text-gray-700 mt-2 pt-2 border-t border-current border-opacity-20">
                                  {feedbackText}
                                </p>
                              )}
                            </div>

                            {q.explanation && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                                <button type="button" onClick={() => toggleExplanation(idx)} className="flex items-center justify-between w-full text-left">
                                  <span className="font-semibold text-sm lg:text-base text-blue-700">
                                    {explainedQuestions.has(idx) ? 'Hide' : 'Show'} Explanation
                                  </span>
                                  <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${explainedQuestions.has(idx) ? 'rotate-180' : ''}`} />
                                </button>
                                {explainedQuestions.has(idx) && (
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-sm lg:text-base text-gray-700 leading-relaxed">{q.explanation}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit Button */}
            {!submitted && (
              <div className="flex justify-center">
                <button type="submit" className="px-8 py-4 lg:px-12 lg:py-5 bg-blue-600 text-white rounded-xl font-bold text-base lg:text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                  Submit Quiz
                </button>
              </div>
            )}

            {/* Results Summary */}
            {submitted && (
              <div className="bg-white rounded-xl shadow p-6 lg:p-8 text-center">
                <div className="mb-4">
                  {percentCorrect >= 80 ? <PartyPopper className="w-12 h-12 lg:w-14 lg:h-14 mx-auto text-yellow-500" /> : percentCorrect >= 60 ? <ThumbsUp className="w-12 h-12 lg:w-14 lg:h-14 mx-auto text-blue-500" /> : <BookOpen className="w-12 h-12 lg:w-14 lg:h-14 mx-auto text-gray-500" />}
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h3>
                <p className="text-lg lg:text-xl font-semibold text-gray-700 mb-4">
                  You scored {numCorrect} out of {totalQuestions} ({percentCorrect}%)
                </p>
                <div className={`inline-block px-4 py-2 rounded-full text-sm lg:text-base font-medium ${
                  percentCorrect >= 80 ? 'bg-green-100 text-green-700' : percentCorrect >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {percentCorrect >= 80 ? 'Excellent!' : percentCorrect >= 60 ? 'Good job!' : 'Keep studying!'}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* AI Chat Panel - Desktop: Fixed Position on Right, Mobile: Handled by AIHelpChat */}
      {chatOpen && (
        <>
          {/* Desktop */}
          <div 
            className="fixed top-4 right-4 bottom-4 z-40 hidden lg:block"
            style={{ width: `${chatWidth}px` }}
          >
            <AIHelpChat
              question={activeQuestion}
              questionIndex={activeQuestionIndex}
              userAnswer={answers[activeQuestionIndex]}
              correctAnswer={activeQuestion?.answer}
              onClose={closeChat}
              initialMessage={initialChatMessage}
              onClearInitialMessage={() => setInitialChatMessage(null)}
              panelWidth={chatWidth}
              onWidthChange={setChatWidth}
              minWidth={320}
              maxWidth={600}
            />
          </div>
          {/* Mobile - AIHelpChat handles its own overlay */}
          <div className="lg:hidden">
            <AIHelpChat
              question={activeQuestion}
              questionIndex={activeQuestionIndex}
              userAnswer={answers[activeQuestionIndex]}
              correctAnswer={activeQuestion?.answer}
              onClose={closeChat}
              initialMessage={initialChatMessage}
              onClearInitialMessage={() => setInitialChatMessage(null)}
            />
          </div>
        </>
      )}

      {/* Floating chat button for mobile when chat is closed but available */}
      {/* Removed - chat is now opened from within the hints dropdown */}
    </div>
  );
}

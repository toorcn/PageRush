'use client';
import React, { useState, useEffect, useRef } from 'react';
import LottieLoader from './LottieLoader';
import AIHelpChat from './AIHelpChat';
import { 
  HelpCircle, Pencil, MessageSquare, FileText, Square, Check, X, 
  ThumbsUp, Target, Lightbulb, ClipboardList, BarChart3, AlertTriangle, 
  BookOpen, Bot, ChevronDown, ChevronRight
} from 'lucide-react';

export default function Exam({ questions, onSubmit, feedback, currentQuestionIndex, setCurrentQuestionIndex, setTotalQuestions, onSaveResults, examMode = 'standard' }) {
  if (feedback && !Array.isArray(feedback)) {
    console.error('Exam: feedback prop is not an array', feedback);
    feedback = [];
  }
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [showPerformanceSummary, setShowPerformanceSummary] = useState(false);
  const [aiTopicExtraction, setAiTopicExtraction] = useState({});
  const [individualFeedback, setIndividualFeedback] = useState({});
  const [isCheckingAnswer, setIsCheckingAnswer] = useState({});
  const [questionsWithSuggestions, setQuestionsWithSuggestions] = useState(questions);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [initialChatMessage, setInitialChatMessage] = useState(null);
  const [chatWidth, setChatWidth] = useState(384);
  const [currentExamMode, setCurrentExamMode] = useState(examMode);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [expandedHints, setExpandedHints] = useState(new Set());
  const questionRefs = useRef([]);
  const observerRef = useRef(null);

  // Track screen size for responsive padding
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Generate AI suggestions for questions
  useEffect(() => {
    const generateSuggestions = async () => {
      const updatedQuestions = await Promise.all(
        questions.map(async (q, idx) => {
          if (q.aiSuggestions) return q;
          try {
            const response = await fetch('/api/gemini-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `${q.question}\nCorrect answer: ${q.answer}`,
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
                return { ...q, aiSuggestions: ['Explain this concept', 'Why is this important?', 'Help me understand'] };
              }
            }
          } catch (error) {
            console.log('Failed to generate suggestions', idx, error);
          }
          return { ...q, aiSuggestions: ['Explain this concept', 'Why is this important?', 'Help me understand'] };
        })
      );
      setQuestionsWithSuggestions(updatedQuestions);
    };
    if (questions.length > 0) generateSuggestions();
  }, [questions]);

  useEffect(() => {
    setTotalQuestions(questions.length);
  }, [questions.length, setTotalQuestions]);

  // Set submitted state and restore answers when feedback is received (handles component remount)
  useEffect(() => {
    if (feedback && feedback.length > 0) {
      setSubmitted(true);
      setShowPerformanceSummary(true);
      // Restore answers from feedback
      const restoredAnswers = questions.map((_, idx) => {
        const fb = feedback[idx];
        return fb?.userAnswer || '';
      });
      setAnswers(restoredAnswers);
    }
  }, [feedback, questions]);

  useEffect(() => {
    if (questionRefs.current[currentQuestionIndex]) {
      questionRefs.current[currentQuestionIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentQuestionIndex]);

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

  const handleCheckAnswer = async (qIdx) => {
    if (!answers[qIdx] || answers[qIdx].trim() === '') {
      alert('Please provide an answer before checking.');
      return;
    }
    setIsCheckingAnswer(prev => ({ ...prev, [qIdx]: true }));
    try {
      const response = await fetch('/api/grade-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswers: [answers[qIdx]],
          quiz: [questions[qIdx]],
          geminiApiKey: window.geminiApiKey || localStorage.getItem('geminiApiKey')
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setIndividualFeedback(prev => ({ ...prev, [qIdx]: data.details?.[0] || data }));
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
    } finally {
      setIsCheckingAnswer(prev => ({ ...prev, [qIdx]: false }));
    }
  };

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

  const handleSuggestionClick = (questionIdx, suggestion) => {
    setActiveQuestionIndex(questionIdx);
    setInitialChatMessage(suggestion);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setInitialChatMessage(null);
  };

  const toggleHints = (questionIndex) => {
    const newExpanded = new Set(expandedHints);
    if (newExpanded.has(questionIndex)) newExpanded.delete(questionIndex);
    else newExpanded.add(questionIndex);
    setExpandedHints(newExpanded);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setIsAssessing(true);
    await extractTopicsWithAI();
    await onSubmit(answers);
    setIsAssessing(false);
    setShowPerformanceSummary(true);
  };

  const extractTopicsWithAI = async () => {
    try {
      const questionsSummary = questions.map((q, idx) => `Question ${idx + 1}: ${q.question} | Answer: ${q.answer}`).join('\n');
      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: questionsSummary,
          promptType: 'extractTopics',
          geminiApiKey: window.geminiApiKey || localStorage.getItem('geminiApiKey')
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const aiTopics = parseTopicsFromAI(data);
          setAiTopicExtraction(aiTopics);
        }
      }
    } catch (error) {
      console.log('AI topic extraction failed:', error);
    }
  };

  const parseTopicsFromAI = (aiResponse) => {
    try {
      const text = aiResponse.result.candidates[0].content.parts[0].text;
      const topics = JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, ''));
      const topicMapping = {};
      questions.forEach((q, idx) => {
        const questionText = q.question.toLowerCase();
        const matchingTopics = topics.filter(topic => 
          questionText.includes(topic.toLowerCase()) || 
          topic.toLowerCase().split(' ').some(word => questionText.includes(word))
        );
        topicMapping[idx] = matchingTopics.length > 0 ? matchingTopics : ['general knowledge'];
      });
      return topicMapping;
    } catch (error) {
      console.log('Failed to parse AI topics:', error);
      return {};
    }
  };

  const generatePerformanceSummary = () => {
    if (!feedback || !questions) return null;
    const totalQuestions = questions.length;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const earnedPoints = feedback.reduce((sum, f) => sum + (f?.points || 0), 0);
    const percentage = Math.round((earnedPoints / totalPoints) * 100);

    const topicPerformance = {};
    questions.forEach((q, idx) => {
      const topics = aiTopicExtraction[idx] || ['general knowledge'];
      topics.forEach(topic => {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { total: 0, earned: 0, questions: [] };
        }
        topicPerformance[topic].total += q.points || 1;
        topicPerformance[topic].earned += feedback[idx]?.points || 0;
      });
    });

    const strongTopics = [];
    const weakTopics = [];
    const recommendations = [];

    Object.entries(topicPerformance).forEach(([topic, data]) => {
      const topicPercentage = Math.round((data.earned / data.total) * 100);
      const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1);
      if (topicPercentage >= 80) {
        strongTopics.push(`${topicLabel} (${topicPercentage}%)`);
      } else if (topicPercentage < 60) {
        weakTopics.push(`${topicLabel} (${topicPercentage}%)`);
        recommendations.push(`Focus on understanding ${topicLabel.toLowerCase()}`);
      }
    });

    return { totalQuestions, totalPoints, earnedPoints, percentage, topicPerformance, strongTopics, weakTopics, recommendations };
  };

  const getQuestionTypeIcon = (type) => {
    const icons = { 
      mcq: <HelpCircle className="w-4 h-4" />,
      'multiple-choice': <HelpCircle className="w-4 h-4" />,
      shortAnswer: <Pencil className="w-4 h-4" />,
      'short-answer': <Pencil className="w-4 h-4" />,
      discuss: <MessageSquare className="w-4 h-4" />,
      essay: <MessageSquare className="w-4 h-4" />,
      describe: <FileText className="w-4 h-4" />, 
      fillBlanks: <Square className="w-4 h-4" /> 
    };
    return icons[type] || <HelpCircle className="w-4 h-4" />;
  };

  const getQuestionTypeLabel = (type) => {
    const labels = { 
      mcq: 'Multiple Choice', 
      'multiple-choice': 'Multiple Choice',
      shortAnswer: 'Short Answer', 
      'short-answer': 'Short Answer',
      discuss: 'Discuss', 
      essay: 'Discuss',
      describe: 'Describe', 
      fillBlanks: 'Fill in the Blanks' 
    };
    return labels[type] || 'Question';
  };

  const getQuestionTypeColor = (type) => {
    const colors = { 
      mcq: 'bg-purple-100 text-purple-700', 
      'multiple-choice': 'bg-purple-100 text-purple-700',
      shortAnswer: 'bg-blue-100 text-blue-700', 
      'short-answer': 'bg-blue-100 text-blue-700',
      discuss: 'bg-green-100 text-green-700', 
      essay: 'bg-green-100 text-green-700',
      describe: 'bg-orange-100 text-orange-700', 
      fillBlanks: 'bg-yellow-100 text-yellow-700' 
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (!questions || !questions.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Exam Available</h2>
        <p className="text-gray-600">Try generating an exam from your study materials</p>
      </div>
    );
  }

  const performanceSummary = generatePerformanceSummary();
  const activeQuestion = questionsWithSuggestions[activeQuestionIndex];

  return (
    <div className="relative">
      <div className={`transition-all duration-300`} style={chatOpen && isLargeScreen ? { paddingRight: `${chatWidth + 16}px` } : {}}>
        {/* Exam Content */}
        <div className="space-y-6 lg:space-y-8 transition-all duration-300">
          <div className="text-center">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <ClipboardList className="w-6 h-6" /> Practice Exam
            </h2>
            <p className="text-gray-600 text-sm lg:text-base">Complete exam with mixed question types</p>
          </div>

      {/* Exam Mode Selector */}
      {!submitted && (
        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Exam Mode</h3>
              <p className="text-sm text-gray-600">Choose how you want to take this exam</p>
            </div>
            <div className="flex space-x-2">
              <button type="button" onClick={() => setCurrentExamMode('standard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${currentExamMode === 'standard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <ClipboardList className="w-4 h-4" /> Standard Mode
              </button>
              <button type="button" onClick={() => setCurrentExamMode('practice')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${currentExamMode === 'practice' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <Target className="w-4 h-4" /> Practice Mode
              </button>
            </div>
          </div>
          {currentExamMode === 'practice' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> <strong>Practice Mode:</strong> Get immediate feedback on each question.</p>
            </div>
          )}
        </div>
      )}

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow p-4 lg:p-6">
        <div className="flex flex-wrap gap-2 lg:gap-3 justify-center">
          {questions.map((q, idx) => (
            <button key={idx} onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 flex items-center justify-center
                ${currentQuestionIndex === idx ? 'bg-blue-500 text-white shadow-lg' : answers[idx] ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95`}
              title={`${idx + 1}. ${getQuestionTypeLabel(q.type)}`}>
              {getQuestionTypeIcon(q.type)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            {questionsWithSuggestions.map((q, idx) => {
          const questionFeedback = feedback && feedback[idx];
          const isCorrect = submitted && questionFeedback?.isCorrect;
          const currentIndividualFeedback = individualFeedback[idx];
          const isCurrentQuestion = currentQuestionIndex === idx;
          const isActiveInChat = chatOpen && activeQuestionIndex === idx;

          return (
            <div key={idx} ref={el => questionRefs.current[idx] = el}
              data-question-index={idx}
              className={`bg-white rounded-xl shadow p-4 lg:p-6 space-y-4 lg:space-y-6 transition-all duration-300 
                ${isCurrentQuestion ? 'ring-2 ring-blue-500' : ''} 
                ${isActiveInChat ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}>
              
              {/* Question Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                <div className="font-semibold text-base lg:text-lg text-gray-800 leading-relaxed flex-1 min-w-0">
                  {idx + 1}. {q.question}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:gap-3 flex-shrink-0">
                  <span className={`px-2 lg:px-3 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-medium ${getQuestionTypeColor(q.type)}`}>
                    {getQuestionTypeIcon(q.type)} {getQuestionTypeLabel(q.type)}
                  </span>
                  <span className="px-2 lg:px-3 py-1 lg:py-2 bg-gray-100 text-gray-600 rounded text-xs lg:text-sm font-medium">
                    {q.points || 1} pt{q.points !== 1 ? 's' : ''}
                  </span>
                </div>
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
                    <div className="flex flex-wrap gap-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                      {q.aiSuggestions.map((suggestion, sIdx) => (
                        <button key={sIdx} type="button" onClick={() => handleSuggestionClick(idx, suggestion)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-colors flex items-center gap-1.5 ${
                            isActiveInChat 
                              ? 'bg-indigo-600 text-white border border-indigo-600' 
                              : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                          }`}>
                          <Bot className="w-3.5 h-3.5" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Answer Options for MCQ */}
              {(q.type === 'mcq' || q.type === 'multiple-choice') && q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 gap-3 lg:gap-4">
                  {q.options.map((opt, oidx) => {
                    const isSelectedOption = answers[idx] === opt;
                    const isCorrectOption = submitted && opt === q.answer;
                    const isWrongOption = submitted && isSelectedOption && !isCorrectOption;
                    return (
                      <button type="button" key={oidx} onClick={() => handleSelect(idx, opt)} disabled={submitted}
                        className={`p-4 lg:p-5 rounded-lg border-2 text-left transition-all duration-200 min-h-[60px] lg:min-h-[70px] flex items-center
                          ${isSelectedOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                          ${isCorrectOption ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : ''}
                          ${isWrongOption ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : ''}
                          hover:border-blue-400 hover:bg-blue-100 disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm lg:text-base leading-relaxed">{opt}</span>
                          {isCorrectOption && <Check className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />}
                          {isWrongOption && <X className="w-6 h-6 lg:w-8 lg:h-8 text-red-600 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Input for other question types (or MCQ without options as fallback) */}
              {((q.type !== 'mcq' && q.type !== 'multiple-choice') || !q.options || q.options.length === 0) && (
                <div className="space-y-2">
                  <textarea value={answers[idx] || ''} onChange={(e) => handleTextChange(idx, e.target.value)} disabled={submitted}
                    rows={q.type === 'discuss' || q.type === 'describe' ? 4 : 2}
                    className={`w-full px-4 py-3 lg:py-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none text-sm lg:text-base
                      ${submitted && isCorrect ? 'border-green-500 bg-green-50' : submitted && questionFeedback?.points > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    placeholder={q.type === 'shortAnswer' ? 'Type your brief answer here...' : q.type === 'discuss' ? 'Discuss the topic in detail...' : 'Type your answer here...'}
                  />
                </div>
              )}

              {/* Check Answer Button (Practice Mode) */}
              {!submitted && currentExamMode === 'practice' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => handleCheckAnswer(idx)}
                    disabled={isCheckingAnswer[idx] || !answers[idx] || answers[idx].trim() === ''}
                    className="px-4 py-2 lg:px-6 lg:py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm lg:text-base">
                    {isCheckingAnswer[idx] ? 'Checking...' : 'Check Answer'}
                  </button>
                </div>
              )}

              {/* Immediate Feedback for Practice Mode */}
              {!submitted && currentExamMode === 'practice' && currentIndividualFeedback && (
                <div className={`mt-3 p-4 lg:p-5 rounded-lg ${currentIndividualFeedback.isCorrect ? 'bg-green-50 text-green-700' : currentIndividualFeedback.points > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center font-medium text-sm lg:text-base gap-2">
                      {currentIndividualFeedback.isCorrect ? <Check className="w-5 h-5" /> : currentIndividualFeedback.points > 0 ? <ThumbsUp className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      {currentIndividualFeedback.isCorrect ? 'Correct!' : currentIndividualFeedback.points > 0 ? 'Partial credit!' : 'Incorrect'}
                    </div>
                    <div className="text-sm lg:text-base font-semibold">{currentIndividualFeedback.points}/{currentIndividualFeedback.maxPoints || 1} points</div>
                  </div>
                  <div className="text-sm lg:text-base mb-3 lg:mb-4 leading-relaxed">
                    {typeof currentIndividualFeedback.feedback === 'string' ? currentIndividualFeedback.feedback : currentIndividualFeedback.explanation || 'Feedback available'}
                  </div>
                  {!currentIndividualFeedback.isCorrect && (
                    <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-1 text-sm lg:text-base flex items-center gap-1"><FileText className="w-4 h-4" /> Expected answer:</div>
                      <div className="text-sm lg:text-base opacity-80 leading-relaxed">{q.answer}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Submitted Feedback */}
              {submitted && questionFeedback && (
                <div className={`mt-3 p-4 lg:p-5 rounded-lg ${questionFeedback.isCorrect ? 'bg-green-50 text-green-700' : questionFeedback.points > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center font-medium text-sm lg:text-base gap-2">
                      {questionFeedback.isCorrect ? <Check className="w-5 h-5" /> : questionFeedback.points > 0 ? <ThumbsUp className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      {questionFeedback.isCorrect ? 'Great work!' : questionFeedback.points > 0 ? 'Partial credit!' : 'Room for improvement'}
                    </div>
                    <div className="text-sm lg:text-base font-semibold">{questionFeedback.points}/{questionFeedback.maxPoints} points</div>
                  </div>
                  
                  {/* Show user's answer */}
                  <div className="text-sm mb-2 opacity-90">
                    <span className="font-medium">Your answer:</span> {questionFeedback.userAnswer || answers[idx] || 'No answer provided'}
                  </div>
                  
                  <div className="text-sm lg:text-base mb-3 lg:mb-4 leading-relaxed">
                    {typeof questionFeedback.feedback === 'string' ? questionFeedback.feedback : JSON.stringify(questionFeedback.feedback)}
                  </div>
                  {!questionFeedback.isCorrect && (
                    <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-1 text-sm lg:text-base flex items-center gap-1"><FileText className="w-4 h-4" /> Expected answer:</div>
                      <div className="text-sm lg:text-base opacity-80 leading-relaxed">{q.answer}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        {!submitted && (
          <div className="flex justify-center">
            <button type="submit" className="w-full sm:w-auto px-8 py-4 lg:px-12 lg:py-5 bg-blue-600 text-white rounded-xl font-bold text-base lg:text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              Submit Exam
            </button>
          </div>
        )}

        {/* Assessment Loading */}
        {isAssessing && (
          <div className="text-center py-8 lg:py-12">
            <LottieLoader text="Assessing your answers with AI..." size="large" />
            <p className="text-sm lg:text-base text-gray-500 mt-2">This may take a moment for open-ended questions</p>
          </div>
        )}
      </form>

      {/* Performance Summary */}
      {submitted && performanceSummary && showPerformanceSummary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="text-center">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6" /> Performance Summary
            </h3>
            <p className="text-gray-600 text-sm lg:text-base">Your comprehensive exam results</p>
          </div>

          <div className="bg-white rounded-lg p-4 lg:p-6 space-y-4 lg:space-y-6">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">{performanceSummary.percentage}%</div>
              <div className="text-gray-600 text-sm lg:text-base">{performanceSummary.earnedPoints}/{performanceSummary.totalPoints} points earned</div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm lg:text-base">Performance by Topic:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                {Object.entries(performanceSummary.topicPerformance).map(([topic, data]) => {
                  const percentage = Math.round((data.earned / data.total) * 100);
                  const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
                  return (
                    <div key={topic} className="bg-gray-50 rounded-lg p-3 lg:p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm lg:text-base">{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                        <span className={`font-bold ${colorClass} text-sm lg:text-base`}>{percentage}%</span>
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600">{data.earned}/{data.total} points</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {performanceSummary.strongTopics.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 lg:p-5">
                  <h5 className="font-semibold text-green-800 mb-2 text-sm lg:text-base flex items-center gap-1"><Check className="w-4 h-4" /> Strong Topics</h5>
                  <ul className="text-xs lg:text-sm text-green-700 space-y-1 lg:space-y-2">
                    {performanceSummary.strongTopics.map((strength, idx) => (
                      <li key={idx} className="flex items-start"><span className="mr-2 mt-0.5">•</span><span>{strength}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {performanceSummary.weakTopics.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 lg:p-5">
                  <h5 className="font-semibold text-red-800 mb-2 text-sm lg:text-base flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Weak Topics</h5>
                  <ul className="text-xs lg:text-sm text-red-700 space-y-1 lg:space-y-2">
                    {performanceSummary.weakTopics.map((weakness, idx) => (
                      <li key={idx} className="flex items-start"><span className="mr-2 mt-0.5">•</span><span>{weakness}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Study Recommendations */}
            {performanceSummary.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 lg:p-5">
                <h5 className="font-semibold text-blue-800 mb-2 text-sm lg:text-base flex items-center gap-1"><BookOpen className="w-4 h-4" /> Study Recommendations</h5>
                <ul className="text-xs lg:text-sm text-blue-700 space-y-1 lg:space-y-2">
                  {performanceSummary.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start"><span className="mr-2 mt-0.5">•</span><span>{rec}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
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
    </div>
  );
}

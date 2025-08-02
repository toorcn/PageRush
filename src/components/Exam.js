'use client';
import React, { useState, useEffect, useRef } from 'react';
import LottieLoader from './LottieLoader';

export default function Exam({ questions, onSubmit, feedback, currentQuestionIndex, setCurrentQuestionIndex, setTotalQuestions }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [showPerformanceSummary, setShowPerformanceSummary] = useState(false);
  const [aiTopicExtraction, setAiTopicExtraction] = useState({});
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
  };

  const handleTextChange = (qIdx, value) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setIsAssessing(true);
    
    // Extract topics using AI for better analysis
    await extractTopicsWithAI();
    
    // Submit answers for assessment
    await onSubmit(answers);
    setIsAssessing(false);
    setShowPerformanceSummary(true);
  };

  const extractTopicsWithAI = async () => {
    try {
      // Create a summary of all questions for AI analysis
      const questionsSummary = questions.map((q, idx) => 
        `Question ${idx + 1}: ${q.question} | Answer: ${q.answer}`
      ).join('\n');
      
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
          // Parse AI-extracted topics and map them to questions
          const aiTopics = parseTopicsFromAI(data);
          setAiTopicExtraction(aiTopics);
        }
      }
    } catch (error) {
      console.log('AI topic extraction failed, using fallback methods:', error);
    }
  };

  const parseTopicsFromAI = (aiResponse) => {
    try {
      const text = aiResponse.result.candidates[0].content.parts[0].text;
      const topics = JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, ''));
      
      // Map AI topics to questions based on content similarity
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

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const generatePerformanceSummary = () => {
    if (!feedback || !questions) return null;

    const totalQuestions = questions.length;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const earnedPoints = feedback.reduce((sum, f) => sum + (f.points || 0), 0);
    const percentage = Math.round((earnedPoints / totalPoints) * 100);

    // Extract topics/concepts from questions and analyze performance
    const topicPerformance = {};
    questions.forEach((q, idx) => {
      // Use AI-extracted topics if available, otherwise use fallback methods
      let topics = [];
      
      if (aiTopicExtraction[idx] && aiTopicExtraction[idx].length > 0) {
        // Use AI-extracted topics
        topics = aiTopicExtraction[idx];
      } else {
        // Fallback to dynamic topic extraction from question and answer content
        const questionText = q.question.toLowerCase();
        const answerText = q.answer.toLowerCase();
        
        // Strategy 1: Look for capitalized phrases (likely proper nouns/concepts)
        const capitalizedPhrases = questionText.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
        const answerCapitalizedPhrases = answerText.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
        const allCapitalizedPhrases = [...capitalizedPhrases, ...answerCapitalizedPhrases];
        
        // Filter out common words and keep meaningful concepts
        const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'];
        
        allCapitalizedPhrases.forEach(phrase => {
          const words = phrase.toLowerCase().split(/\s+/);
          if (words.length >= 1 && words.length <= 4 && !words.every(word => commonWords.includes(word))) {
            topics.push(phrase.toLowerCase());
          }
        });
        
        // Strategy 2: Look for technical terms and academic vocabulary
        const technicalTerms = [
          'photosynthesis', 'respiration', 'mitosis', 'meiosis', 'evolution', 'genetics', 'dna', 'rna',
          'cell', 'membrane', 'organelle', 'enzyme', 'protein', 'carbohydrate', 'lipid', 'nucleic acid',
          'ecosystem', 'biodiversity', 'climate', 'energy', 'force', 'motion', 'gravity', 'electricity',
          'magnetism', 'wave', 'light', 'sound', 'heat', 'temperature', 'pressure', 'volume', 'mass',
          'chemical', 'reaction', 'acid', 'base', 'molecule', 'atom', 'element', 'compound', 'mixture',
          'equation', 'formula', 'calculation', 'measurement', 'data', 'analysis', 'hypothesis', 'theory',
          'experiment', 'observation', 'conclusion', 'variable', 'control', 'independent', 'dependent',
          'algorithm', 'function', 'variable', 'loop', 'condition', 'array', 'object', 'class', 'method',
          'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'interface', 'database', 'query',
          'index', 'normalization', 'sql', 'nosql', 'api', 'rest', 'graphql', 'authentication', 'authorization',
          'encryption', 'hashing', 'cryptography', 'blockchain', 'machine learning', 'artificial intelligence',
          'neural network', 'deep learning', 'supervised', 'unsupervised', 'regression', 'classification',
          'clustering', 'optimization', 'gradient descent', 'backpropagation', 'overfitting', 'underfitting',
          'cross validation', 'feature engineering', 'data preprocessing', 'dimensionality reduction',
          'principal component analysis', 'singular value decomposition', 'k means', 'hierarchical clustering',
          'decision tree', 'random forest', 'support vector machine', 'naive bayes', 'logistic regression',
          'linear regression', 'polynomial regression', 'ridge regression', 'lasso regression', 'elastic net',
          'regularization', 'dropout', 'batch normalization', 'data augmentation', 'transfer learning',
          'fine tuning', 'hyperparameter tuning', 'grid search', 'random search', 'bayesian optimization'
        ];
        
        technicalTerms.forEach(term => {
          if ((questionText.includes(term) || answerText.includes(term)) && !topics.includes(term)) {
            topics.push(term);
          }
        });
        
        // Strategy 3: Extract concepts from question patterns
        const questionPatterns = {
          'definitions': /(what|define|definition|meaning|term)/i,
          'processes': /(how|process|steps|procedure|method|technique)/i,
          'concepts': /(why|explain|discuss|describe|elaborate|analyze)/i,
          'comparisons': /(compare|difference|similar|contrast|versus|vs)/i,
          'calculations': /(calculate|compute|solve|equation|formula|math)/i,
          'applications': /(apply|use|implement|practice|real world|example)/i,
          'analysis': /(analyze|examine|investigate|study|research)/i,
          'evaluation': /(evaluate|assess|judge|critique|review)/i
        };
        
        Object.entries(questionPatterns).forEach(([category, pattern]) => {
          if (pattern.test(questionText) && !topics.includes(category)) {
            topics.push(category);
          }
        });
        
        // Strategy 4: Extract domain-specific terms based on content analysis
        const domainKeywords = {
          'biology': ['cell', 'organism', 'species', 'evolution', 'genetics', 'ecosystem', 'photosynthesis'],
          'chemistry': ['molecule', 'atom', 'reaction', 'compound', 'element', 'acid', 'base'],
          'physics': ['force', 'energy', 'motion', 'gravity', 'wave', 'electricity', 'magnetism'],
          'mathematics': ['equation', 'formula', 'calculation', 'function', 'variable', 'algorithm'],
          'computer science': ['algorithm', 'program', 'code', 'function', 'variable', 'database'],
          'psychology': ['behavior', 'cognition', 'memory', 'learning', 'emotion', 'personality'],
          'economics': ['market', 'supply', 'demand', 'price', 'cost', 'profit', 'trade'],
          'history': ['event', 'period', 'civilization', 'war', 'revolution', 'empire', 'culture']
        };
        
        Object.entries(domainKeywords).forEach(([domain, keywords]) => {
          const domainMatches = keywords.filter(keyword => 
            questionText.includes(keyword) || answerText.includes(keyword)
          );
          if (domainMatches.length > 0 && !topics.includes(domain)) {
            topics.push(domain);
          }
        });
        
        // Strategy 5: If still no topics found, use broader categories
        if (topics.length === 0) {
          // Analyze question type and content for broader categorization
          if (q.type === 'mcq') {
            topics.push('multiple choice concepts');
          } else if (q.type === 'shortAnswer') {
            topics.push('short answer skills');
          } else if (q.type === 'discuss') {
            topics.push('discussion topics');
          } else if (q.type === 'describe') {
            topics.push('descriptive knowledge');
          } else if (q.type === 'fillBlanks') {
            topics.push('completion skills');
          } else {
            topics.push('general knowledge');
          }
        }
        
        // Remove duplicates and limit to most relevant topics
        topics = [...new Set(topics)].slice(0, 3);
      }
      
      // Add performance data for each topic
      topics.forEach(topic => {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { total: 0, earned: 0, questions: [] };
        }
        topicPerformance[topic].total += q.points || 1;
        topicPerformance[topic].earned += feedback[idx]?.points || 0;
        topicPerformance[topic].questions.push({
          question: q.question,
          userAnswer: answers[idx],
          feedback: feedback[idx],
          points: q.points || 1
        });
      });
    });

    // Identify strong and weak topics
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

    // Generate study recommendations
    const overallRecommendations = [];
    if (percentage < 70) {
      overallRecommendations.push("Review fundamental concepts thoroughly");
    }
    if (weakTopics.length > 0) {
      overallRecommendations.push(`Prioritize study of: ${weakTopics.map(t => t.split(' (')[0]).join(', ')}`);
    }
    if (strongTopics.length > 0) {
      overallRecommendations.push(`Maintain understanding of: ${strongTopics.map(t => t.split(' (')[0]).join(', ')}`);
    }

    return {
      totalQuestions,
      totalPoints,
      earnedPoints,
      percentage,
      topicPerformance,
      strongTopics,
      weakTopics,
      recommendations: [...overallRecommendations, ...recommendations]
    };
  };

  const copyPerformanceSummary = () => {
    const summary = generatePerformanceSummary();
    if (!summary) return;

    const summaryText = `STUDENT PERFORMANCE ANALYSIS

Overall Score: ${summary.percentage}% (${summary.earnedPoints}/${summary.totalPoints} points)

TOPIC PERFORMANCE:
${Object.entries(summary.topicPerformance).map(([topic, data]) => {
  const percentage = Math.round((data.earned / data.total) * 100);
  return `- ${topic.charAt(0).toUpperCase() + topic.slice(1)}: ${percentage}% (${data.earned}/${data.total} points)`;
}).join('\n')}

STRONG TOPICS: ${summary.strongTopics.length > 0 ? summary.strongTopics.map(t => t.split(' (')[0]).join(', ') : 'None identified'}

WEAK TOPICS: ${summary.weakTopics.length > 0 ? summary.weakTopics.map(t => t.split(' (')[0]).join(', ') : 'None identified'}

STUDY FOCUS AREAS:
${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

INSTRUCTION FOR GEMINI:
"Based on this student's exam performance, create targeted study materials focusing on their weak topics: ${summary.weakTopics.map(t => t.split(' (')[0]).join(', ')}. The student shows strength in: ${summary.strongTopics.map(t => t.split(' (')[0]).join(', ')}. Provide practice questions, explanations, and learning resources to help improve understanding in the identified weak areas."`;

    navigator.clipboard.writeText(summaryText).then(() => {
      alert('Performance summary copied to clipboard! You can now paste this into Gemini for personalized study guidance.');
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = summaryText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Performance summary copied to clipboard! You can now paste this into Gemini for personalized study guidance.');
    });
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return '❓';
      case 'shortAnswer': return '✏️';
      case 'discuss': return '💭';
      case 'describe': return '📝';
      case 'fillBlanks': return '⬜';
      default: return '❓';
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice';
      case 'shortAnswer': return 'Short Answer';
      case 'discuss': return 'Discuss';
      case 'describe': return 'Describe';
      case 'fillBlanks': return 'Fill in the Blanks';
      default: return 'Question';
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'mcq': return 'bg-purple-100 text-purple-700';
      case 'shortAnswer': return 'bg-blue-100 text-blue-700';
      case 'discuss': return 'bg-green-100 text-green-700';
      case 'describe': return 'bg-orange-100 text-orange-700';
      case 'fillBlanks': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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

  const performanceSummary = generatePerformanceSummary();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📝 Practice Exam</h2>
        <p className="text-gray-600">Complete exam with mixed question types</p>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => navigateToQuestion(idx)}
              className={`
                w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center
                ${currentQuestionIndex === idx 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : answers[idx] 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title={`${idx + 1}. ${getQuestionTypeLabel(q.type)}`}
            >
              {getQuestionTypeIcon(q.type)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const isSelected = answers[idx];
          const questionFeedback = feedback && feedback[idx];
          const isCorrect = submitted && questionFeedback?.isCorrect;
          const isWrong = submitted && isSelected && questionFeedback && !questionFeedback.isCorrect;

          return (
            <div 
              key={idx} 
              ref={el => questionRefs.current[idx] = el}
              className={`bg-white rounded-xl shadow p-6 space-y-4 transition-all duration-300 ${
                currentQuestionIndex === idx ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="font-semibold text-lg text-gray-800">
                  {idx + 1}. {q.question}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(q.type)}`}>
                    {getQuestionTypeIcon(q.type)} {getQuestionTypeLabel(q.type)}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {q.points || 1} pt{q.points !== 1 ? 's' : ''}
                  </span>
                </div>
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

              {/* Text Input for other question types */}
              {q.type !== 'mcq' && (
                <div className="space-y-2">
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => handleTextChange(idx, e.target.value)}
                    disabled={submitted}
                    rows={q.type === 'discuss' || q.type === 'describe' ? 4 : 2}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none ${
                      submitted && isCorrect ? 'border-green-500 bg-green-50' : 
                      submitted && isWrong ? 'border-red-500 bg-red-50' : 
                      'border-gray-300'
                    }`}
                    placeholder={
                      q.type === 'shortAnswer' ? 'Type your brief answer here...' :
                      q.type === 'discuss' ? 'Discuss the topic in detail...' :
                      q.type === 'describe' ? 'Provide a detailed description...' :
                      q.type === 'fillBlanks' ? 'Fill in the missing words...' :
                      'Type your answer here...'
                    }
                  />
                </div>
              )}

              {/* Feedback */}
              {submitted && questionFeedback && (
                <div className={`mt-3 p-4 rounded-lg ${
                  questionFeedback.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center font-medium">
                      <span className="mr-2">{questionFeedback.isCorrect ? '✅' : '❌'}</span>
                      {questionFeedback.isCorrect ? 'Great work!' : 'Room for improvement'}
                    </div>
                    <div className="text-sm font-semibold">
                      {questionFeedback.points}/{questionFeedback.maxPoints} points
                    </div>
                  </div>
                  
                  <div className="text-sm mb-3">
                    {questionFeedback.feedback}
                  </div>

                  {/* Personalized Suggestions */}
                  {questionFeedback.suggestions && questionFeedback.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-2">💡 Suggestions for improvement:</div>
                      <ul className="text-sm space-y-1">
                        {questionFeedback.suggestions.map((suggestion, suggestionIdx) => (
                          <li key={suggestionIdx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expected Answer (for reference) */}
                  {!questionFeedback.isCorrect && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-1">📋 Expected answer:</div>
                      <div className="text-sm opacity-80">{q.answer}</div>
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

        {/* Assessment Loading */}
        {isAssessing && (
          <div className="text-center py-8">
            <LottieLoader 
              text="Assessing your answers with AI..." 
              size="large"
            />
            <p className="text-sm text-gray-500 mt-2">This may take a moment for open-ended questions</p>
          </div>
        )}
      </form>

      {/* Performance Summary */}
      {submitted && performanceSummary && showPerformanceSummary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">📊 Performance Summary</h3>
            <p className="text-gray-600">Your comprehensive exam results and study recommendations</p>
          </div>

          {/* Overall Performance */}
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {performanceSummary.percentage}%
              </div>
              <div className="text-gray-600">
                {performanceSummary.earnedPoints}/{performanceSummary.totalPoints} points earned
              </div>
            </div>

            {/* Performance by Question Type */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Performance by Topic:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(performanceSummary.topicPerformance).map(([topic, data]) => {
                  const percentage = Math.round((data.earned / data.total) * 100);
                  const colorClass = percentage >= 80 ? 'text-green-600' : 
                                   percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <div key={topic} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                        <span className={`font-bold ${colorClass}`}>{percentage}%</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {data.earned}/{data.total} points
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceSummary.strongTopics.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-semibold text-green-800 mb-2">✅ Strong Topics</h5>
                  <ul className="text-sm text-green-700 space-y-1">
                    {performanceSummary.strongTopics.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {performanceSummary.weakTopics.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h5 className="font-semibold text-red-800 mb-2">⚠️ Weak Topics</h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {performanceSummary.weakTopics.map((weakness, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Study Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-semibold text-blue-800 mb-2">📚 Study Recommendations</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                {performanceSummary.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Copy Summary Button */}
            <div className="text-center">
              <button
                onClick={copyPerformanceSummary}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                📋 Copy Summary for Gemini
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Copy this summary to get personalized study guidance from Gemini
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
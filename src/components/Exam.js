'use client';
import React, { useState, useEffect, useRef } from 'react';
import LottieLoader from './LottieLoader';

export default function Exam({ questions, onSubmit, feedback, currentQuestionIndex, setCurrentQuestionIndex, setTotalQuestions, onSaveResults, examMode = 'standard' }) {
  // Ensure feedback is always an array to prevent React errors
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
  const [structuredUnderstanding, setStructuredUnderstanding] = useState({});
  const [isRequestingUnderstanding, setIsRequestingUnderstanding] = useState({});
  const [currentExamMode, setCurrentExamMode] = useState(examMode); // 'standard' or 'practice'
  const [showImmediateFeedback, setShowImmediateFeedback] = useState(false);
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
        setIndividualFeedback(prev => ({
          ...prev,
          [qIdx]: data.details?.[0] || data
        }));
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
    } finally {
      setIsCheckingAnswer(prev => ({ ...prev, [qIdx]: false }));
    }
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
        question.type ? `Type: ${question.type}` : '',
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

  const handleSaveResults = () => {
    if (onSaveResults && feedback) {
      const examResults = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        questions: questions.map((q, idx) => ({
          ...q,
          userAnswer: answers[idx],
          feedback: feedback[idx] || individualFeedback[idx],
          isCorrect: feedback[idx]?.isCorrect || individualFeedback[idx]?.isCorrect || false,
          points: feedback[idx]?.points || individualFeedback[idx]?.points || 0,
          explanation: feedback[idx]?.explanation || individualFeedback[idx]?.explanation || ''
        })),
        overallFeedback: feedback,
        individualFeedback: individualFeedback,
        performanceSummary: generatePerformanceSummary(),
        examMode: currentExamMode,
        totalQuestions: questions.length,
        answeredQuestions: answers.filter(a => a && a.trim() !== '').length
      };
      onSaveResults(examResults);
    }
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
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">📝 Practice Exam</h2>
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
                              <button
                  type="button"
                  onClick={() => setCurrentExamMode('standard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentExamMode === 'standard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📝 Standard Mode
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentExamMode('practice')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentExamMode === 'practice'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🎯 Practice Mode
                </button>
              </div>
            </div>
            {currentExamMode === 'practice' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                💡 <strong>Practice Mode:</strong> Get immediate feedback on each question as you answer them. 
                Perfect for learning and understanding your mistakes in real-time.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow p-4 lg:p-6">
        <div className="flex flex-wrap gap-2 lg:gap-3 justify-center">
          {questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => navigateToQuestion(idx)}
              className={`
                w-10 h-10 lg:w-12 lg:h-12 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 flex items-center justify-center
                ${currentQuestionIndex === idx 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : answers[idx] 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                active:scale-95
              `}
              title={`${idx + 1}. ${getQuestionTypeLabel(q.type)}`}
            >
              {getQuestionTypeIcon(q.type)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        {questions.map((q, idx) => {
          const isSelected = answers[idx];
          const questionFeedback = feedback && feedback[idx];
          const isCorrect = submitted && questionFeedback?.isCorrect;
          const isWrong = submitted && isSelected && questionFeedback && !questionFeedback.isCorrect;
          const currentIndividualFeedback = individualFeedback[idx];
          const currentUnderstanding = structuredUnderstanding[idx];

          return (
            <div 
              key={idx} 
              ref={el => questionRefs.current[idx] = el}
              className={`bg-white rounded-xl shadow p-4 lg:p-6 space-y-4 lg:space-y-6 transition-all duration-300 ${
                currentQuestionIndex === idx ? 'ring-2 ring-blue-500' : ''
              }`}
            >
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

              {/* Answer Options for MCQ */}
              {q.type === 'mcq' && q.options && (
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
              )}

              {/* Text Input for other question types */}
              {q.type !== 'mcq' && (
                <div className="space-y-2">
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => handleTextChange(idx, e.target.value)}
                    disabled={submitted}
                    rows={q.type === 'discuss' || q.type === 'describe' ? 4 : 2}
                    className={`w-full px-4 py-3 lg:py-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none text-sm lg:text-base ${
                      submitted && isCorrect ? 'border-green-500 bg-green-50' : 
                      submitted && questionFeedback && questionFeedback.points > 0 ? 'border-blue-500 bg-blue-50' :
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

              {/* Check Answer Button */}
              {!submitted && currentExamMode === 'practice' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCheckAnswer(idx)}
                    disabled={isCheckingAnswer[idx] || !answers[idx] || answers[idx].trim() === ''}
                    className="px-4 py-2 lg:px-6 lg:py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm lg:text-base"
                  >
                    {isCheckingAnswer[idx] ? 'Checking...' : 'Check Answer'}
                  </button>
                </div>
              )}

              {/* Immediate Feedback for Practice Mode */}
              {!submitted && currentExamMode === 'practice' && currentIndividualFeedback && (
                <div className={`mt-3 p-4 lg:p-5 rounded-lg ${
                  currentIndividualFeedback.isCorrect ? 'bg-green-50 text-green-700' : 
                  (currentIndividualFeedback.points > 0) ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center font-medium text-sm lg:text-base">
                      <span className="mr-2">{currentIndividualFeedback.isCorrect ? '✅' : (currentIndividualFeedback.points > 0) ? '👍' : '❌'}</span>
                      {currentIndividualFeedback.isCorrect ? 'Correct!' : (currentIndividualFeedback.points > 0) ? 'Partial credit!' : 'Incorrect'}
                    </div>
                    <div className="text-sm lg:text-base font-semibold">
                      {currentIndividualFeedback.points}/{currentIndividualFeedback.maxPoints || 1} points
                    </div>
                  </div>
                  
                  <div className="text-sm lg:text-base mb-3 lg:mb-4 leading-relaxed">
                    {typeof currentIndividualFeedback.feedback === 'string'
                      ? currentIndividualFeedback.feedback
                      : currentIndividualFeedback.explanation || 'Feedback available'}
                  </div>

                  {/* Expected Answer (for reference) */}
                  {!currentIndividualFeedback.isCorrect && (
                    <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-1 text-sm lg:text-base">📋 Expected answer:</div>
                      <div className="text-sm lg:text-base opacity-80 leading-relaxed">{q.answer}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {submitted && (
                <div className={`mt-3 p-4 lg:p-5 rounded-lg ${
                  questionFeedback?.isCorrect ? 'bg-green-50 text-green-700' : 
                  (questionFeedback?.points > 0) ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 lg:mb-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center font-medium text-sm lg:text-base">
                      <span className="mr-2">{questionFeedback?.isCorrect ? '✅' : (questionFeedback?.points > 0) ? '👍' : '❌'}</span>
                      {questionFeedback?.isCorrect ? 'Great work!' : (questionFeedback?.points > 0) ? 'Partial credit!' : 'Room for improvement'}
                    </div>
                    <div className="text-sm lg:text-base font-semibold">
                      {questionFeedback?.points}/{questionFeedback?.maxPoints} points
                    </div>
                  </div>
                  
                  <div className="text-sm lg:text-base mb-3 lg:mb-4 leading-relaxed">
                    {typeof questionFeedback?.feedback === 'string'
                      ? questionFeedback?.feedback
                      : JSON.stringify(questionFeedback?.feedback)}
                  </div>

                  {/* Personalized Suggestions */}
                  {questionFeedback?.suggestions && questionFeedback?.suggestions.length > 0 && (
                    <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-2 text-sm lg:text-base">💡 Suggestions for improvement:</div>
                      <ul className="text-sm lg:text-base space-y-1 lg:space-y-2">
                        {questionFeedback?.suggestions.map((suggestion, suggestionIdx) => (
                          <li key={suggestionIdx} className="flex items-start">
                            <span className="mr-2 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expected Answer (for reference) */}
                  {!questionFeedback?.isCorrect && (
                    <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-current border-opacity-20">
                      <div className="font-semibold mb-1 text-sm lg:text-base">📋 Expected answer:</div>
                      <div className="text-sm lg:text-base opacity-80 leading-relaxed">{q.answer}</div>
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
              className="w-full sm:w-auto px-8 py-4 lg:px-12 lg:py-5 bg-blue-600 text-white rounded-xl font-bold text-base lg:text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Submit Exam
            </button>
          </div>
        )}

        {/* Assessment Loading */}
        {isAssessing && (
          <div className="text-center py-8 lg:py-12">
            <LottieLoader 
              text="Assessing your answers with AI..." 
              size="large"
            />
            <p className="text-sm lg:text-base text-gray-500 mt-2">This may take a moment for open-ended questions</p>
          </div>
        )}
      </form>

      {/* Performance Summary */}
      {submitted && performanceSummary && showPerformanceSummary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="text-center">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">📊 Performance Summary</h3>
            <p className="text-gray-600 text-sm lg:text-base">Your comprehensive exam results and study recommendations</p>
          </div>

          {/* Overall Performance */}
          <div className="bg-white rounded-lg p-4 lg:p-6 space-y-4 lg:space-y-6">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                {performanceSummary.percentage}%
              </div>
              <div className="text-gray-600 text-sm lg:text-base">
                {performanceSummary.earnedPoints}/{performanceSummary.totalPoints} points earned
              </div>
            </div>

            {/* Performance by Question Type */}
            <div className="space-y-3 lg:space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm lg:text-base">Performance by Topic:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                {Object.entries(performanceSummary.topicPerformance).map(([topic, data]) => {
                  const percentage = Math.round((data.earned / data.total) * 100);
                  const colorClass = percentage >= 80 ? 'text-green-600' : 
                                   percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <div key={topic} className="bg-gray-50 rounded-lg p-3 lg:p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm lg:text-base">{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                        <span className={`font-bold ${colorClass} text-sm lg:text-base`}>{percentage}%</span>
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600">
                        {data.earned}/{data.total} points
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {performanceSummary.strongTopics.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 lg:p-5">
                  <h5 className="font-semibold text-green-800 mb-2 text-sm lg:text-base">✅ Strong Topics</h5>
                  <ul className="text-xs lg:text-sm text-green-700 space-y-1 lg:space-y-2">
                    {performanceSummary.strongTopics.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {performanceSummary.weakTopics.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 lg:p-5">
                  <h5 className="font-semibold text-red-800 mb-2 text-sm lg:text-base">⚠️ Weak Topics</h5>
                  <ul className="text-xs lg:text-sm text-red-700 space-y-1 lg:space-y-2">
                    {performanceSummary.weakTopics.map((weakness, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 mt-0.5">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Study Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4 lg:p-5">
              <h5 className="font-semibold text-blue-800 mb-2 text-sm lg:text-base">📚 Study Recommendations</h5>
              <ul className="text-xs lg:text-sm text-blue-700 space-y-1 lg:space-y-2">
                {performanceSummary.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Copy Summary Button */}
            <div className="text-center">
              <button
                onClick={copyPerformanceSummary}
                className="w-full sm:w-auto px-6 py-3 lg:px-8 lg:py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm lg:text-base"
              >
                📋 Copy Summary for Gemini
              </button>
              <p className="text-xs lg:text-sm text-gray-500 mt-2">
                Copy this summary to get personalized study guidance from Gemini
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
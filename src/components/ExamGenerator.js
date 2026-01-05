'use client';
import React, { useState, useEffect, useRef } from 'react';
import { parseTopics } from '../utils/parseGeminiResponse';
import { saveTopicsToCache, getTopicsFromCache, clearTopicCache } from '../utils/topicCache';
import LottieLoader from './LottieLoader';
import { 
  ClipboardList, Target, Lightbulb, BookOpen, Check, HelpCircle, 
  Pencil, MessageSquare, Square, Bot, BarChart3, Save, Zap, AlertTriangle,
  ChevronRight, Loader2
} from 'lucide-react';

export default function ExamGenerator({ onGenerate, extractedText, apiKey, performanceSummaries }) {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isExtractingTopics, setIsExtractingTopics] = useState(false);
  const [topics, setTopics] = useState([]);
  const [knowledgeType, setKnowledgeType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [performanceSummary, setPerformanceSummary] = useState('');
  const [showPerformanceHistory, setShowPerformanceHistory] = useState(false);
  const [autoSelectionReason, setAutoSelectionReason] = useState('');
  const [questionTypeAutoSelection, setQuestionTypeAutoSelection] = useState('');
  const [cacheStatus, setCacheStatus] = useState(''); // NEW: Track cache status
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionsGenerated, setSuggestionsGenerated] = useState(false);
  
  // Question type configurations
  const [questionTypes, setQuestionTypes] = useState({
    mcq: { enabled: true, count: 5 },
    shortAnswer: { enabled: true, count: 3 },
    discuss: { enabled: false, count: 2 },
    describe: { enabled: false, count: 2 },
    fillBlanks: { enabled: false, count: 2 }
  });
  
  // Use refs to track extraction state and prevent multiple calls
  const hasExtractedTopics = useRef(false);
  const extractionInProgress = useRef(false);

  // Auto-select topics based on performance data and student needs
  useEffect(() => {
    if (topics.length > 0 && selectedTopics.length === 0) {
      let topicsToSelect = [];
      let selectionReason = '';
      
      // If there's performance data, prioritize weak areas
      if (performanceSummary && performanceSummary.trim()) {
        // Extract weak topics from performance summary
        const weakTopics = extractWeakTopicsFromSummary(performanceSummary, topics);
        if (weakTopics.length > 0) {
          topicsToSelect = weakTopics;
          selectionReason = 'Based on previous performance summary (weak areas)';
        }
      }
      
      // If no weak topics found or no performance data, generate smart suggestions
      if (topicsToSelect.length === 0) {
        const suggestedTopics = generateTopicSuggestions(topics, performanceSummary);
        topicsToSelect = suggestedTopics.topics;
        selectionReason = suggestedTopics.reason;
      }
      
      // Ensure we don't select more than 6 topics total
      if (topicsToSelect.length > 6) {
        topicsToSelect = topicsToSelect.slice(0, 6);
        selectionReason += ' (limited to 6 topics)';
      }
      
      setSelectedTopics(topicsToSelect);
      setAutoSelectionReason(selectionReason);
    }
  }, [topics, performanceSummary, selectedTopics.length]);

  // Auto-select question types based on performance data and topic analysis
  useEffect(() => {
    // Only run when we have topics and selected topics, or when performance summary changes
    if (topics.length === 0 || selectedTopics.length === 0) return;
    
    const newQuestionTypes = {
      mcq: { enabled: true, count: 5 },
      shortAnswer: { enabled: true, count: 3 },
      discuss: { enabled: false, count: 2 },
      describe: { enabled: false, count: 2 },
      fillBlanks: { enabled: false, count: 2 }
    };
    let autoSelectionReason = '';
    
    if (performanceSummary && performanceSummary.trim()) {
      const summaryLower = performanceSummary.toLowerCase();
      
      // Check if student struggled with open-ended questions
      const hasOpenEndedStruggles = summaryLower.includes('discuss') || 
                                   summaryLower.includes('describe') || 
                                   summaryLower.includes('short answer') ||
                                   summaryLower.includes('paragraph');
      
      // Check if student did well with MCQ
      const hasMcqSuccess = summaryLower.includes('multiple choice') && 
                           summaryLower.includes('correct');
      
      if (hasOpenEndedStruggles) {
        // Focus on MCQ and short answer for struggling students
        newQuestionTypes.mcq = { enabled: true, count: 6 };
        newQuestionTypes.shortAnswer = { enabled: true, count: 4 };
        newQuestionTypes.discuss = { enabled: false, count: 2 };
        newQuestionTypes.describe = { enabled: false, count: 2 };
        newQuestionTypes.fillBlanks = { enabled: true, count: 2 };
        autoSelectionReason = 'Adjusted for students struggling with open-ended questions - focusing on MCQ and short answer';
      } else if (hasMcqSuccess) {
        // Add more challenging question types for students doing well
        newQuestionTypes.mcq = { enabled: true, count: 3 };
        newQuestionTypes.shortAnswer = { enabled: true, count: 3 };
        newQuestionTypes.discuss = { enabled: true, count: 3 };
        newQuestionTypes.describe = { enabled: true, count: 2 };
        newQuestionTypes.fillBlanks = { enabled: false, count: 2 };
        autoSelectionReason = 'Adjusted for students doing well - adding more challenging question types';
      }
    } else {
      // No performance data - generate smart question type suggestions based on topics
      const suggestedQuestionTypes = generateQuestionTypeSuggestions(topics, selectedTopics);
      Object.assign(newQuestionTypes, suggestedQuestionTypes.config);
      autoSelectionReason = suggestedQuestionTypes.reason;
    }
    
    setQuestionTypes(newQuestionTypes);
    setQuestionTypeAutoSelection(autoSelectionReason);
  }, [performanceSummary, topics, selectedTopics]);

  // Extract weak topics from performance summary
  const extractWeakTopicsFromSummary = (summary, availableTopics) => {
    const weakTopics = [];
    const summaryLower = summary.toLowerCase();
    
    // Look for weak areas section and extract topic keywords
    if (summaryLower.includes('weak areas') || summaryLower.includes('weak topics')) {
      availableTopics.forEach(topic => {
        const topicLower = topic.toLowerCase();
        // Check if topic appears in weak areas context
        if (summaryLower.includes(topicLower) || 
            summaryLower.includes(topicLower.replace(/\s+/g, '')) ||
            topicLower.split(' ').some(word => summaryLower.includes(word))) {
          weakTopics.push(topic);
        }
      });
    }
    
    // Also look for topics mentioned in the context of incorrect answers or low scores
    if (summaryLower.includes('incorrect') || summaryLower.includes('wrong') || summaryLower.includes('failed')) {
      availableTopics.forEach(topic => {
        const topicLower = topic.toLowerCase();
        // Check if topic appears near words indicating poor performance
        const topicIndex = summaryLower.indexOf(topicLower);
        if (topicIndex !== -1) {
          // Look for performance indicators near the topic
          const contextStart = Math.max(0, topicIndex - 100);
          const contextEnd = Math.min(summaryLower.length, topicIndex + topicLower.length + 100);
          const context = summaryLower.substring(contextStart, contextEnd);
          
          const performanceIndicators = ['incorrect', 'wrong', 'failed', 'low', 'poor', 'weak', 'struggled', 'difficulty'];
          if (performanceIndicators.some(indicator => context.includes(indicator))) {
            if (!weakTopics.includes(topic)) {
              weakTopics.push(topic);
            }
          }
        }
      });
    }
    
    // Look for topics mentioned in questions that were answered incorrectly
    const questionMatches = summaryLower.match(/\d+\.\s*([^.\n]+)/g);
    if (questionMatches) {
      questionMatches.forEach(question => {
        availableTopics.forEach(topic => {
          const topicLower = topic.toLowerCase();
          if (question.includes(topicLower) && !weakTopics.includes(topic)) {
            // Check if this question was answered incorrectly
            const questionIndex = summaryLower.indexOf(question);
            const afterQuestion = summaryLower.substring(questionIndex + question.length, questionIndex + 200);
            if (afterQuestion.includes('incorrect') || afterQuestion.includes('wrong') || afterQuestion.includes('failed')) {
              weakTopics.push(topic);
            }
          }
        });
      });
    }
    
    return weakTopics;
  };

  // Generate smart topic suggestions when no weak topics are found
  const generateTopicSuggestions = (availableTopics, performanceSummary) => {
    const suggestions = {
      topics: [],
      reason: ''
    };

    // If we have performance data, try to extract weak topics first
    if (performanceSummary && performanceSummary.trim()) {
      // Extract weak topics from performance summary
      const weakTopics = extractWeakTopicsFromSummary(performanceSummary, availableTopics);
      
      if (weakTopics.length > 0) {
        suggestions.topics = weakTopics;
        suggestions.reason = 'Based on performance summary - focusing on weak areas for improvement';
      } else {
        // No weak topics found, look for foundational topics
        const foundationalKeywords = ['introduction', 'basic', 'fundamental', 'core', 'overview', 'principles', 'concepts', 'theory', 'method', 'approach'];
        const foundationalTopics = availableTopics.filter(topic => 
          foundationalKeywords.some(keyword => 
            topic.toLowerCase().includes(keyword)
          )
        );

        if (foundationalTopics.length > 0) {
          suggestions.topics = foundationalTopics.slice(0, 4);
          suggestions.reason = 'No weak areas found in performance summary - suggesting foundational topics for comprehensive review';
        } else {
          // Select diverse topics from different areas
          suggestions.topics = selectDiverseTopics(availableTopics, 4);
          suggestions.reason = 'No weak areas found in performance summary - selecting diverse topics for balanced assessment';
        }
      }
    } else {
      // No performance data - suggest based on topic characteristics
      suggestions.topics = selectDiverseTopics(availableTopics, 4);
      suggestions.reason = 'No performance data - selecting diverse topics for comprehensive assessment';
    }

    // Ensure we don't select more than 6 topics total
    if (suggestions.topics.length > 6) {
      suggestions.topics = suggestions.topics.slice(0, 6);
      suggestions.reason += ' (limited to 6 topics)';
    }

    return suggestions;
  };

  // Select diverse topics from different categories
  const selectDiverseTopics = (topics, count) => {
    if (topics.length <= count) return topics;

    // Categorize topics by keywords
    const categories = {
      foundational: topics.filter(t => 
        t.toLowerCase().includes('introduction') || 
        t.toLowerCase().includes('basic') || 
        t.toLowerCase().includes('fundamental') ||
        t.toLowerCase().includes('overview')
      ),
      practical: topics.filter(t => 
        t.toLowerCase().includes('method') || 
        t.toLowerCase().includes('technique') || 
        t.toLowerCase().includes('process') ||
        t.toLowerCase().includes('application')
      ),
      theoretical: topics.filter(t => 
        t.toLowerCase().includes('theory') || 
        t.toLowerCase().includes('concept') || 
        t.toLowerCase().includes('principle') ||
        t.toLowerCase().includes('model')
      ),
      advanced: topics.filter(t => 
        t.toLowerCase().includes('advanced') || 
        t.toLowerCase().includes('complex') || 
        t.toLowerCase().includes('detailed') ||
        t.toLowerCase().includes('analysis')
      )
    };

    const selected = [];
    const categoryKeys = Object.keys(categories);
    let categoryIndex = 0;

    while (selected.length < count && categoryKeys.length > 0) {
      const category = categoryKeys[categoryIndex % categoryKeys.length];
      const availableInCategory = categories[category].filter(t => !selected.includes(t));
      
      if (availableInCategory.length > 0) {
        selected.push(availableInCategory[0]);
      }
      
      categoryIndex++;
      
      // If we've gone through all categories and still need more, take from any category
      if (categoryIndex >= categoryKeys.length && selected.length < count) {
        const remainingTopics = topics.filter(t => !selected.includes(t));
        if (remainingTopics.length > 0) {
          selected.push(remainingTopics[0]);
        }
      }
    }

    return selected;
  };

  // Generate question type suggestions based on topics
  const generateQuestionTypeSuggestions = (allTopics, selectedTopics) => {
    const suggestions = {
      config: {
        mcq: { enabled: true, count: 5 },
        shortAnswer: { enabled: true, count: 3 },
        discuss: { enabled: false, count: 2 },
        describe: { enabled: false, count: 2 },
        fillBlanks: { enabled: false, count: 2 }
      },
      reason: ''
    };

    // Analyze topic characteristics to determine suitable question types
    const topicAnalysis = analyzeTopics(selectedTopics);
    
    if (topicAnalysis.hasTheoreticalContent) {
      // Theoretical topics benefit from discussion and description questions
      suggestions.config.discuss = { enabled: true, count: 3 };
      suggestions.config.describe = { enabled: true, count: 2 };
      suggestions.config.mcq = { enabled: true, count: 4 };
      suggestions.config.shortAnswer = { enabled: true, count: 3 };
      suggestions.reason = 'Theoretical topics detected - enabling discussion and description questions for deeper understanding';
    } else if (topicAnalysis.hasPracticalContent) {
      // Practical topics benefit from short answer and fill-in-the-blanks
      suggestions.config.shortAnswer = { enabled: true, count: 4 };
      suggestions.config.fillBlanks = { enabled: true, count: 3 };
      suggestions.config.mcq = { enabled: true, count: 4 };
      suggestions.reason = 'Practical topics detected - focusing on application questions and fill-in-the-blanks';
    } else if (topicAnalysis.hasComplexContent) {
      // Complex topics need a mix of question types
      suggestions.config.mcq = { enabled: true, count: 3 };
      suggestions.config.shortAnswer = { enabled: true, count: 3 };
      suggestions.config.discuss = { enabled: true, count: 2 };
      suggestions.config.describe = { enabled: true, count: 2 };
      suggestions.reason = 'Complex topics detected - using balanced mix of question types for comprehensive assessment';
    } else {
      // Default balanced approach
      suggestions.config.mcq = { enabled: true, count: 5 };
      suggestions.config.shortAnswer = { enabled: true, count: 3 };
      suggestions.reason = 'Standard balanced approach - MCQ and short answer for general assessment';
    }

    return suggestions;
  };

  // Analyze topics to determine their characteristics
  const analyzeTopics = (topics) => {
    const analysis = {
      hasTheoreticalContent: false,
      hasPracticalContent: false,
      hasComplexContent: false
    };

    const theoreticalKeywords = ['theory', 'concept', 'principle', 'model', 'framework', 'paradigm', 'philosophy'];
    const practicalKeywords = ['method', 'technique', 'process', 'procedure', 'application', 'implementation', 'practice'];
    const complexKeywords = ['advanced', 'complex', 'detailed', 'analysis', 'synthesis', 'evaluation', 'critical'];

    topics.forEach(topic => {
      const topicLower = topic.toLowerCase();
      
      if (theoreticalKeywords.some(keyword => topicLower.includes(keyword))) {
        analysis.hasTheoreticalContent = true;
      }
      
      if (practicalKeywords.some(keyword => topicLower.includes(keyword))) {
        analysis.hasPracticalContent = true;
      }
      
      if (complexKeywords.some(keyword => topicLower.includes(keyword))) {
        analysis.hasComplexContent = true;
      }
    });

    return analysis;
  };

  // Extract topics using Gemini when component mounts or when text/apiKey changes
  useEffect(() => {
    let cancelled = false;

    const doExtraction = async () => {
      if (!extractedText || !apiKey || hasExtractedTopics.current || extractionInProgress.current) return;
      extractionInProgress.current = true;
      setIsExtractingTopics(true);
      
      try {
        // First, try to get topics from cache
        console.log('Checking for cached topics...');
        const cachedTopics = getTopicsFromCache(extractedText, 'exam');
        
        if (cachedTopics && cachedTopics.length > 0) {
          console.log('Using cached topics:', cachedTopics);
          if (!cancelled) {
            setTopics(cachedTopics);
            hasExtractedTopics.current = true;
            setCacheStatus('cached');
          }
          return;
        }
        
        // If no cached topics, extract with Gemini
        console.log('No cached topics found, starting topic extraction with Gemini...');
        const res = await fetch('/api/gemini-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: extractedText,
            promptType: 'extractTopics',
            geminiApiKey: apiKey,
          }),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Gemini API response:', data);
        
        if (data.error) {
          throw new Error(`API error: ${data.error}`);
        }
        
        if (data.result) {
          console.log('Parsing topics from Gemini response...');
          const extractedTopics = parseTopics(data);
          console.log('Extracted topics:', extractedTopics);
          if (!cancelled) {
            setTopics(extractedTopics);
            hasExtractedTopics.current = true;
            // Save to cache
            saveTopicsToCache(extractedText, extractedTopics, 'exam');
            setCacheStatus('generated');
          }
        } else {
          throw new Error('No result in API response');
        }
      } catch (error) {
        console.error('Topic extraction error:', error);
        console.log('Falling back to simple extraction...');
        const fallbackTopics = extractTopicsSimple(extractedText);
        console.log('Fallback topics:', fallbackTopics);
        if (!cancelled) {
          setTopics(fallbackTopics);
          hasExtractedTopics.current = true;
          // Save fallback topics to cache as well
          saveTopicsToCache(extractedText, fallbackTopics, 'exam');
          setCacheStatus('fallback');
        }
      } finally {
        if (!cancelled) setIsExtractingTopics(false);
        extractionInProgress.current = false;
      }
    };

    if (extractedText && apiKey && (!hasExtractedTopics.current || topics.length === 0)) {
      hasExtractedTopics.current = false;
      extractionInProgress.current = false;
      doExtraction();
    }

    return () => {
      cancelled = true;
      extractionInProgress.current = false;
    };
  }, [extractedText, apiKey]);

  // Reset cache status when text changes
  useEffect(() => {
    setCacheStatus('');
  }, [extractedText]);

  // Enhanced fallback topic extraction
  const extractTopicsSimple = (text) => {
    console.log('Running enhanced fallback topic extraction on text length:', text.length);
    const topics = [];
    const seen = new Set();

    // First pass: look for obvious headings and titles
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.match(/^[A-Z][A-Z\s]+$/) || line.match(/^\d+\./) || line.match(/^[#*]/)) {
        const cleanTopic = line.replace(/^[#*\d\.\s]+/, '').trim();
        if (cleanTopic && cleanTopic.length > 3 && cleanTopic.length < 50 && !seen.has(cleanTopic)) {
          topics.push(cleanTopic);
          seen.add(cleanTopic);
        }
      }
    });

    // Second pass: look for capitalized phrases that might be topics
    const capitalizedPhrases = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    capitalizedPhrases.forEach(phrase => {
      if (phrase.length >= 4 && phrase.length <= 40 && !seen.has(phrase.toLowerCase())) {
        // Filter out common words that aren't topics
        const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'];
        const words = phrase.toLowerCase().split(/\s+/);
        if (words.length >= 1 && words.length <= 6 && !words.every(word => commonWords.includes(word))) {
          topics.push(phrase);
          seen.add(phrase.toLowerCase());
        }
      }
    });

    // Third pass: look for sentences that might contain key concepts
    if (topics.length < 6) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      sentences.forEach(sentence => {
        const words = sentence.split(/\s+/);
        // Look for sentences with key terms like "is", "are", "refers to", "defined as"
        if (sentence.match(/\b(is|are|refers to|defined as|consists of|includes|process|method|technique|system|approach)\b/i)) {
          const keyPhrase = sentence.split(/\b(is|are|refers to|defined as|consists of|includes|process|method|technique|system|approach)\b/i)[0].trim();
          const cleanPhrase = keyPhrase.replace(/^[A-Z\s]+$/, '').trim();
          if (cleanPhrase && cleanPhrase.length > 3 && cleanPhrase.length < 40 && !seen.has(cleanPhrase)) {
            topics.push(cleanPhrase);
            seen.add(cleanPhrase);
          }
        }
      });
    }

    if (topics.length === 0) {
      return ['General Concepts', 'Key Definitions', 'Important Processes', 'Main Topics', 'Core Principles', 'Essential Methods'];
    }

    return topics.slice(0, 12);
  };

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleQuestionTypeToggle = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
  };

  const handleQuestionCountChange = (type, count) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        count: Math.max(0, Math.min(30, count)) // Limit between 0-10
      }
    }));
  };

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    const enabledTypes = Object.entries(questionTypes)
      .filter(([_, config]) => config.enabled)
      .map(([type, config]) => ({ type, count: config.count }));

    if (enabledTypes.length === 0) {
      alert('Please select at least one question type');
      return;
    }

    const totalQuestions = enabledTypes.reduce((sum, { count }) => sum + count, 0);
    if (totalQuestions === 0) {
      alert('Please set at least one question count');
      return;
    }

    setIsGenerating(true);
    await onGenerate(selectedTopics, enabledTypes, knowledgeType, performanceSummary);
    setIsGenerating(false);
  };

  const getTotalQuestions = () => {
    return Object.values(questionTypes)
      .filter(config => config.enabled)
      .reduce((sum, config) => sum + config.count, 0);
  };

  const loadPerformanceSummary = (summary) => {
    setPerformanceSummary(summary);
    setShowPerformanceHistory(false);
  };

  const triggerTopicSuggestions = () => {
    if (!performanceSummary || !topics.length) {
      alert('Please load a performance summary first and ensure topics are available');
      return;
    }

    setIsGeneratingSuggestions(true);

    // Use setTimeout to show the loading state briefly
    setTimeout(() => {
      // Clear current selection and auto-selection reason
      setSelectedTopics([]);
      setAutoSelectionReason('');

      // Generate new suggestions based on current performance summary
      const suggestions = generateTopicSuggestions(topics, performanceSummary);
      setSelectedTopics(suggestions.topics);
      setAutoSelectionReason(suggestions.reason);
      
      setIsGeneratingSuggestions(false);
      setSuggestionsGenerated(true);
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSuggestionsGenerated(false);
      }, 3000);
    }, 500);
  };

  const createPerformanceSummary = (summary) => {
    const weakQuestions = summary.details?.filter(d => !d.isCorrect) || [];
    const partialQuestions = summary.details?.filter(d => !d.isCorrect && d.points > 0) || [];
    const strongQuestions = summary.details?.filter(d => d.isCorrect) || [];
    
    let summaryText = `PREVIOUS EXAM PERFORMANCE SUMMARY:
Overall Score: ${summary.percentage}% (${summary.score}/${summary.total} points)
Date: ${new Date(summary.timestamp).toLocaleDateString()}
Topics Covered: ${summary.topics?.join(', ') || 'Various topics'}

=== QUESTIONS THE STUDENT GOT WRONG (MUST RE-TEST THESE CONCEPTS) ===
The following ${weakQuestions.length} questions were answered incorrectly. Generate similar questions to re-test these specific concepts:

`;
    
    weakQuestions.forEach((detail, idx) => {
      summaryText += `WRONG QUESTION ${idx + 1}:
Question: ${detail.question}
Student's Wrong Answer: ${detail.userAnswer || 'No answer provided'}
Correct Answer: ${detail.correctAnswer}
${detail.feedback ? `Feedback: ${detail.feedback}` : ''}
${detail.explanation ? `Explanation: ${detail.explanation}` : ''}

`;
    });
    
    if (partialQuestions.length > 0) {
      summaryText += `\n=== PARTIAL CREDIT QUESTIONS (NEEDS REINFORCEMENT) ===\n`;
      partialQuestions.forEach((detail, idx) => {
        summaryText += `${idx + 1}. ${detail.question}
   Student's Answer: ${detail.userAnswer}
   Expected: ${detail.correctAnswer}
   
`;
      });
    }
    
    if (strongQuestions.length > 0) {
      summaryText += `\n=== QUESTIONS ANSWERED CORRECTLY (FOR CONTEXT) ===\n`;
      strongQuestions.forEach((detail, idx) => {
        summaryText += `${idx + 1}. ${detail.question} ✓\n`;
      });
    }
    
    summaryText += `
=== GENERATION INSTRUCTIONS ===
1. MUST include questions that re-test the SAME CONCEPTS from the wrong questions above (rephrase them, don't copy exactly)
2. Add NEW questions on related topics to expand understanding
3. Focus on the weak areas identified above
4. Ensure comprehensive coverage of the material
`;
    
    return summaryText;
  };

  // Cache management function
  const handleClearCache = () => {
    clearTopicCache();
    setCacheStatus('');
    setTopics([]);
    setSelectedTopics([]);
    hasExtractedTopics.current = false;
    extractionInProgress.current = false;
    alert('Topic cache cleared. Topics will be regenerated next time.');
  };

  const questionTypeConfigs = [
    { key: 'mcq', label: 'Multiple Choice', icon: <HelpCircle className="w-5 h-5" />, description: 'Choose the best answer from options' },
    { key: 'shortAnswer', label: 'Short Answer', icon: <Pencil className="w-5 h-5" />, description: 'Brief written responses' },
    { key: 'discuss', label: 'Discuss', icon: <MessageSquare className="w-5 h-5" />, description: 'Explain concepts in detail' },
    { key: 'describe', label: 'Describe', icon: <ClipboardList className="w-5 h-5" />, description: 'Provide detailed descriptions' },
    { key: 'fillBlanks', label: 'Fill in the Blanks', icon: <Square className="w-5 h-5" />, description: 'Complete missing words/phrases' }
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <ClipboardList className="w-6 h-6" /> Exam Generator
        </h2>
        <p className="text-gray-600">Create a comprehensive exam with mixed question types</p>
      </div>

      {/* Knowledge Type Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          What kind of knowledge do you want to be tested on?
        </label>
        <input
          type="text"
          value={knowledgeType}
          onChange={e => setKnowledgeType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. conceptual understanding, problem-solving, definitions, etc."
        />
      </div>

      {/* Performance Summary Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Previous Performance Summary (Optional)
          </label>
          {performanceSummaries.length > 0 && (
            <button
              onClick={() => setShowPerformanceHistory(!showPerformanceHistory)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" /> Load from History ({performanceSummaries.length})
            </button>
          )}
        </div>
        <textarea
          value={performanceSummary}
          onChange={e => setPerformanceSummary(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Paste a previous performance summary here to tailor the exam to your weak areas..."
        />
        
        {/* Enhanced explanation of what performance summary does */}
        {performanceSummary ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <strong className="block mb-1">Personalized Exam Mode Active</strong>
                <p>Your next exam will include:</p>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>Re-test questions on concepts you got wrong</li>
                  <li>New questions to expand your understanding</li>
                  <li>Focus on your weak areas for improvement</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Load a previous performance summary to create a personalized exam that re-tests concepts you struggled with
          </p>
        )}
        
        {/* Topic Suggestions Button */}
        {performanceSummary && topics.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={triggerTopicSuggestions}
                disabled={isGeneratingSuggestions}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isGeneratingSuggestions
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isGeneratingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                <span>{isGeneratingSuggestions ? 'Generating...' : 'Generate Topic Suggestions'}</span>
              </button>
              <p className="text-xs text-gray-500">
                Automatically select topics based on your performance summary
              </p>
            </div>
            
            {/* Success Message */}
            {suggestionsGenerated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    <strong>Topic suggestions generated!</strong> Topics have been automatically selected based on your performance summary.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance History Dropdown */}
      {showPerformanceHistory && performanceSummaries.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-800 mb-3">Select Performance Summary:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {performanceSummaries.map((summary, idx) => (
              <button
                key={summary.id}
                onClick={() => loadPerformanceSummary(createPerformanceSummary(summary))}
                className="w-full text-left p-3 bg-white rounded border hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Exam {idx + 1} - {new Date(summary.timestamp).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">{summary.percentage}% ({summary.score}/{summary.total} points)</div>
                  </div>
                  <span className="text-blue-600"><ChevronRight className="w-4 h-4" /></span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Select Topics
          </h3>
          {selectedTopics.length > 0 && (
            <>
            <button
              onClick={() => {
                setSelectedTopics(topics);
                setAutoSelectionReason('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
            >
              Select All
            </button>
            <button
              onClick={() => {
                setSelectedTopics([]);
                setAutoSelectionReason('');
              }}
              className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
            >
              Reset Selection
            </button>
            </>
          )}
        </div>
        
        {autoSelectionReason && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Auto-selected:</strong> {autoSelectionReason}
              </p>
            </div>
          </div>
        )}
        
        {cacheStatus && (
          <div className={`border rounded-lg p-3 ${
            cacheStatus === 'cached' 
              ? 'bg-green-50 border-green-200' 
              : cacheStatus === 'generated' 
                ? 'bg-blue-50 border-blue-200'
                : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={cacheStatus === 'cached' ? 'text-green-600' : cacheStatus === 'generated' ? 'text-blue-600' : 'text-yellow-600'}>
                  {cacheStatus === 'cached' ? <Save className="w-4 h-4" /> : cacheStatus === 'generated' ? <Zap className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </span>
                <p className={`text-sm ${
                  cacheStatus === 'cached' ? 'text-green-800' : cacheStatus === 'generated' ? 'text-blue-800' : 'text-yellow-800'
                }`}>
                  <strong>
                    {cacheStatus === 'cached' ? 'Using cached topics' : 
                     cacheStatus === 'generated' ? 'Generated new topics' : 
                     'Using fallback topics'}
                  </strong>
                  {cacheStatus === 'cached' && ' (faster loading)'}
                </p>
              </div>
              {cacheStatus === 'cached' && (
                <button
                  onClick={handleClearCache}
                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                  title="Clear topic cache"
                >
                  Clear Cache
                </button>
              )}
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-600">Choose which topics to include in your exam:</p>
        
        {isExtractingTopics ? (
          <div className="text-center py-8">
            <LottieLoader 
              text="Analyzing your document for topics..." 
              size="large"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleTopicToggle(topic)}
                className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedTopics.includes(topic)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{topic}</span>
                  {selectedTopics.includes(topic) && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTopics.length === 0 && !isExtractingTopics && (
          <p className="text-yellow-600 text-sm flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Please select at least one topic to generate an exam
          </p>
        )}
      </div>

      {/* Question Types Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5" /> Question Types
          </h3>
          {questionTypeAutoSelection && (
            <button
              onClick={() => {
                setQuestionTypes({
                  mcq: { enabled: true, count: 5 },
                  shortAnswer: { enabled: true, count: 3 },
                  discuss: { enabled: false, count: 2 },
                  describe: { enabled: false, count: 2 },
                  fillBlanks: { enabled: false, count: 2 }
                });
                setQuestionTypeAutoSelection('');
              }}
              className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
            >
              Reset to Default
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-600">Select question types and set counts for each:</p>
        
        {questionTypeAutoSelection && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">
                <strong>Auto-selected:</strong> {questionTypeAutoSelection}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {questionTypeConfigs.map(({ key, label, icon, description }) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuestionTypeToggle(key)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      questionTypes[key].enabled
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {questionTypes[key].enabled && <Check className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{icon}</span>
                      <span className="font-medium text-gray-800">{label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                </div>
                
                {questionTypes[key].enabled && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Count:</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={questionTypes[key].count}
                      onChange={(e) => handleQuestionCountChange(key, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={selectedTopics.length === 0 || getTotalQuestions() === 0 || isGenerating || isExtractingTopics}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <LottieLoader size="small" text="" />
            <span className="ml-2">Generating Exam...</span>
          </span>
        ) : (
          `Generate ${getTotalQuestions()} Question Exam`
        )}
      </button>

      {/* Summary */}
      {selectedTopics.length > 0 && getTotalQuestions() > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Exam Summary
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Topics: {selectedTopics.join(', ')}</li>
            <li>• Total Questions: {getTotalQuestions()}</li>
            <li>• Question Types: {questionTypeConfigs
              .filter(({ key }) => questionTypes[key].enabled)
              .map(({ key, label }) => `${label} (${questionTypes[key].count})`)
              .join(', ')}</li>
            {knowledgeType && <li>• Focus: {knowledgeType}</li>}
            {performanceSummary && <li>• Performance Data: Included</li>}
            {autoSelectionReason && <li>• Auto-selection Reason: {autoSelectionReason}</li>}
          </ul>
        </div>
      )}
    </div>
  );
} 
'use client';
import React, { useState, useEffect, useRef } from 'react';
import LottieLoader from './LottieLoader';
import { parseTopics } from '../utils/parseGeminiResponse';
import { saveTopicsToCache, getTopicsFromCache, clearTopicCache } from '../utils/topicCache';

export default function QuizGenerator({ onGenerate, extractedText, apiKey }) {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [customCount, setCustomCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingTopics, setIsExtractingTopics] = useState(false);
  const [topics, setTopics] = useState([]);
  const [knowledgeType, setKnowledgeType] = useState(''); // NEW
  const [cacheStatus, setCacheStatus] = useState(''); // NEW: Track cache status
  
  // Use refs to track extraction state and prevent multiple calls
  const hasExtractedTopics = useRef(false);
  const extractionInProgress = useRef(false);

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
        const cachedTopics = getTopicsFromCache(extractedText, 'quiz');
        
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
            hasExtractedTopics.current = true; // Mark as completed
            // Save to cache
            saveTopicsToCache(extractedText, extractedTopics, 'quiz');
            setCacheStatus('generated');
          }
        } else {
          throw new Error('No result in API response');
        }
      } catch (error) {
        console.error('Topic extraction error:', error);
        console.log('Falling back to simple extraction...');
        // Fallback to simple extraction
        const fallbackTopics = extractTopicsSimple(extractedText);
        console.log('Fallback topics:', fallbackTopics);
        if (!cancelled) {
          setTopics(fallbackTopics);
          hasExtractedTopics.current = true; // Mark as completed even with fallback
          // Save fallback topics to cache as well
          saveTopicsToCache(extractedText, fallbackTopics, 'quiz');
          setCacheStatus('fallback');
        }
      } finally {
        if (!cancelled) setIsExtractingTopics(false);
        extractionInProgress.current = false;
      }
    };

    // Reset extraction state if new text is uploaded
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

  // Reset extraction state when component unmounts or when text/apiKey changes significantly
  useEffect(() => {
    return () => {
      // Cleanup function to reset state when component unmounts
      hasExtractedTopics.current = false;
      extractionInProgress.current = false;
    };
  }, []);

  const extractTopicsWithGemini = async () => {
    if (extractionInProgress.current) {
      console.log('Topic extraction already in progress, skipping...');
      return;
    }
    
    extractionInProgress.current = true;
    setIsExtractingTopics(true);
    try {
      // First, try to get topics from cache
      console.log('Checking for cached topics...');
      const cachedTopics = getTopicsFromCache(extractedText, 'quiz');
      
              if (cachedTopics && cachedTopics.length > 0) {
          console.log('Using cached topics:', cachedTopics);
          setTopics(cachedTopics);
          hasExtractedTopics.current = true;
          setCacheStatus('cached');
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
        setTopics(extractedTopics);
        hasExtractedTopics.current = true; // Mark as completed
        // Save to cache
        saveTopicsToCache(extractedText, extractedTopics, 'quiz');
        setCacheStatus('generated');
      } else {
        throw new Error('No result in API response');
      }
    } catch (error) {
      console.error('Topic extraction error:', error);
      console.log('Falling back to simple extraction...');
      // Fallback to simple extraction
      const fallbackTopics = extractTopicsSimple(extractedText);
      console.log('Fallback topics:', fallbackTopics);
      setTopics(fallbackTopics);
      hasExtractedTopics.current = true; // Mark as completed even with fallback
      // Save fallback topics to cache as well
      saveTopicsToCache(extractedText, fallbackTopics, 'quiz');
      setCacheStatus('fallback');
    } finally {
      setIsExtractingTopics(false);
      extractionInProgress.current = false;
    }
  };

  // Manual reset function for debugging or manual retry
  const resetTopicExtraction = () => {
    console.log('Manually resetting topic extraction...');
    hasExtractedTopics.current = false;
    extractionInProgress.current = false;
    setTopics([]);
    setSelectedTopics([]);
    extractTopicsWithGemini();
  };

  // Enhanced fallback topic extraction
  const extractTopicsSimple = (text) => {
    console.log('Running enhanced fallback topic extraction on text length:', text.length);
    const topics = [];
    const seen = new Set();

    // First pass: look for obvious headings and titles
    const lines = text.split('\n');
    lines.forEach(line => {
      // Look for lines that might be headings (all caps, numbered, or with special characters)
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

    // Fourth pass: extract common terms and phrases
    if (topics.length < 6) {
      const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      const wordCount = {};
      const stopWords = ['this', 'that', 'with', 'from', 'have', 'will', 'they', 'their', 'them', 'then', 'than', 'been', 'were', 'been', 'said', 'each', 'which', 'she', 'will', 'more', 'when', 'there', 'can', 'an', 'its', 'it', 'we', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'];
      
      words.forEach(word => {
        if (!stopWords.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      
      const sortedWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
      
      sortedWords.forEach(word => {
        if (!seen.has(word)) {
          topics.push(word);
          seen.add(word);
        }
      });
    }

    // If no topics found, create some generic ones
    if (topics.length === 0) {
      console.log('No topics found, using generic fallback topics');
      return ['General Concepts', 'Key Definitions', 'Important Processes', 'Main Topics', 'Core Principles', 'Essential Methods'];
    }

    console.log('Enhanced fallback extracted topics:', topics);
    return topics.slice(0, 12); // Limit to 12 topics
  };

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    const count = customCount ? parseInt(customCount) : questionCount;
    if (count < 1 || count > 50) {
      alert('Please enter a number between 1 and 50');
      return;
    }

    setIsGenerating(true);
    await onGenerate(selectedTopics, count, knowledgeType); // Pass knowledgeType
    setIsGenerating(false);
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

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Quiz Generator</h2>
        <p className="text-gray-600">Customize your quiz by selecting topics and question count</p>
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

      {/* Topic Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-800">📚 Select Topics</h3>
        <p className="text-sm text-gray-600">Choose which topics to include in your quiz:</p>
        
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
                  {cacheStatus === 'cached' ? '💾' : cacheStatus === 'generated' ? '⚡' : '⚠️'}
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
        
        {isExtractingTopics ? (
          <div className="text-center py-8">
            <LottieLoader 
              text="Analyzing your document for topics..." 
              size="large"
            />
          </div>
        ) : (
          <div className="space-y-4">
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
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Debug/Retry button */}
            {topics.length === 0 && !isExtractingTopics && (
              <div className="text-center">
                <p className="text-yellow-600 text-sm mb-2">
                  ⚠️ No topics found. You can try extracting topics again.
                </p>
                <button
                  onClick={resetTopicExtraction}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  🔄 Retry Topic Extraction
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTopics.length === 0 && !isExtractingTopics && (
          <p className="text-yellow-600 text-sm">
            ⚠️ Please select at least one topic to generate a quiz
          </p>
        )}
      </div>

      {/* Question Count Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-800">❓ Number of Questions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[5, 10, 15, 20].map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                questionCount === count && !customCount
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs">questions</div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Count */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Or enter custom number (1-50):
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={customCount}
            onChange={(e) => {
              setCustomCount(e.target.value);
              setQuestionCount(10); // Reset preset selection
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter custom number"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={selectedTopics.length === 0 || isGenerating || isExtractingTopics}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <LottieLoader size="small" text="" />
            <span className="ml-2">Generating Quiz...</span>
          </span>
        ) : (
          `Generate ${customCount || questionCount} Question Quiz`
        )}
      </button>

      {/* Summary */}
      {selectedTopics.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Quiz Summary</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Topics: {selectedTopics.join(', ')}</li>
            <li>• Questions: {customCount || questionCount}</li>
            <li>• Type: Multiple Choice with explanations</li>
            {knowledgeType && <li>• Focus: {knowledgeType}</li>}
          </ul>
        </div>
      )}
    </div>
  );
} 
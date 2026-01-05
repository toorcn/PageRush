'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lightbulb, Brain } from 'lucide-react';

// Simple markdown-like formatting for chat messages
function formatMessage(text) {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements = [];
  
  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={lineIdx} className="h-2" />);
      return;
    }
    
    // Bold headers (lines starting with **)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push(
        <div key={lineIdx} className="font-semibold text-indigo-900 mt-3 mb-1 first:mt-0">
          {trimmed.slice(2, -2)}
        </div>
      );
      return;
    }
    
    // Bullet points
    if (trimmed.match(/^[-•]\s/)) {
      const content = trimmed.replace(/^[-•]\s/, '');
      elements.push(
        <div key={lineIdx} className="flex items-start gap-2 ml-2 my-1">
          <span className="text-indigo-400 mt-0.5">•</span>
          <span>{formatInlineText(content)}</span>
        </div>
      );
      return;
    }
    
    // Thought/question lines
    if (trimmed.startsWith('💭') || trimmed.startsWith('🤔') || trimmed.startsWith('*Consider') || trimmed.startsWith('*Think')) {
      elements.push(
        <div key={lineIdx} className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg text-amber-800 italic text-sm">
          {formatInlineText(trimmed.replace(/^\*|\*$/g, ''))}
        </div>
      );
      return;
    }
    
    // Key insight lines
    if (trimmed.toLowerCase().startsWith('**key insight') || trimmed.toLowerCase().startsWith('key insight')) {
      elements.push(
        <div key={lineIdx} className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-start gap-2">
          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" /> {formatInlineText(trimmed.replace(/^\*\*key insight:?\*\*:?\s*/i, '').replace(/^key insight:?\s*/i, ''))}
        </div>
      );
      return;
    }
    
    // Regular paragraph
    elements.push(
      <p key={lineIdx} className="my-1.5 leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
  });
  
  return elements;
}

function formatInlineText(text) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-indigo-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function AIHelpChat({ 
  question, 
  questionIndex, 
  userAnswer, 
  correctAnswer, 
  onClose,
  initialMessage,
  onClearInitialMessage,
  panelWidth,
  onWidthChange,
  minWidth = 320,
  maxWidth = 600
}) {
  // Store chat history per question index
  const [chatHistory, setChatHistory] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const processedInitialMessagesRef = useRef(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const dragStartY = useRef(0);
  const dragThreshold = 100; // pixels to drag before closing

  // Get messages for current question
  const messages = chatHistory[questionIndex] || [];

  // Update messages for current question
  const setMessages = (updater) => {
    setChatHistory(prev => ({
      ...prev,
      [questionIndex]: typeof updater === 'function' 
        ? updater(prev[questionIndex] || [])
        : updater
    }));
  };

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle touch drag for mobile pull-down-to-close
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [isMobile]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile || !isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    // Only allow dragging down (positive diff)
    if (diff > 0) {
      setDragOffset(diff);
    }
  }, [isMobile, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
    if (dragOffset > dragThreshold) {
      onClose();
    } else {
      setDragOffset(0);
    }
  }, [isMobile, dragOffset, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle initial message from suggestion chip (only once per question+message combo)
  useEffect(() => {
    if (initialMessage && question) {
      const key = `${questionIndex}-${initialMessage}`;
      if (!processedInitialMessagesRef.current.has(key)) {
        processedInitialMessagesRef.current.add(key);
        sendMessage(initialMessage);
        onClearInitialMessage?.();
      }
    }
  }, [initialMessage, question, questionIndex]);

  // Handle resize
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      onWidthChange?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  const buildContext = (userQuestion) => {
    const parts = [`Question: ${question.question}`];
    
    if (question.options && question.options.length > 0) {
      parts.push(`\nAnswer Options:`);
      question.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        parts.push(`${letter}) ${opt}`);
      });
    }
    
    if (question.type) {
      const typeLabels = {
        mcq: 'multiple choice',
        shortAnswer: 'short answer',
        discuss: 'discussion',
        describe: 'descriptive',
        fillBlanks: 'fill in the blanks'
      };
      parts.push(`\nQuestion Type: ${typeLabels[question.type] || question.type}`);
    }
    
    if (userAnswer) {
      parts.push(`\nStudent's current selection: ${userAnswer}`);
    }
    
    parts.push(`\nStudent's question: ${userQuestion}`);
    
    return parts.join('\n');
  };

  const sendMessage = async (messageText) => {
    if (!messageText?.trim() || isLoading || !question) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const contextText = buildContext(messageText);

      const response = await fetch('/api/gemini-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: contextText,
          promptType: 'chatHelp',
          geminiApiKey: window.geminiApiKey || localStorage.getItem('geminiApiKey')
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const aiText = data.result?.candidates?.[0]?.content?.parts?.[0]?.text || 
                     'Sorry, I couldn\'t generate a response. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please check your API key and try again.',
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (!question) return null;

  // Mobile overlay wrapper
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/20">
        <div 
          ref={panelRef}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ 
            height: '82vh',
            transform: `translateY(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Pull-down pill handle */}
          <div 
            className="flex-shrink-0 pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Study Helper</h3>
                <p className="text-xs text-indigo-200">Question {questionIndex + 1}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Question Context */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex-shrink-0">
            <p className="text-sm text-indigo-800 font-medium leading-relaxed">{question?.question}</p>
            {question?.options && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {question.options.map((opt, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white/70 text-indigo-600 rounded text-xs border border-indigo-200">
                    {String.fromCharCode(65 + idx)}) {opt.length > 15 ? opt.substring(0, 15) + '...' : opt}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Suggestion Chips */}
          {messages.length === 0 && question?.aiSuggestions && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1"><Lightbulb className="w-3 h-3" /> What would you like to understand?</p>
              <div className="flex flex-wrap gap-2">
                {question.aiSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <div className="text-4xl mb-3">💬</div>
                <p className="font-medium text-gray-600 mb-1">I'm here to help you understand</p>
                <p className="text-xs text-gray-400">Click a suggestion above or ask your own question</p>
              </div>
            )}
            
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white px-4 py-2.5 rounded-br-md'
                      : message.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md px-4 py-3'
                      : 'bg-gray-50 text-gray-800 rounded-bl-md px-4 py-3 border border-gray-100'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.role === 'assistant' && !message.isError 
                      ? formatMessage(message.content)
                      : message.content
                    }
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 mobile-safe-bottom">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Desktop view (original)

  return (
    <div ref={panelRef} className="h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-indigo-200 transition-colors z-10 group"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full group-hover:bg-indigo-400 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0 pl-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Study Helper</h3>
            <p className="text-xs text-indigo-200">Question {questionIndex + 1} • Here to help you understand</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Question Context */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex-shrink-0 pl-6">
        <p className="text-sm text-indigo-800 font-medium leading-relaxed">{question?.question}</p>
        {question?.options && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {question.options.map((opt, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-white/70 text-indigo-600 rounded text-xs border border-indigo-200">
                {String.fromCharCode(65 + idx)}) {opt.length > 20 ? opt.substring(0, 20) + '...' : opt}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && question?.aiSuggestions && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0 pl-6">
          <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1"><Lightbulb className="w-3 h-3" /> What would you like to understand?</p>
          <div className="flex flex-wrap gap-2">
            {question.aiSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pl-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-medium text-gray-600 mb-1">I'm here to help you understand</p>
            <p className="text-xs text-gray-400">Click a suggestion above or ask your own question</p>
            <p className="text-xs text-gray-400 mt-1">I won't give you the answer directly — I'll help you figure it out!</p>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white px-4 py-2.5 rounded-br-md'
                  : message.isError
                  ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md px-4 py-3'
                  : 'bg-gray-50 text-gray-800 rounded-bl-md px-4 py-3 border border-gray-100'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {message.role === 'assistant' && !message.isError 
                  ? formatMessage(message.content)
                  : message.content
                }
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 pl-6">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about this question..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

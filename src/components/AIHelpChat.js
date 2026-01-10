'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Lightbulb, MessageCircle, ChevronDown, ChevronUp, X, BookOpen, GitCompare, ListOrdered, Table2 } from 'lucide-react';

// Parse AI response - handles both JSON format and plain text fallback
function parseAIResponse(content) {
  if (!content) return { summary: '', details: '', followUp: '', visualType: 'text', visualData: null };
  
  // Try to parse as JSON first (new format)
  try {
    // Clean up potential markdown code blocks
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.summary) {
      return { 
        summary: parsed.summary, 
        details: parsed.details || '', 
        followUp: parsed.followUp || '',
        visualType: parsed.visualType || 'text',
        visualData: parsed.visualData || null
      };
    }
  } catch {
    // Not JSON, fall back to text extraction
  }
  
  // Fallback: extract from plain text
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { summary: content, details: '', followUp: '', visualType: 'text', visualData: null };
  
  // Take first meaningful content as summary
  let summaryLines = [];
  let restStartIdx = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (line.startsWith('**') && line.endsWith('**'))) continue;
    summaryLines.push(line);
    if (summaryLines.length >= 2 || line.length > 120) {
      restStartIdx = i + 1;
      break;
    }
    restStartIdx = i + 1;
  }
  
  return { 
    summary: summaryLines.join(' '), 
    details: lines.slice(restStartIdx).join('\n'),
    followUp: '',
    visualType: 'text',
    visualData: null
  };
}

// Visual component: Comparison Table
function ComparisonTable({ data }) {
  if (!data?.headers || !data?.rows) return null;
  
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-indigo-50">
            {data.headers.map((header, idx) => (
              <th key={idx} className="px-3 py-2 text-left font-semibold text-indigo-800 border-b border-indigo-200">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3 py-2 border-b border-gray-100 text-gray-700">
                  {cellIdx === 0 ? <span className="font-medium text-indigo-600">{cell}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Visual component: Steps
function StepsDisplay({ data }) {
  if (!data?.steps) return null;
  
  return (
    <div className="mt-3">
      {data.title && (
        <div className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
          <ListOrdered className="w-3 h-3" /> {data.title}
        </div>
      )}
      <div className="space-y-2">
        {data.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </div>
            <div className="flex-1 pt-0.5">
              {step.label && <span className="font-medium text-indigo-700 text-xs">{step.label}: </span>}
              <span className="text-xs text-gray-700">{step.content}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Visual component: Definition Card
function DefinitionCard({ data }) {
  if (!data?.term) return null;
  
  return (
    <div className="mt-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
      <div className="flex items-start gap-2">
        <BookOpen className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-indigo-900 text-sm">{data.term}</div>
          <div className="text-xs text-gray-700 mt-1">{data.definition}</div>
          {data.example && (
            <div className="mt-2 text-xs bg-white/60 rounded px-2 py-1.5 border-l-2 border-indigo-300">
              <span className="font-medium text-indigo-600">Example: </span>
              <span className="text-gray-600">{data.example}</span>
            </div>
          )}
          {data.related && data.related.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-gray-500">Related:</span>
              {data.related.map((term, idx) => (
                <span key={idx} className="text-xs px-1.5 py-0.5 bg-white/80 rounded text-indigo-600 border border-indigo-100">
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Visual component: Comparison (two items side by side)
function ComparisonDisplay({ data }) {
  if (!data?.itemA || !data?.itemB) return null;
  
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-800 mb-2">
        <GitCompare className="w-3 h-3" /> Comparison
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
          <div className="font-medium text-blue-800 text-xs mb-1">{data.itemA.name}</div>
          <ul className="space-y-1">
            {data.itemA.points?.map((point, idx) => (
              <li key={idx} className="text-xs text-blue-700 flex items-start gap-1">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
          <div className="font-medium text-purple-800 text-xs mb-1">{data.itemB.name}</div>
          <ul className="space-y-1">
            {data.itemB.points?.map((point, idx) => (
              <li key={idx} className="text-xs text-purple-700 flex items-start gap-1">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {data.keyDifference && (
        <div className="mt-2 text-xs bg-amber-50 rounded px-2 py-1.5 border border-amber-200 text-amber-800">
          <span className="font-medium">Key difference: </span>{data.keyDifference}
        </div>
      )}
    </div>
  );
}

// Render visual content based on type
function VisualContent({ visualType, visualData }) {
  if (!visualData) return null;
  
  switch (visualType) {
    case 'table':
      return <ComparisonTable data={visualData} />;
    case 'steps':
      return <StepsDisplay data={visualData} />;
    case 'definition':
      return <DefinitionCard data={visualData} />;
    case 'comparison':
      return <ComparisonDisplay data={visualData} />;
    default:
      return null;
  }
}

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

// Collapsible AI message component
function CollapsibleMessage({ content, onFollowUp }) {
  const [expanded, setExpanded] = useState(false);
  const { summary, details, followUp, visualType, visualData } = parseAIResponse(content);
  const hasMore = (details && details.trim().length > 0) || (visualData && visualType !== 'text');
  
  // Get icon for visual type
  const getVisualTypeIcon = () => {
    switch (visualType) {
      case 'table': return <Table2 className="w-3 h-3" />;
      case 'steps': return <ListOrdered className="w-3 h-3" />;
      case 'definition': return <BookOpen className="w-3 h-3" />;
      case 'comparison': return <GitCompare className="w-3 h-3" />;
      default: return null;
    }
  };
  
  const visualTypeLabel = {
    table: 'View comparison table',
    steps: 'See step-by-step',
    definition: 'See definition',
    comparison: 'View comparison'
  };
  
  return (
    <div className="text-sm leading-relaxed">
      {/* Summary - always visible */}
      <div className="text-gray-800">
        {formatInlineText(summary)}
      </div>
      
      {hasMore && (
        <>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {/* Visual content first if available */}
              <VisualContent visualType={visualType} visualData={visualData} />
              
              {/* Text details */}
              {details && details.trim().length > 0 && (
                <div className={visualData ? 'mt-3' : ''}>
                  {formatMessage(details)}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                {getVisualTypeIcon()}
                <ChevronDown className="w-3 h-3" /> 
                {visualType && visualType !== 'text' ? visualTypeLabel[visualType] || 'Read more' : 'Read more'}
              </>
            )}
          </button>
        </>
      )}
      
      {/* Follow-up suggestion */}
      {followUp && onFollowUp && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => onFollowUp(followUp)}
            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs hover:bg-indigo-100 hover:border-indigo-300 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-3 h-3" />
            {followUp}
          </button>
        </div>
      )}
    </div>
  );
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

// Floating chat button component for mobile
export function ChatFloatingButton({ onClick, hasMessages = false }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-indigo-700 transition-colors touch-manipulation"
      aria-label="Open Study Helper"
    >
      <MessageCircle className="w-6 h-6" />
      {hasMessages && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      )}
    </button>
  );
}

// Snap points for mobile overlay (as percentage of viewport height from bottom)
const SNAP_POINTS = {
  CLOSED: 0,
  PEEK: 35,    // Just input and header visible
  HALF: 55,    // Half screen
  FULL: 90     // Full screen (with some top margin)
};

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
  maxWidth = 600,
  onScrollToQuestion  // Callback to scroll parent to current question
}) {
  // Store chat history per question index
  const [chatHistory, setChatHistory] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [snapPoint, setSnapPoint] = useState(SNAP_POINTS.HALF); // Current snap position
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [questionContextCollapsed, setQuestionContextCollapsed] = useState(false);
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [contextChanged, setContextChanged] = useState(false);
  const processedInitialMessagesRef = useRef(new Set());
  const prevQuestionIndexRef = useRef(questionIndex);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const dragStartY = useRef(0);
  const dragStartSnapPoint = useRef(SNAP_POINTS.HALF);

  // Get messages for current question
  const messages = chatHistory[questionIndex] || [];

  // Track when question context changes and auto-collapse sections at smaller snap points
  useEffect(() => {
    if (prevQuestionIndexRef.current !== questionIndex) {
      setContextChanged(true);
      prevQuestionIndexRef.current = questionIndex;
      
      // Auto-collapse sections when at peek snap to prevent header from being pushed off
      if (isMobile && snapPoint === SNAP_POINTS.PEEK) {
        setQuestionContextCollapsed(true);
        setSuggestionsCollapsed(true);
      } else if (isMobile && snapPoint === SNAP_POINTS.HALF) {
        // At half, collapse suggestions but keep context visible
        setSuggestionsCollapsed(true);
        setQuestionContextCollapsed(false);
      } else {
        // At full, expand everything
        setQuestionContextCollapsed(false);
        setSuggestionsCollapsed(false);
      }
      
      // Auto-hide the notification after 2 seconds
      const timer = setTimeout(() => setContextChanged(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [questionIndex, isMobile, snapPoint]);

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

  // Auto-scroll to question when chat opens on mobile (via suggestion hint)
  useEffect(() => {
    if (isMobile && onScrollToQuestion) {
      // Small delay to let the overlay animate in
      const timer = setTimeout(() => {
        onScrollToQuestion(questionIndex);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, questionIndex, onScrollToQuestion]);

  // Handle mobile keyboard visibility using visualViewport API
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // Calculate keyboard height by comparing viewport height to window height
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(Math.max(0, keyboardH));
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, [isMobile]);

  // Handle touch drag for mobile multi-snap overlay
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    dragStartY.current = e.touches[0].clientY;
    dragStartSnapPoint.current = snapPoint;
    setIsDragging(true);
  }, [isMobile, snapPoint]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile || !isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    setDragOffset(diff);
  }, [isMobile, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
    
    const viewportHeight = window.innerHeight;
    const currentHeightPx = (dragStartSnapPoint.current / 100) * viewportHeight;
    const newHeightPx = currentHeightPx - dragOffset;
    const newHeightPercent = (newHeightPx / viewportHeight) * 100;
    
    // Determine which snap point to go to based on drag distance and direction
    const dragDistance = Math.abs(dragOffset);
    const isDraggingDown = dragOffset > 0;
    
    let targetSnap;
    
    // Fast/significant drag (more than 60px)
    if (dragDistance > 60) {
      if (isDraggingDown) {
        // Dragging down - go to lower snap or close
        if (dragStartSnapPoint.current <= SNAP_POINTS.PEEK) {
          onClose();
          return;
        } else if (dragStartSnapPoint.current <= SNAP_POINTS.HALF) {
          targetSnap = SNAP_POINTS.PEEK;
        } else {
          targetSnap = SNAP_POINTS.HALF;
        }
      } else {
        // Dragging up - go to higher snap
        if (dragStartSnapPoint.current < SNAP_POINTS.HALF) {
          targetSnap = SNAP_POINTS.HALF;
        } else {
          targetSnap = SNAP_POINTS.FULL;
        }
      }
    } else {
      // Small drag - snap to nearest point
      const snapPoints = [SNAP_POINTS.PEEK, SNAP_POINTS.HALF, SNAP_POINTS.FULL];
      targetSnap = snapPoints.reduce((closest, point) => {
        return Math.abs(point - newHeightPercent) < Math.abs(closest - newHeightPercent) ? point : closest;
      }, snapPoints[0]);
      
      // If dragged below minimum threshold, close
      if (newHeightPercent < 20) {
        onClose();
        return;
      }
    }
    
    setSnapPoint(targetSnap);
    setDragOffset(0);
    
    // Auto-collapse/expand sections based on new snap point
    if (targetSnap === SNAP_POINTS.PEEK) {
      setQuestionContextCollapsed(true);
      setSuggestionsCollapsed(true);
    } else if (targetSnap === SNAP_POINTS.HALF) {
      setSuggestionsCollapsed(true);
      setQuestionContextCollapsed(false);
    } else {
      setQuestionContextCollapsed(false);
      setSuggestionsCollapsed(false);
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

  // Calculate current height based on snap point and drag offset
  // Use fixed pixel values to avoid vh issues on mobile Safari
  const calculateHeight = () => {
    if (typeof window === 'undefined') return '55%';
    
    if (keyboardHeight > 0) {
      return `${window.innerHeight - keyboardHeight}px`;
    }
    const viewportHeight = window.innerHeight;
    const baseHeightPx = (snapPoint / 100) * viewportHeight;
    const adjustedHeight = Math.max(0, baseHeightPx - dragOffset);
    return `${adjustedHeight}px`;
  };

  // Mobile overlay wrapper - fixed to viewport, not affected by scroll
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ 
          // Use fixed positioning that won't be affected by scroll
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        <div 
          ref={panelRef}
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          style={{ 
            height: calculateHeight(),
            maxHeight: '95%',
            transition: isDragging ? 'none' : 'height 0.3s ease-out'
          }}
        >
          {/* Drag handle area */}
          <div 
            className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-3">
              {/* Drag pill - wider and more prominent for better affordance */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Q{questionIndex + 1}</span>
              </div>
              {contextChanged && (
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full animate-pulse">
                  Updated
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Collapsible Question Context - show only at half or full snap, hide when keyboard is open */}
          {keyboardHeight === 0 && snapPoint >= SNAP_POINTS.HALF && (
            <div className="flex-shrink-0 border-b border-gray-100">
              <button
                onClick={() => setQuestionContextCollapsed(!questionContextCollapsed)}
                className="w-full px-4 py-2 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 text-left"
              >
                <span className="text-xs font-medium text-indigo-700">Question Context</span>
                {questionContextCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-indigo-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-indigo-500" />
                )}
              </button>
              {!questionContextCollapsed && (
                <div className="px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
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
              )}
            </div>
          )}

          {/* Collapsible Suggestion Chips - show only at half or full snap, hide when keyboard is open */}
          {messages.length === 0 && question?.aiSuggestions && keyboardHeight === 0 && snapPoint >= SNAP_POINTS.HALF && (
            <div className="flex-shrink-0 border-b border-gray-100">
              <button
                onClick={() => setSuggestionsCollapsed(!suggestionsCollapsed)}
                className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 text-left"
              >
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions
                </span>
                {suggestionsCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {!suggestionsCollapsed && (
                <div className="px-4 py-2 bg-gray-50/50">
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
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="font-medium text-gray-600 mb-1">Stuck on something?</p>
                <p className="text-xs text-gray-400">Ask away — I'll help you work through it</p>
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
                  {message.role === 'assistant' && !message.isError 
                    ? <CollapsibleMessage 
                        content={message.content} 
                        onFollowUp={idx === messages.length - 1 && !isLoading ? sendMessage : null}
                      />
                    : <div className="text-sm leading-relaxed">{message.content}</div>
                  }
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

          {/* Input - stays above keyboard */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 mobile-safe-bottom">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                disabled={isLoading}
                enterKeyHint="send"
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
      <div className="flex items-center justify-between pl-6 pr-3 py-3 bg-indigo-600 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">PageRush Tutor</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-indigo-200">Question {questionIndex + 1}</p>
              {contextChanged && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-indigo-100">
                  switched
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Question Context */}
      <div className="pl-6 pr-2 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex-shrink-0">
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
        <div className="pl-6 pr-2 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto pl-6 pr-2 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="font-medium text-gray-600 mb-1">Stuck on something?</p>
            <p className="text-xs text-gray-400">Ask away — I'll help you work through it</p>
            <p className="text-xs text-gray-400 mt-1">No spoilers, just guidance</p>
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
              {message.role === 'assistant' && !message.isError 
                ? <CollapsibleMessage 
                    content={message.content} 
                    onFollowUp={idx === messages.length - 1 && !isLoading ? sendMessage : null}
                  />
                : <div className="text-sm leading-relaxed">{message.content}</div>
              }
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
      <form onSubmit={handleSubmit} className="pl-6 pr-2 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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

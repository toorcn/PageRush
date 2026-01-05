'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, Lightbulb, BarChart3, RefreshCw, ChevronDown, ChevronRight,
  Inbox, Check, Clock, Target, Bookmark, BookmarkCheck, List, 
  TrendingUp, Star, AlertCircle, Info, Zap, Eye, EyeOff
} from 'lucide-react';

// Mermaid diagram component with high contrast colors
const MermaidDiagram = ({ chart, id }) => {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      setIsLoading(true);
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            // High contrast - dark text on light backgrounds
            primaryColor: '#dbeafe',           // Light blue background
            primaryTextColor: '#1e3a5f',       // Dark blue text (high contrast)
            primaryBorderColor: '#1e40af',     // Dark blue border
            
            // Secondary elements
            secondaryColor: '#f0fdf4',         // Light green background
            secondaryTextColor: '#14532d',     // Dark green text
            secondaryBorderColor: '#166534',   // Dark green border
            
            // Tertiary elements  
            tertiaryColor: '#fef3c7',          // Light amber background
            tertiaryTextColor: '#78350f',      // Dark amber text
            tertiaryBorderColor: '#b45309',    // Dark amber border
            
            // Lines and edges
            lineColor: '#334155',              // Dark slate for lines
            
            // Node defaults
            nodeBorder: '#1e40af',
            mainBkg: '#dbeafe',
            nodeTextColor: '#1e3a5f',
            
            // Text colors - ensure high contrast
            textColor: '#0f172a',              // Near black
            labelTextColor: '#1e293b',         // Dark slate
            
            // Flowchart specific
            edgeLabelBackground: '#ffffff',
            
            // Cluster/subgraph
            clusterBkg: '#f1f5f9',
            clusterBorder: '#64748b',
            
            // Special nodes
            defaultLinkColor: '#334155',
          },
          flowchart: { 
            curve: 'basis', 
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 60,
            htmlLabels: true,
            defaultRenderer: 'dagre-wrapper',
          },
          mindmap: {
            padding: 20,
          },
          securityLevel: 'loose',
        });
        
        // Generate unique ID to avoid conflicts
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart);
        
        // Post-process SVG to ensure text contrast
        const enhancedSvg = renderedSvg
          .replace(/fill="#[a-fA-F0-9]{6}"/g, (match) => {
            // Keep the fill but ensure text inside has contrast
            return match;
          })
          .replace(/<text([^>]*)>/g, (match, attrs) => {
            // Ensure text elements have dark fill for readability
            if (!attrs.includes('fill=')) {
              return `<text${attrs} fill="#1e293b">`;
            }
            return match;
          });
        
        setSvg(enhancedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Unable to render diagram');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (chart) renderDiagram();
  }, [chart, id]);

  if (isLoading) {
    return (
      <div className="my-6 p-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-blue-200 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-5 text-amber-900 text-sm">
        <div className="flex items-center gap-2 font-semibold mb-3">
          <AlertCircle className="w-5 h-5" />
          <span>Diagram Preview</span>
        </div>
        <pre className="text-xs bg-amber-100 p-4 rounded-lg overflow-x-auto text-amber-800 border border-amber-200 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="my-6 p-6 bg-white rounded-xl border-2 border-blue-200 overflow-x-auto shadow-sm mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      aria-label="Concept diagram"
      style={{
        // CSS to ensure text visibility in Mermaid diagrams
        '--mermaid-text-color': '#1e293b',
      }}
    />
  );
};

// Enhanced concept map with better visual hierarchy
const ConceptMap = ({ concepts }) => {
  if (!concepts || concepts.length === 0) return null;
  
  const mainConcept = concepts[0];
  const relatedConcepts = concepts.slice(1);
  
  return (
    <div className="my-6 p-6 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border-2 border-indigo-300 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg border-2 border-indigo-800">
          {mainConcept}
        </div>
        {relatedConcepts.length > 0 && (
          <>
            <div className="w-1 h-8 bg-indigo-400 rounded-full"></div>
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
              {relatedConcepts.map((concept, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -top-4 left-1/2 w-1 h-4 bg-indigo-300 -translate-x-1/2 rounded-full"></div>
                  <div className="bg-white px-4 py-2 rounded-lg border-2 border-indigo-300 text-indigo-900 font-semibold shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-default">
                    {concept}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Key insights box with priority indicator
const KeyInsightsBox = ({ points, priority = 'normal', title = "Key Insights" }) => {
  if (!points || points.length === 0) return null;
  
  const priorityStyles = {
    high: {
      container: 'bg-gradient-to-r from-rose-50 to-orange-50 border-l-4 border-rose-500',
      title: 'text-rose-800',
      icon: <Zap className="w-5 h-5 text-rose-600" />,
      bullet: 'text-rose-500'
    },
    normal: {
      container: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500',
      title: 'text-amber-900',
      icon: <Lightbulb className="w-5 h-5 text-amber-600" />,
      bullet: 'text-amber-600'
    },
    info: {
      container: 'bg-gradient-to-r from-sky-50 to-cyan-50 border-l-4 border-sky-500',
      title: 'text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-600" />,
      bullet: 'text-sky-500'
    }
  };
  
  const style = priorityStyles[priority] || priorityStyles.normal;
  
  return (
    <div className={`my-5 ${style.container} rounded-r-xl p-5 shadow-sm`}>
      <h4 className={`font-bold ${style.title} mb-3 flex items-center gap-2 text-base`}>
        {style.icon} {title}
      </h4>
      <ul className="space-y-2">
        {points.map((point, idx) => (
          <li key={idx} className="text-slate-800 text-sm flex items-start gap-3 leading-relaxed">
            <span className={`${style.bullet} mt-1.5 text-lg`}>•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Enhanced definition box with better contrast
const DefinitionBox = ({ term, definition }) => (
  <div className="my-4 bg-blue-50 border-2 border-blue-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="font-bold text-blue-900 text-base flex items-center gap-2">
      <BookOpen className="w-4 h-4 text-blue-700" />
      {term}
    </div>
    <div className="text-slate-700 text-sm mt-2 leading-relaxed pl-6">{definition}</div>
  </div>
);

// Progress ring component
const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
};

// Table of contents component
const TableOfContents = ({ sections, activeSection, onNavigate, bookmarkedSections }) => {
  return (
    <nav className="bg-slate-50 rounded-xl border-2 border-slate-200 p-4 mb-6" aria-label="Table of contents">
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
        <List className="w-4 h-4" /> Contents
      </h3>
      <ul className="space-y-1.5">
        {sections.map((section, index) => (
          <li key={index}>
            <button
              onClick={() => onNavigate(index)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${
                activeSection === index 
                  ? 'bg-blue-100 text-blue-900 font-semibold border border-blue-300' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-medium group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
                  {index + 1}
                </span>
                <span className="truncate">{section.title}</span>
              </span>
              <span className="flex items-center gap-1">
                {bookmarkedSections.has(index) && (
                  <BookmarkCheck className="w-4 h-4 text-amber-500" />
                )}
                {section.hasDiagram && (
                  <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Study stats dashboard
const StudyStatsDashboard = ({ stats, checklistItems }) => {
  const completedCount = Object.values(checklistItems).filter(item => item.completed).length;
  const totalCount = Object.keys(checklistItems).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const avgConfidence = totalCount > 0 
    ? Object.values(checklistItems).reduce((sum, item) => sum + (item.confidence || 0), 0) / totalCount 
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 text-white shadow-xl">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        Study Progress
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 rounded-xl p-4 text-center">
          <div className="flex justify-center mb-2">
            <ProgressRing progress={progress} size={50} strokeWidth={5} />
          </div>
          <div className="text-2xl font-bold text-blue-400">{progress}%</div>
          <div className="text-xs text-slate-400 mt-1">Complete</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-xs text-slate-400 mt-1">of {totalCount} Topics</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{avgConfidence.toFixed(1)}</div>
          <div className="text-xs text-slate-400 mt-1">Avg Confidence</div>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-violet-400">{stats.withDiagrams}</div>
          <div className="text-xs text-slate-400 mt-1">Diagrams</div>
        </div>
      </div>
    </div>
  );
};

export default function StudyGuide({ content, onRegenerate }) {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [displayFormat, setDisplayFormat] = useState('guided');
  const [checklistItems, setChecklistItems] = useState({});
  const [showEmptySections, setShowEmptySections] = useState(false);
  const [bookmarkedSections, setBookmarkedSections] = useState(new Set());
  const [activeSection, setActiveSection] = useState(0);
  const [showTOC, setShowTOC] = useState(true);
  const diagramIdRef = useRef(0);
  const sectionRefs = useRef({});

  // Parse content into structured hierarchy
  const parsedContent = useMemo(() => {
    if (!content || !content.trim()) return { sections: [], rawContent: '', stats: { total: 0, empty: 0, withDiagrams: 0 } };
    
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    let currentSubsection = null;
    let currentList = null;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';
    
    const getIndentLevel = (line) => {
      const match = line.match(/^(\s*)/);
      return match ? Math.floor(match[1].length / 2) : 0;
    };
    
    const isHeader = (line) => /^#{1,6}\s/.test(line.trim());
    const getHeaderLevel = (line) => {
      const match = line.trim().match(/^(#{1,6})\s/);
      return match ? match[1].length : 0;
    };
    const isBoldTitle = (line) => /^\*\*[^*]+\*\*\s*$/.test(line.trim());
    const isBulletItem = (line) => /^\s*[-*•]\s/.test(line);
    const isNumberedItem = (line) => /^\s*\d+[.)]\s/.test(line);
    const isListItem = (line) => isBulletItem(line) || isNumberedItem(line);
    const isCodeBlockStart = (line) => /^```/.test(line.trim());
    const isDefinition = (line) => /^\*\*[^*]+\*\*:\s/.test(line.trim());
    
    const createSection = (title, level = 1) => ({
      title: title.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim(),
      level,
      content: [],
      subsections: [],
      hasDiagram: false,
      hasKeyPoints: false,
      estimatedTime: 0
    });
    
    const addContentToCurrentContext = (item) => {
      if (item.type === 'diagram') {
        if (currentSection) currentSection.hasDiagram = true;
      }
      
      if (currentSubsection) {
        currentSubsection.content.push(item);
      } else if (currentSection) {
        currentSection.content.push(item);
      } else {
        currentSection = createSection('Overview', 1);
        currentSection.content.push(item);
        sections.push(currentSection);
      }
    };
    
    const finalizeList = () => {
      if (currentList && currentList.items.length > 0) {
        const isKeyPoints = currentList.items.length >= 3 && 
          currentList.items.every(item => item.text.length < 200);
        
        if (isKeyPoints && currentSection) {
          currentSection.hasKeyPoints = true;
        }
        
        addContentToCurrentContext({ type: 'list', ...currentList });
        currentList = null;
      }
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (isCodeBlockStart(trimmedLine)) {
        if (inCodeBlock) {
          if (codeBlockLang === 'mermaid') {
            addContentToCurrentContext({ 
              type: 'diagram', 
              diagramType: 'mermaid',
              content: codeBlockContent.trim(),
              id: diagramIdRef.current++
            });
          } else if (codeBlockContent.trim()) {
            addContentToCurrentContext({ 
              type: 'code', 
              language: codeBlockLang,
              content: codeBlockContent.trim()
            });
          }
          inCodeBlock = false;
          codeBlockContent = '';
          codeBlockLang = '';
        } else {
          finalizeList();
          inCodeBlock = true;
          codeBlockLang = trimmedLine.replace(/^```/, '').trim().toLowerCase();
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        return;
      }
      
      if (!trimmedLine) {
        if (currentList && currentList.items.length > 0) {
          const nextNonEmpty = lines.slice(index + 1).find(l => l.trim());
          if (!nextNonEmpty || !isListItem(nextNonEmpty)) {
            finalizeList();
          }
        }
        return;
      }
      
      if (isHeader(trimmedLine)) {
        finalizeList();
        const level = getHeaderLevel(trimmedLine);
        const title = trimmedLine.replace(/^#+\s*/, '');
        
        if (level <= 2) {
          currentSection = createSection(title, level);
          currentSubsection = null;
          sections.push(currentSection);
        } else {
          if (!currentSection) {
            currentSection = createSection('Overview', 1);
            sections.push(currentSection);
          }
          currentSubsection = createSection(title, level);
          currentSection.subsections.push(currentSubsection);
        }
        return;
      }
      
      if (isBoldTitle(trimmedLine)) {
        finalizeList();
        const title = trimmedLine.replace(/^\*\*|\*\*$/g, '');
        currentSection = createSection(title, 2);
        currentSubsection = null;
        sections.push(currentSection);
        return;
      }
      
      if (isDefinition(trimmedLine)) {
        finalizeList();
        const match = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
        if (match) {
          addContentToCurrentContext({ 
            type: 'definition', 
            term: match[1].trim(),
            definition: match[2].trim()
          });
          return;
        }
      }
      
      if (isListItem(trimmedLine)) {
        const indentLevel = getIndentLevel(line);
        const listType = isNumberedItem(trimmedLine) ? 'ordered' : 'unordered';
        const itemText = trimmedLine.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '');
        
        if (!currentList) {
          currentList = { type: listType, items: [], baseIndent: indentLevel };
        }
        
        const relativeIndent = indentLevel - currentList.baseIndent;
        currentList.items.push({
          text: itemText,
          indent: Math.max(0, relativeIndent),
          listType
        });
        return;
      }
      
      finalizeList();
      addContentToCurrentContext({ type: 'paragraph', text: trimmedLine });
    });
    
    finalizeList();
    if (inCodeBlock && codeBlockContent.trim()) {
      addContentToCurrentContext({ type: 'code', language: codeBlockLang, content: codeBlockContent.trim() });
    }
    
    if (sections.length === 0 && content.trim()) {
      const defaultSection = createSection('Study Guide Content', 1);
      defaultSection.content.push({ type: 'paragraph', text: content });
      sections.push(defaultSection);
    }
    
    // Calculate estimated reading time per section
    sections.forEach(section => {
      let wordCount = 0;
      const countWords = (items) => {
        items.forEach(item => {
          if (item.type === 'paragraph') wordCount += item.text.split(' ').length;
          if (item.type === 'list') item.items.forEach(i => { wordCount += i.text.split(' ').length; });
          if (item.type === 'definition') wordCount += item.definition.split(' ').length;
        });
      };
      countWords(section.content);
      section.subsections.forEach(sub => countWords(sub.content));
      section.estimatedTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute
    });
    
    const stats = {
      total: sections.length,
      empty: sections.filter(s => !sectionHasContent(s)).length,
      withDiagrams: sections.filter(s => s.hasDiagram).length,
      withKeyPoints: sections.filter(s => s.hasKeyPoints).length,
      totalTime: sections.reduce((sum, s) => sum + s.estimatedTime, 0)
    };
    
    return { sections, rawContent: content, stats };
  }, [content]);

  function sectionHasContent(section) {
    const hasDirectContent = section.content && section.content.length > 0;
    const hasSubsections = section.subsections && section.subsections.length > 0;
    const subsectionsHaveContent = hasSubsections && 
      section.subsections.some(sub => sub.content && sub.content.length > 0);
    
    return hasDirectContent || subsectionsHaveContent;
  }

  const displaySections = useMemo(() => {
    if (showEmptySections) return parsedContent.sections;
    return parsedContent.sections.filter(section => sectionHasContent(section));
  }, [parsedContent.sections, showEmptySections]);

  // Initialize checklist items when sections change
  useEffect(() => {
    if (displaySections.length > 0 && Object.keys(checklistItems).length === 0) {
      const items = {};
      displaySections.forEach((section, index) => {
        if (section.title) {
          items[index] = {
            title: section.title,
            completed: false,
            confidence: 0,
            notes: ''
          };
        }
      });
      setChecklistItems(items);
    }
  }, [displaySections]);

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => setExpandedSections(new Set(displaySections.map((_, i) => i)));
  const collapseAll = () => setExpandedSections(new Set());

  const toggleBookmark = (index) => {
    const newBookmarks = new Set(bookmarkedSections);
    if (newBookmarks.has(index)) {
      newBookmarks.delete(index);
    } else {
      newBookmarks.add(index);
    }
    setBookmarkedSections(newBookmarks);
  };

  const navigateToSection = useCallback((index) => {
    setActiveSection(index);
    const newExpanded = new Set(expandedSections);
    newExpanded.add(index);
    setExpandedSections(newExpanded);
    
    if (sectionRefs.current[index]) {
      sectionRefs.current[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedSections]);

  const toggleChecklistItem = (index) => {
    setChecklistItems(prev => ({
      ...prev,
      [index]: { ...prev[index], completed: !prev[index]?.completed }
    }));
  };

  const updateConfidence = (index, confidence) => {
    setChecklistItems(prev => ({
      ...prev,
      [index]: { ...prev[index], confidence }
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 4) return 'text-emerald-600';
    if (confidence >= 2) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 4) return 'Confident';
    if (confidence >= 2) return 'Learning';
    return 'Need Review';
  };

  // Render inline formatting with better contrast
  const renderInlineFormatting = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={index} className="italic text-slate-800">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200">{part.slice(1, -1)}</code>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Render list with improved styling
  const renderList = (list, key) => {
    const ListTag = list.type === 'ordered' ? 'ol' : 'ul';
    const listClass = list.type === 'ordered' 
      ? 'list-decimal ml-6 space-y-2.5' 
      : 'space-y-2.5 ml-1';
    
    const renderItems = (items) => {
      const result = [];
      let i = 0;
      
      while (i < items.length) {
        const item = items[i];
        const nestedItems = [];
        let j = i + 1;
        
        while (j < items.length && items[j].indent > item.indent) {
          nestedItems.push(items[j]);
          j++;
        }
        
        result.push(
          <li key={i} className="text-slate-700 leading-relaxed flex items-start gap-3">
            {list.type !== 'ordered' && (
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
            )}
            <div className="flex-1">
              {renderInlineFormatting(item.text)}
              {nestedItems.length > 0 && (
                <ul className="mt-2 space-y-2 ml-5">
                  {nestedItems.map((nested, nIdx) => (
                    <li key={nIdx} className="text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></span>
                      <span>{renderInlineFormatting(nested.text)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
        
        i = j > i + 1 ? j : i + 1;
      }
      
      return result;
    };
    
    return <ListTag key={key} className={listClass}>{renderItems(list.items)}</ListTag>;
  };

  // Render code block with better contrast
  const renderCodeBlock = (item, key) => (
    <div key={key} className="my-5">
      {item.language && (
        <div className="bg-slate-700 text-slate-200 text-xs px-4 py-1.5 rounded-t-lg inline-block font-medium">
          {item.language}
        </div>
      )}
      <pre className={`bg-slate-800 text-slate-100 p-5 rounded-xl ${item.language ? 'rounded-tl-none' : ''} overflow-x-auto text-sm shadow-lg border border-slate-700`}>
        <code>{item.content}</code>
      </pre>
    </div>
  );

  // Render section content
  const renderSectionContent = (contentItems) => {
    if (!contentItems || contentItems.length === 0) return null;
    
    return (
      <div className="space-y-4">
        {contentItems.map((item, index) => {
          switch (item.type) {
            case 'list':
              return renderList(item, index);
            case 'paragraph':
              return (
                <p key={index} className="text-slate-700 leading-relaxed text-base">
                  {renderInlineFormatting(item.text)}
                </p>
              );
            case 'diagram':
              return <MermaidDiagram key={index} chart={item.content} id={item.id} />;
            case 'code':
              return renderCodeBlock(item, index);
            case 'definition':
              return <DefinitionBox key={index} term={item.term} definition={item.definition} />;
            default:
              return null;
          }
        })}
      </div>
    );
  };

  // Render subsections
  const renderSubsections = (subsections) => {
    if (!subsections || subsections.length === 0) return null;
    
    return (
      <div className="mt-6 space-y-6">
        {subsections.map((subsection, index) => (
          <div key={index} className="border-l-3 border-blue-300 pl-5 ml-2">
            <h4 className="font-bold text-slate-800 mb-4 text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {subsection.title}
            </h4>
            {renderSectionContent(subsection.content)}
            {renderSubsections(subsection.subsections)}
          </div>
        ))}
      </div>
    );
  };

  // Get preview snippet
  const getPreviewSnippet = (section) => {
    if (!section.content || section.content.length === 0) {
      if (section.subsections && section.subsections.length > 0) {
        return `${section.subsections.length} subsection(s)`;
      }
      return 'No content';
    }
    
    const firstContent = section.content[0];
    if (firstContent.type === 'paragraph') {
      const words = firstContent.text.split(' ');
      return words.length <= 15 ? firstContent.text : words.slice(0, 15).join(' ') + '...';
    }
    if (firstContent.type === 'list') {
      return `${firstContent.items.length} key point(s)`;
    }
    if (firstContent.type === 'diagram') {
      return 'Visual diagram included';
    }
    return '';
  };

  // Render guided learning view (new default)
  const renderGuidedView = () => {
    if (!displaySections || displaySections.length === 0) return null;

    return (
      <div className="flex gap-6">
        {/* Sidebar TOC */}
        {showTOC && displaySections.length > 2 && (
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <TableOfContents 
                sections={displaySections}
                activeSection={activeSection}
                onNavigate={navigateToSection}
                bookmarkedSections={bookmarkedSections}
              />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {displaySections.map((section, index) => {
            const isExpanded = expandedSections.has(index);
            const hasContent = sectionHasContent(section);
            const isBookmarked = bookmarkedSections.has(index);
            const checklistItem = checklistItems[index];
            
            return (
              <div 
                key={index} 
                ref={el => sectionRefs.current[index] = el}
                className={`border-2 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${
                  !hasContent 
                    ? 'border-amber-300 bg-amber-50/50' 
                    : isBookmarked 
                      ? 'border-amber-400 bg-amber-50/30'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`w-full p-5 text-left transition-all duration-200 flex items-center justify-between group ${
                    !hasContent 
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50' 
                      : 'bg-gradient-to-r from-slate-50 to-white hover:from-blue-50 hover:to-white'
                  }`}
                >
                  <button
                    onClick={() => toggleSection(index)}
                    className="flex-1 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                        {section.title}
                      </h3>
                      {section.hasDiagram && (
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Visual
                        </span>
                      )}
                      {!hasContent && (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                          Empty
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 ml-11 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {section.estimatedTime} min
                      </span>
                      {section.subsections?.length > 0 && (
                        <span>{section.subsections.length} subtopics</span>
                      )}
                      {checklistItem?.completed && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Check className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    {!isExpanded && hasContent && (
                      <p className="text-sm text-slate-500 mt-2 ml-11 line-clamp-1">
                        {getPreviewSnippet(section)}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBookmark(index)}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked 
                          ? 'text-amber-500 bg-amber-100' 
                          : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => toggleSection(index)}
                      className="text-slate-400 p-2 hover:text-blue-600 transition-colors"
                      aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-6 bg-white border-t border-slate-100">
                    {hasContent ? (
                      <>
                        {renderSectionContent(section.content)}
                        {renderSubsections(section.subsections)}
                        
                        {/* Section completion tracker */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => toggleChecklistItem(index)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                                  checklistItem?.completed
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border-2 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                                }`}
                              >
                                <Check className={`w-4 h-4 ${checklistItem?.completed ? 'text-emerald-600' : ''}`} />
                                {checklistItem?.completed ? 'Completed' : 'Mark Complete'}
                              </button>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600 font-medium">Confidence:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                      key={level}
                                      onClick={() => updateConfidence(index, level)}
                                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                        (checklistItem?.confidence || 0) >= level 
                                          ? 'bg-blue-500 text-white shadow-sm' 
                                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      }`}
                                    >
                                      {level}
                                    </button>
                                  ))}
                                </div>
                                {checklistItem?.confidence > 0 && (
                                  <span className={`text-sm font-medium ${getConfidenceColor(checklistItem.confidence)}`}>
                                    {getConfidenceLabel(checklistItem.confidence)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {index < displaySections.length - 1 && (
                              <button
                                onClick={() => navigateToSection(index + 1)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Next Topic <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10 text-slate-500">
                        <Inbox className="w-14 h-14 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">This section has no content yet.</p>
                        {onRegenerate && (
                          <button
                            onClick={onRegenerate}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw className="w-4 h-4" /> Regenerate to add content
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render cards view
  const renderAsCards = () => {
    if (!displaySections || displaySections.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displaySections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const hasContent = sectionHasContent(section);
          const checklistItem = checklistItems[index];
          
          return (
            <div 
              key={index} 
              className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${
                !hasContent ? 'border-amber-300' : checklistItem?.completed ? 'border-emerald-300' : 'border-slate-200'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-slate-800">{section.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    {checklistItem?.completed && <Check className="w-5 h-5 text-emerald-500" />}
                    {section.hasDiagram && <BarChart3 className="w-4 h-4 text-violet-500" />}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {section.estimatedTime} min
                  </span>
                  {section.subsections?.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {section.subsections.length} sub
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{getPreviewSnippet(section)}</p>
                
                {hasContent && (
                  <button
                    onClick={() => toggleSection(index)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    {isExpanded ? 'Show Less' : 'Expand Content'}
                  </button>
                )}
                
                {isExpanded && hasContent && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    {renderSectionContent(section.content)}
                    {renderSubsections(section.subsections)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render checklist view
  const renderAsChecklist = () => {
    return (
      <div className="space-y-6">
        <StudyStatsDashboard stats={parsedContent.stats} checklistItems={checklistItems} />
        
        <div className="space-y-4">
          {displaySections.map((section, index) => {
            const item = checklistItems[index] || { completed: false, confidence: 0 };
            
            return (
              <div 
                key={index} 
                className={`bg-white border-2 rounded-2xl p-5 shadow-sm transition-all ${
                  item.completed ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleChecklistItem(index)}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {item.completed && <Check className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-bold text-lg ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {section.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {section.estimatedTime} min
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Confidence:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(level => (
                            <button
                              key={level}
                              onClick={() => updateConfidence(index, level)}
                              className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                                item.confidence >= level 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        {item.confidence > 0 && (
                          <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                            {getConfidenceLabel(item.confidence)}
                          </span>
                        )}
                      </div>
                      
                      {section.hasDiagram && (
                        <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Has Diagram
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleSection(index)}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {expandedSections.has(index) ? 'Hide Content' : 'View Content'}
                    </button>
                    
                    {expandedSections.has(index) && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        {renderSectionContent(section.content)}
                        {renderSubsections(section.subsections)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Empty state
  if (!content || !content.trim()) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
        <BookOpen className="w-20 h-20 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Study Guide</h2>
        <p className="text-slate-500 mb-6">No content available to display</p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" /> Generate Study Guide
          </button>
        )}
      </div>
    );
  }

  const { stats } = parsedContent;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Study Guide</h2>
              <div className="flex items-center gap-4 text-blue-100 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" /> {stats.total} topics
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> ~{stats.totalTime} min
                </span>
                {stats.withDiagrams > 0 && (
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" /> {stats.withDiagrams} diagrams
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.empty > 0 && (
              <button
                onClick={() => setShowEmptySections(!showEmptySections)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  showEmptySections 
                    ? 'bg-amber-400 text-amber-900' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {showEmptySections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showEmptySections ? 'Hide Empty' : `${stats.empty} Empty`}
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all text-sm font-semibold shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Format Selector */}
        {displaySections.length > 1 && (
          <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">View</h3>
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                  {[
                    { id: 'guided', label: 'Guided', icon: Target },
                    { id: 'cards', label: 'Cards', icon: BarChart3 },
                    { id: 'checklist', label: 'Progress', icon: Check }
                  ].map(format => {
                    const Icon = format.icon;
                    return (
                      <button
                        key={format.id}
                        onClick={() => setDisplayFormat(format.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          displayFormat === format.id 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {format.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {displayFormat === 'guided' && (
                <div className="flex items-center gap-3">
                  {displaySections.length > 2 && (
                    <button
                      onClick={() => setShowTOC(!showTOC)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        showTOC ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <List className="w-4 h-4" />
                      Contents
                    </button>
                  )}
                  <button onClick={expandAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Expand All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button onClick={collapseAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Collapse All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div>
          {displayFormat === 'cards' ? renderAsCards() :
           displayFormat === 'checklist' ? renderAsChecklist() :
           renderGuidedView()}
        </div>

        {/* Footer tip */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-indigo-900 font-semibold">Study Tip</p>
              <p className="text-indigo-700 text-sm mt-1">
                Track your progress using the confidence ratings. Bookmark sections you want to revisit, 
                and use the Progress view to see your overall mastery at a glance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, Lightbulb, BarChart3, RefreshCw, ChevronDown, ChevronRight,
  Inbox, Check, Clock, Target, Bookmark, BookmarkCheck, List, 
  TrendingUp, Star, AlertCircle, Info, Zap, Eye, EyeOff, X
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
            padding: 15,
            nodeSpacing: 40,
            rankSpacing: 50,
            htmlLabels: true,
            defaultRenderer: 'dagre-wrapper',
            wrappingWidth: 150,
            useMaxWidth: true,
          },
          mindmap: {
            padding: 15,
            useMaxWidth: true,
          },
          // Global settings for text handling
          maxTextSize: 50000,
          wrap: true,
          securityLevel: 'loose',
        });
        
        // Generate unique ID to avoid conflicts
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart);
        
        // Post-process SVG to make it responsive with constrained height
        const enhancedSvg = renderedSvg
          // Remove fixed width/height and add viewBox for responsiveness
          .replace(/<svg([^>]*)width="[^"]*"/, '<svg$1width="100%"')
          .replace(/<svg([^>]*)height="[^"]*"/, '<svg$1height="auto"')
          .replace(/<svg([^>]*)style="[^"]*"/, '<svg$1style="max-width:100%;height:auto;max-height:380px;"')
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
      <div className="my-4 sm:my-6 p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-blue-200 sm:border-2 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 sm:my-6 bg-amber-50 border border-amber-200 sm:border-2 sm:border-amber-300 rounded-lg sm:rounded-xl p-3 sm:p-5 text-amber-900 text-sm">
        <div className="flex items-center gap-2 font-semibold mb-2 sm:mb-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span>Diagram Preview</span>
        </div>
        <pre className="text-xs bg-amber-100 p-2 sm:p-4 rounded-lg overflow-x-auto text-amber-800 border border-amber-200 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="my-4 sm:my-6 p-2 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-blue-200 sm:border-2 shadow-sm mermaid-diagram overflow-auto max-h-[400px] sm:max-h-[500px]"
      style={{ maxHeight: '400px' }}
    >
      <div 
        className="min-w-fit"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label="Concept diagram"
      />
    </div>
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
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />,
      bullet: 'text-rose-500'
    },
    normal: {
      container: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500',
      title: 'text-amber-900',
      icon: <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />,
      bullet: 'text-amber-600'
    },
    info: {
      container: 'bg-gradient-to-r from-sky-50 to-cyan-50 border-l-4 border-sky-500',
      title: 'text-sky-900',
      icon: <Info className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />,
      bullet: 'text-sky-500'
    }
  };
  
  const style = priorityStyles[priority] || priorityStyles.normal;
  
  return (
    <div className={`my-3 sm:my-5 ${style.container} rounded-r-lg sm:rounded-r-xl p-3 sm:p-5 shadow-sm`}>
      <h4 className={`font-bold ${style.title} mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base`}>
        {style.icon} {title}
      </h4>
      <ul className="space-y-1.5 sm:space-y-2">
        {points.map((point, idx) => (
          <li key={idx} className="text-slate-800 text-sm flex items-start gap-2 sm:gap-3 leading-relaxed">
            <span className={`${style.bullet} mt-1 sm:mt-1.5 text-base sm:text-lg`}>•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Enhanced definition box with better contrast
const DefinitionBox = ({ term, definition }) => (
  <div className="my-3 sm:my-4 bg-blue-50 border border-blue-200 sm:border-2 sm:border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="font-bold text-blue-900 text-sm sm:text-base flex items-center gap-2">
      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700 flex-shrink-0" />
      {term}
    </div>
    <div className="text-slate-700 text-sm mt-1.5 sm:mt-2 leading-relaxed pl-5 sm:pl-6">{definition}</div>
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
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-4 sm:mb-6 text-white shadow-xl">
      <h3 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
        <span>Study Progress</span>
      </h3>
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
          <div className="hidden sm:flex justify-center mb-2">
            <ProgressRing progress={progress} size={50} strokeWidth={5} />
          </div>
          <div className="text-lg sm:text-2xl font-bold text-blue-400">{progress}%</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Done</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
          <div className="text-lg sm:text-3xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">of {totalCount}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
          <div className="text-lg sm:text-3xl font-bold text-amber-400">{avgConfidence.toFixed(1)}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Conf.</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
          <div className="text-lg sm:text-3xl font-bold text-violet-400">{stats.withDiagrams}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Diag.</div>
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
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const diagramIdRef = useRef(0);
  const sectionRefs = useRef({});
  const mainHeaderRef = useRef(null);
  const containerRef = useRef(null);

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
    
    // Post-process: Handle empty sections by promoting subsection content or adding placeholder
    sections.forEach(section => {
      // If section has no direct content but has subsections with content, 
      // add an intro paragraph based on the section title
      if (section.content.length === 0 && section.subsections.length > 0) {
        const hasSubsectionContent = section.subsections.some(sub => sub.content.length > 0);
        if (hasSubsectionContent) {
          // Add a brief intro mentioning the subsections
          const subsectionNames = section.subsections
            .filter(sub => sub.content.length > 0)
            .map(sub => sub.title)
            .slice(0, 3);
          if (subsectionNames.length > 0) {
            section.content.push({
              type: 'paragraph',
              text: `This section covers: ${subsectionNames.join(', ')}${section.subsections.length > 3 ? ', and more' : ''}.`
            });
          }
        }
      }
      
      // Also check subsections for empty content
      section.subsections.forEach(subsection => {
        if (subsection.content.length === 0 && subsection.title) {
          // Mark as needing content but don't add placeholder - let UI handle it
          subsection.isEmpty = true;
        }
      });
    });
    
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

  // Intersection Observer to track which section is currently in view
  useEffect(() => {
    if (displaySections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is in upper portion of viewport
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Object.keys(sectionRefs.current).find(
            key => sectionRefs.current[key] === entry.target
          );
          if (index !== undefined) {
            setActiveSection(Number.parseInt(index, 10));
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section refs
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [displaySections.length]);

  // Intersection Observer to show/hide sticky header when scrolling past the study guide header
  useEffect(() => {
    if (!mainHeaderRef.current || !containerRef.current) return;

    const handleScroll = () => {
      if (!mainHeaderRef.current || !containerRef.current) return;
      
      const headerRect = mainHeaderRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Show sticky header only when:
      // 1. The main header has scrolled above the viewport (we've scrolled past it)
      // 2. The study guide container is still partially visible (we're still viewing the study guide)
      const headerIsAbove = headerRect.bottom < 0;
      const containerIsVisible = containerRect.bottom > 0 && containerRect.top < window.innerHeight;
      
      setShowStickyHeader(headerIsAbove && containerIsVisible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      ? 'list-decimal ml-4 sm:ml-6 space-y-2' 
      : 'space-y-2 ml-0.5 sm:ml-1';
    
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
          <li key={i} className="text-slate-700 leading-relaxed flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
            {list.type !== 'ordered' && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
            )}
            <div className="flex-1 min-w-0">
              {renderInlineFormatting(item.text)}
              {nestedItems.length > 0 && (
                <ul className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 ml-3 sm:ml-5">
                  {nestedItems.map((nested, nIdx) => (
                    <li key={nIdx} className="text-slate-600 leading-relaxed flex items-start gap-1.5 sm:gap-2 text-sm">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></span>
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

  // Render code block with better contrast and constrained height
  const renderCodeBlock = (item, key) => (
    <div key={key} className="my-3 sm:my-5">
      {item.language && (
        <div className="bg-slate-700 text-slate-200 text-xs px-3 sm:px-4 py-1 sm:py-1.5 rounded-t-lg inline-block font-medium">
          {item.language}
        </div>
      )}
      <pre className={`bg-slate-800 text-slate-100 p-3 sm:p-5 rounded-lg sm:rounded-xl ${item.language ? 'rounded-tl-none' : ''} overflow-auto text-xs sm:text-sm shadow-lg border border-slate-700 max-h-[300px]`}>
        <code className="whitespace-pre-wrap break-words">{item.content}</code>
      </pre>
    </div>
  );

  // Render section content
  const renderSectionContent = (contentItems) => {
    if (!contentItems || contentItems.length === 0) return null;
    
    return (
      <div className="space-y-3 sm:space-y-4">
        {contentItems.map((item, index) => {
          switch (item.type) {
            case 'list':
              return renderList(item, index);
            case 'paragraph':
              return (
                <p key={index} className="text-slate-700 leading-relaxed text-sm sm:text-base">
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
      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {subsections.map((subsection, index) => (
          <div key={index} className="border-l-2 sm:border-l-3 border-blue-300 pl-3 sm:pl-5 ml-1 sm:ml-2">
            <h4 className="font-bold text-slate-800 mb-2 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></span>
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

  // Render guided learning view content (TOC is now separate)
  const renderGuidedViewContent = () => {
    if (!displaySections || displaySections.length === 0) return null;

    return (
      <div className="space-y-2 sm:space-y-6">
        {displaySections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const hasContent = sectionHasContent(section);
          const isBookmarked = bookmarkedSections.has(index);
          const checklistItem = checklistItems[index];
          
          return (
            <div 
              key={index} 
              ref={el => sectionRefs.current[index] = el}
              className={`border sm:border-2 rounded-lg sm:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ${
                !hasContent 
                  ? 'border-amber-300 bg-amber-50/50' 
                  : isBookmarked 
                    ? 'border-amber-400 bg-amber-50/30'
                    : 'border-slate-200 bg-white'
              }`}
            >
                <div
                  className={`w-full p-2 sm:p-5 text-left transition-all duration-200 flex items-center justify-between group rounded-t-lg sm:rounded-t-2xl ${
                    !hasContent 
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50' 
                      : 'bg-gradient-to-r from-slate-50 to-white hover:from-blue-50 hover:to-white'
                  }`}
                >
                  <button
                    onClick={() => toggleSection(index)}
                    className="flex-1 text-left min-w-0"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start gap-2 mb-0.5 sm:mb-1">
                      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold inline-flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-lg group-hover:text-blue-700 transition-colors line-clamp-2 sm:truncate leading-tight">
                          {section.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>{section.estimatedTime}m</span>
                          </span>
                          {checklistItem?.completed && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          )}
                          {section.hasDiagram && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                              <BarChart3 className="w-3 h-3" /> Visual
                            </span>
                          )}
                          {!hasContent && (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                              Empty
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 self-start mt-1 sm:mt-0 sm:self-center">
                    <button
                      onClick={() => toggleBookmark(index)}
                      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
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
                      className="text-slate-400 p-1.5 hover:text-blue-600 transition-colors flex items-center justify-center"
                      aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-2 sm:p-6 bg-white border-t border-slate-100">
                    {hasContent ? (
                      <>
                        {renderSectionContent(section.content)}
                        {renderSubsections(section.subsections)}
                        
                        {/* Section completion tracker */}
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <button
                                onClick={() => toggleChecklistItem(index)}
                                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                  checklistItem?.completed
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border-2 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                                }`}
                              >
                                <Check className={`w-4 h-4 ${checklistItem?.completed ? 'text-emerald-600' : ''}`} />
                                {checklistItem?.completed ? 'Completed' : 'Mark Complete'}
                              </button>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm text-slate-600 font-medium">Confidence:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                      key={level}
                                      onClick={() => updateConfidence(index, level)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
                                  <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${getConfidenceColor(checklistItem.confidence)}`}>
                                    {getConfidenceLabel(checklistItem.confidence)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {index < displaySections.length - 1 && (
                              <button
                                onClick={() => navigateToSection(index + 1)}
                                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
                              >
                                Next Topic <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 sm:py-10 text-slate-500">
                        <Inbox className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-sm sm:text-base">This section has no content yet.</p>
                        {onRegenerate && (
                          <button
                            onClick={onRegenerate}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto text-sm"
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
    );
  };

  // Render cards view
  const renderAsCards = () => {
    if (!displaySections || displaySections.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        {displaySections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const hasContent = sectionHasContent(section);
          const checklistItem = checklistItems[index];
          
          return (
            <div 
              key={index} 
              className={`bg-white rounded-xl sm:rounded-2xl border sm:border-2 shadow-sm hover:shadow-lg transition-all duration-300 ${
                !hasContent ? 'border-amber-300' : checklistItem?.completed ? 'border-emerald-300' : 'border-slate-200'
              }`}
            >
              <div className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight line-clamp-2">{section.title}</h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {checklistItem?.completed && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />}
                    {section.hasDiagram && <BarChart3 className="w-4 h-4 text-violet-500" />}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mb-2 sm:mb-3 ml-8 sm:ml-9">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" /> 
                    <span>{section.estimatedTime}m</span>
                  </span>
                  {section.subsections?.length > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {section.subsections.length} sub
                    </span>
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-2 ml-8 sm:ml-9">{getPreviewSnippet(section)}</p>
                
                {hasContent && (
                  <button
                    onClick={() => toggleSection(index)}
                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold ml-8 sm:ml-9"
                  >
                    {isExpanded ? 'Show Less' : 'Expand Content'}
                  </button>
                )}
                
                {isExpanded && hasContent && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
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
      <div className="space-y-4 sm:space-y-6">
        <StudyStatsDashboard stats={parsedContent.stats} checklistItems={checklistItems} />
        
        <div className="space-y-3 sm:space-y-4">
          {displaySections.map((section, index) => {
            const item = checklistItems[index] || { completed: false, confidence: 0 };
            
            return (
              <div 
                key={index} 
                className={`bg-white border sm:border-2 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm transition-all overflow-hidden ${
                  item.completed ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  <button
                    onClick={() => toggleChecklistItem(index)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                      item.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-bold text-sm sm:text-lg leading-tight ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {section.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 flex-shrink-0">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{section.estimatedTime}m</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs text-slate-600">Confidence:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(level => (
                            <button
                              key={level}
                              onClick={() => updateConfidence(index, level)}
                              className={`w-7 h-7 rounded-md text-xs font-medium transition-all flex-shrink-0 ${
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
                          <span className={`text-xs font-medium hidden sm:inline ${getConfidenceColor(item.confidence)}`}>
                            {getConfidenceLabel(item.confidence)}
                          </span>
                        )}
                      </div>
                      
                      {section.hasDiagram && (
                        <span className="hidden sm:inline-flex px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full items-center gap-1 w-fit">
                          <BarChart3 className="w-3 h-3" /> Has Diagram
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleSection(index)}
                      className="mt-2 sm:mt-3 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                    >
                      {expandedSections.has(index) ? 'Hide Content' : 'View Content'}
                    </button>
                    
                    {expandedSections.has(index) && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
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

  // Mobile TOC drawer
  const MobileTOCDrawer = () => (
    <div 
      className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        showTOC ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowTOC(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && setShowTOC(false)}
        aria-label="Close contents menu"
      />
      {/* Drawer */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ${
          showTOC ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 text-blue-600" /> Contents
          </h3>
          <button 
            onClick={() => setShowTOC(false)}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors"
            aria-label="Close contents menu"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <TableOfContents 
            sections={displaySections}
            activeSection={activeSection}
            onNavigate={(index) => {
              navigateToSection(index);
              setShowTOC(false);
            }}
            bookmarkedSections={bookmarkedSections}
          />
        </div>
      </div>
    </div>
  );

  // Mobile sticky header that shows current topic
  const MobileStickyHeader = () => {
    const currentSection = displaySections[activeSection];
    const checklistItem = checklistItems[activeSection];
    const completedCount = Object.values(checklistItems).filter(item => item.completed).length;
    const totalSections = displaySections.length;
    
    if (!currentSection) return null;
    
    return (
      <div 
        className={`fixed top-0 left-0 right-0 z-40 lg:hidden transform transition-transform duration-300 ${
          showStickyHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="bg-white border-b border-gray-200 shadow-sm">
          {/* Main row */}
          <div className="flex items-center gap-2 px-3 py-2">
            {/* TOC button */}
            <button
              onClick={() => setShowTOC(true)}
              className="p-2 bg-gray-100 rounded-lg text-gray-600 active:bg-gray-200 transition-colors flex-shrink-0"
              aria-label="Open table of contents"
            >
              <List className="w-5 h-5" />
            </button>
            
            {/* Current section info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {activeSection + 1}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {currentSection.title}
                </span>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((activeSection + 1) / totalSections) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {activeSection + 1}/{totalSections}
                </span>
              </div>
            </div>
            
            {/* Mark complete button */}
            <button
              onClick={() => toggleChecklistItem(activeSection)}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                checklistItem?.completed 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
              aria-label={checklistItem?.completed ? 'Completed - tap to undo' : 'Mark as complete'}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
          
          {/* Completion summary - only show if some progress made */}
          {completedCount > 0 && (
            <div className="px-3 pb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {completedCount} of {totalSections} topics completed
                </span>
                <span className="text-emerald-600 font-medium">
                  {Math.round((completedCount / totalSections) * 100)}% done
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile Sticky Header */}
      <MobileStickyHeader />
      
      {/* Mobile TOC Drawer */}
      <MobileTOCDrawer />
      
      {/* Desktop Layout: TOC sidebar + Content */}
      <div className="flex gap-4 lg:gap-6">
        {/* Desktop TOC - Fixed sidebar outside content */}
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
        
        {/* Main Content Card - Full width */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div ref={mainHeaderRef} className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-6 py-3 sm:py-6 text-white rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-bold">Study Guide</h2>
                    <div className="flex items-center gap-2 sm:gap-4 text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{stats.total}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{stats.totalTime}m</span>
                      </span>
                      {stats.withDiagrams > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{stats.withDiagrams}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  {stats.empty > 0 && (
                    <button
                      onClick={() => setShowEmptySections(!showEmptySections)}
                      className={`p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center ${
                        showEmptySections 
                          ? 'bg-amber-400 text-amber-900' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {showEmptySections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="p-1.5 sm:px-4 sm:py-2 bg-white text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1.5 sm:gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Regenerate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-1.5 sm:p-6">
              {/* Format Selector */}
              {displaySections.length > 1 && (
                <div className="mb-2 sm:mb-6 bg-slate-50 rounded-lg sm:rounded-xl p-1.5 sm:p-4 border border-slate-200">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex bg-white rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-slate-200 shadow-sm">
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
                              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center justify-center gap-1 sm:gap-2 ${
                                displayFormat === format.id 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="hidden sm:inline">{format.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {displayFormat === 'guided' && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        {displaySections.length > 2 && (
                          <button
                            onClick={() => setShowTOC(!showTOC)}
                            className={`px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 sm:gap-2 ${
                              showTOC ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <List className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Contents</span>
                          </button>
                        )}
                        <button onClick={expandAll} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium hidden sm:block">
                          Expand All
                        </button>
                        <span className="text-slate-300 hidden sm:block">|</span>
                        <button onClick={collapseAll} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium hidden sm:block">
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
                 renderGuidedViewContent()}
              </div>

              {/* Footer tip */}
              <div className="mt-4 sm:mt-8 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-indigo-200">
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Star className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-indigo-900 font-semibold text-xs sm:text-base">Study Tip</p>
                    <p className="text-indigo-700 text-xs sm:text-sm mt-0.5 sm:mt-1">
                      Track your progress using the confidence ratings. Bookmark sections you want to revisit, 
                      and use the Progress view to see your overall mastery at a glance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

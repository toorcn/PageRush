'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookOpen, Lightbulb, BarChart3, RefreshCw, ChevronDown, ChevronRight,
  Inbox, Check
} from 'lucide-react';

// Mermaid diagram component
const MermaidDiagram = ({ chart, id }) => {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#93c5fd',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#eff6ff'
          },
          flowchart: { curve: 'basis', padding: 20 },
          securityLevel: 'loose'
        });
        
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Unable to render diagram');
      }
    };
    
    if (chart) renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
        <span className="font-medium">Diagram:</span> {error}
        <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="my-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// Simple concept map using CSS (fallback when mermaid isn't suitable)
const ConceptMap = ({ concepts }) => {
  if (!concepts || concepts.length === 0) return null;
  
  const mainConcept = concepts[0];
  const relatedConcepts = concepts.slice(1);
  
  return (
    <div className="my-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <div className="flex flex-col items-center">
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md">
          {mainConcept}
        </div>
        {relatedConcepts.length > 0 && (
          <>
            <div className="w-0.5 h-8 bg-indigo-300"></div>
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
              {relatedConcepts.map((concept, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-indigo-200 -translate-x-1/2"></div>
                  <div className="bg-white px-4 py-2 rounded-lg border-2 border-indigo-200 text-indigo-800 font-medium shadow-sm hover:shadow-md transition-shadow">
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

// Key points highlight box
const KeyPointsBox = ({ points, title = "Key Points" }) => {
  if (!points || points.length === 0) return null;
  
  return (
    <div className="my-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-r-lg p-4">
      <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> {title}
      </h4>
      <ul className="space-y-1">
        {points.map((point, idx) => (
          <li key={idx} className="text-amber-900 text-sm flex items-start gap-2">
            <span className="text-amber-500 mt-1">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Definition box
const DefinitionBox = ({ term, definition }) => (
  <div className="my-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="font-semibold text-blue-900">{term}</div>
    <div className="text-blue-800 text-sm mt-1">{definition}</div>
  </div>
);

export default function StudyGuide({ content, onRegenerate }) {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [displayFormat, setDisplayFormat] = useState('sections');
  const [checklistItems, setChecklistItems] = useState({});
  const [showEmptySections, setShowEmptySections] = useState(false);
  const diagramIdRef = useRef(0);

  // Parse content into a structured hierarchy with enhanced detection
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
      hasKeyPoints: false
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
        // Check if this looks like key points
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
      
      // Handle code blocks (including mermaid diagrams)
      if (isCodeBlockStart(trimmedLine)) {
        if (inCodeBlock) {
          // End of code block
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
          // Start of code block
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
      
      // Skip empty lines but finalize lists
      if (!trimmedLine) {
        if (currentList && currentList.items.length > 0) {
          const nextNonEmpty = lines.slice(index + 1).find(l => l.trim());
          if (!nextNonEmpty || !isListItem(nextNonEmpty)) {
            finalizeList();
          }
        }
        return;
      }
      
      // Handle headers
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
      
      // Handle bold titles as section headers
      if (isBoldTitle(trimmedLine)) {
        finalizeList();
        const title = trimmedLine.replace(/^\*\*|\*\*$/g, '');
        currentSection = createSection(title, 2);
        currentSubsection = null;
        sections.push(currentSection);
        return;
      }
      
      // Handle definitions (Term: Definition format)
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
      
      // Handle list items
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
      
      // Regular paragraph text
      finalizeList();
      addContentToCurrentContext({ type: 'paragraph', text: trimmedLine });
    });
    
    // Finalize any remaining content
    finalizeList();
    if (inCodeBlock && codeBlockContent.trim()) {
      addContentToCurrentContext({ type: 'code', language: codeBlockLang, content: codeBlockContent.trim() });
    }
    
    // If no sections were created, create one from the content
    if (sections.length === 0 && content.trim()) {
      const defaultSection = createSection('Study Guide Content', 1);
      defaultSection.content.push({ type: 'paragraph', text: content });
      sections.push(defaultSection);
    }
    
    // Calculate stats
    const stats = {
      total: sections.length,
      empty: sections.filter(s => !sectionHasContent(s)).length,
      withDiagrams: sections.filter(s => s.hasDiagram).length,
      withKeyPoints: sections.filter(s => s.hasKeyPoints).length
    };
    
    return { sections, rawContent: content, stats };
  }, [content]);

  // Check if section has meaningful content
  function sectionHasContent(section) {
    const hasDirectContent = section.content && section.content.length > 0;
    const hasSubsections = section.subsections && section.subsections.length > 0;
    const subsectionsHaveContent = hasSubsections && 
      section.subsections.some(sub => sub.content && sub.content.length > 0);
    
    return hasDirectContent || subsectionsHaveContent;
  }

  // Filter sections based on showEmptySections toggle
  const displaySections = useMemo(() => {
    if (showEmptySections) return parsedContent.sections;
    return parsedContent.sections.filter(section => sectionHasContent(section));
  }, [parsedContent.sections, showEmptySections]);

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(displaySections.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Generate checklist items
  const generateChecklistItems = () => {
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
  };

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

  const updateNotes = (index, notes) => {
    setChecklistItems(prev => ({
      ...prev,
      [index]: { ...prev[index], notes }
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 4) return 'text-green-600';
    if (confidence >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 4) return 'Very Confident';
    if (confidence >= 2) return 'Somewhat Confident';
    return 'Not Confident';
  };

  // Render inline formatting
  const renderInlineFormatting = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={index} className="italic text-gray-800">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Render list with nesting
  const renderList = (list, key) => {
    const ListTag = list.type === 'ordered' ? 'ol' : 'ul';
    const listClass = list.type === 'ordered' 
      ? 'list-decimal ml-6 space-y-2' 
      : 'list-disc ml-6 space-y-2';
    
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
          <li key={i} className="text-gray-700 leading-relaxed">
            {renderInlineFormatting(item.text)}
            {nestedItems.length > 0 && (
              <ul className="list-disc ml-6 mt-2 space-y-1">
                {nestedItems.map((nested, nIdx) => (
                  <li key={nIdx} className="text-gray-600 leading-relaxed">
                    {renderInlineFormatting(nested.text)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
        
        i = j > i + 1 ? j : i + 1;
      }
      
      return result;
    };
    
    return <ListTag key={key} className={listClass}>{renderItems(list.items)}</ListTag>;
  };

  // Render code block
  const renderCodeBlock = (item, key) => (
    <div key={key} className="my-4">
      {item.language && (
        <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-t-lg inline-block">
          {item.language}
        </div>
      )}
      <pre className={`bg-gray-800 text-gray-100 p-4 rounded-lg ${item.language ? 'rounded-tl-none' : ''} overflow-x-auto text-sm`}>
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
                <p key={index} className="text-gray-700 leading-relaxed">
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
          <div key={index} className="border-l-2 border-blue-200 pl-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-base">{subsection.title}</h4>
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
      return words.length <= 20 ? firstContent.text : words.slice(0, 20).join(' ') + '...';
    }
    if (firstContent.type === 'list') {
      return `${firstContent.items.length} item(s)`;
    }
    if (firstContent.type === 'diagram') {
      return 'Contains diagram';
    }
    return '';
  };


  // Render table view
  const renderAsTable = () => {
    if (!displaySections || displaySections.length === 0) return null;

    return (
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Section</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Preview</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Details</th>
            </tr>
          </thead>
          <tbody>
            {displaySections.map((section, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-800 border-b border-gray-100">
                  {section.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100">
                  {getPreviewSnippet(section)}
                </td>
                <td className="px-6 py-4 text-sm border-b border-gray-100">
                  <div className="flex gap-2 flex-wrap">
                    {section.subsections?.length > 0 && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {section.subsections.length} sub
                      </span>
                    )}
                    {section.hasDiagram && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Diagram
                      </span>
                    )}
                    {!sectionHasContent(section) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        Empty
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render cards view
  const renderAsCards = () => {
    if (!displaySections || displaySections.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displaySections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const hasContent = sectionHasContent(section);
          
          return (
            <div key={index} className={`bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${!hasContent ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{section.title}</h3>
                  <div className="flex gap-1">
                    {section.hasDiagram && <BarChart3 className="w-4 h-4 text-purple-600" />}
                    {section.subsections?.length > 0 && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {section.subsections.length}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">{getPreviewSnippet(section)}</div>
                
                {hasContent && (
                  <button
                    onClick={() => toggleSection(index)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {isExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
                
                {isExpanded && hasContent && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
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
    const completedCount = Object.values(checklistItems).filter(item => item.completed).length;
    const totalCount = Object.keys(checklistItems).length;
    const averageConfidence = totalCount > 0 
      ? Object.values(checklistItems).reduce((sum, item) => sum + item.confidence, 0) / totalCount 
      : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{completedCount}/{totalCount}</div>
              <div className="text-sm text-gray-600">Topics Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getConfidenceColor(averageConfidence)}`}>
                {averageConfidence.toFixed(1)}/5
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(checklistItems).map(([index, item]) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(Number(index))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <h3 className={`font-medium text-lg ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {item.title}
                  </h3>
                  
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Confidence:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          onClick={() => updateConfidence(Number(index), level)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.confidence >= level 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                      <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                        {getConfidenceLabel(item.confidence)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">Notes:</span>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateNotes(Number(index), e.target.value)}
                      placeholder="Add your notes..."
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Empty state
  if (!content || !content.trim()) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4"><BookOpen className="w-16 h-16 mx-auto text-gray-400" /></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Study Guide</h2>
        <p className="text-gray-600 mb-6">No content available to display</p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Generate Study Guide
          </button>
        )}
      </div>
    );
  }

  const { stats } = parsedContent;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Study Guide</h2>
              <p className="text-gray-600 text-sm">
                {stats.total} sections • {stats.withDiagrams > 0 && `${stats.withDiagrams} with diagrams • `}
                {stats.empty > 0 && <span className="text-yellow-600">{stats.empty} empty</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.empty > 0 && (
              <button
                onClick={() => setShowEmptySections(!showEmptySections)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showEmptySections 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showEmptySections ? 'Hide Empty' : 'Show Empty'}
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Format Selector */}
        {displaySections.length > 1 && (
          <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg text-gray-800">Display Format</h3>
                <div className="flex space-x-2">
                  {['sections', 'table', 'cards', 'checklist'].map(format => (
                    <button
                      key={format}
                      onClick={() => {
                        setDisplayFormat(format);
                        if (format === 'checklist' && Object.keys(checklistItems).length === 0) {
                          generateChecklistItems();
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors capitalize ${
                        displayFormat === format 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              {displayFormat === 'sections' && (
                <div className="flex gap-2">
                  <button onClick={expandAll} className="text-sm text-blue-600 hover:text-blue-700">
                    Expand All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={collapseAll} className="text-sm text-blue-600 hover:text-blue-700">
                    Collapse All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          {displayFormat === 'table' ? renderAsTable() :
           displayFormat === 'cards' ? renderAsCards() :
           displayFormat === 'checklist' ? renderAsChecklist() :
           displaySections.map((section, index) => {
             const isExpanded = expandedSections.has(index);
             const hasContent = sectionHasContent(section);
             
             return (
               <div key={index} className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${!hasContent ? 'border-yellow-200' : 'border-gray-200'}`}>
                 <button
                   onClick={() => toggleSection(index)}
                   className={`w-full p-4 text-left transition-all duration-200 flex items-center justify-between group ${
                     !hasContent 
                       ? 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100' 
                       : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                   }`}
                   aria-expanded={isExpanded}
                 >
                   <div className="flex-1 text-left">
                   <div className="font-semibold text-gray-800 text-lg group-hover:text-blue-700 transition-colors flex items-center gap-2">
                       {section.title}
                       {section.hasDiagram && <BarChart3 className="w-4 h-4 text-purple-500" />}
                       {!hasContent && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">Empty</span>}
                     </div>
                     {!isExpanded && hasContent && (
                       <div className="text-sm text-gray-500 mt-2 line-clamp-2">
                         {getPreviewSnippet(section)}
                       </div>
                     )}
                   </div>
                   <div className="flex items-center space-x-2">
                     {section.subsections?.length > 0 && (
                       <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                         {section.subsections.length} sub
                       </span>
                     )}
                     <span className="text-gray-500 text-lg transition-transform duration-200 group-hover:text-blue-600">
                       {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                     </span>
                   </div>
                 </button>
                 {isExpanded && (
                   <div className="p-6 bg-white border-t border-gray-200">
                     {hasContent ? (
                       <>
                         {renderSectionContent(section.content)}
                         {renderSubsections(section.subsections)}
                       </>
                     ) : (
                       <div className="text-center py-8 text-gray-500">
                         <Inbox className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                         <p>This section has no content yet.</p>
                         {onRegenerate && (
                           <button
                             onClick={onRegenerate}
                             className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                           >
                             Regenerate to add content
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

        {/* Footer */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-blue-800 font-medium">Study Tip</p>
              <p className="text-blue-700 text-sm">
                Use the Checklist view to track your progress and confidence levels. 
                Diagrams help visualize relationships between concepts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

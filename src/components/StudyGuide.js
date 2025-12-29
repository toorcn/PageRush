'use client';
import React, { useState } from 'react';

export default function StudyGuide({ content, onRegenerate }) {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [displayFormat, setDisplayFormat] = useState('sections'); // 'sections', 'table', 'cards', 'checklist'
  const [checklistItems, setChecklistItems] = useState({});
  const [showChecklist, setShowChecklist] = useState(false);

  // Enhanced section detection with better regex patterns
  const sections = content
    .split(/\n(?=#{1,6}\s|\*\*[^*]+\*\*|^[A-Z][^a-z]|^[0-9]+\.\s|^[-*]\s)/)
    .map(section => section.trim())
    .filter(section => section.length > 0 && section !== content.trim()); // Avoid single section if it's the same as content



  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  // Generate checklist items from content
  const generateChecklistItems = () => {
    const items = {};
    sections.forEach((section, index) => {
      const title = extractSectionTitle(section);
      if (title) {
        items[index] = {
          title: title,
          completed: false,
          confidence: 0, // 0-5 scale
          notes: ''
        };
      }
    });
    setChecklistItems(items);
  };

  const toggleChecklistItem = (index) => {
    setChecklistItems(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        completed: !prev[index]?.completed
      }
    }));
  };

  const updateConfidence = (index, confidence) => {
    setChecklistItems(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        confidence: confidence
      }
    }));
  };

  const updateNotes = (index, notes) => {
    setChecklistItems(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        notes: notes
      }
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

  // Enhanced function to render markdown-like formatting with better styling
  const renderFormattedText = (text) => {
    if (!text.trim()) return null;
    
    return text
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .map((line, index) => {
        // Handle headers with better styling
        if (line.startsWith('#')) {
          const level = line.match(/^#+/)[0].length;
          const content = line.replace(/^#+\s*/, '');
          const Tag = `h${Math.min(level, 6)}`;
          const headerClasses = {
            1: 'text-2xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2 mb-4',
            2: 'text-xl font-semibold text-gray-800 mt-6 mb-3',
            3: 'text-lg font-medium text-gray-700 mt-4 mb-2',
            4: 'text-base font-medium text-gray-700 mt-3 mb-2',
            5: 'text-sm font-medium text-gray-600 mt-2 mb-1',
            6: 'text-sm font-medium text-gray-600 mt-2 mb-1'
          };
          
          return React.createElement(Tag, {
            key: index,
            className: headerClasses[level] || headerClasses[6]
          }, content);
        }
        
        // Handle bold text with better styling
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/);
          return (
            <p key={index} className="mb-3 leading-relaxed">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="font-semibold text-gray-800 bg-yellow-50 px-1 rounded">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex} className="text-gray-700">{part}</span>;
              })}
            </p>
          );
        }
        
        // Handle bullet lists with better styling
        if (line.match(/^[-*]\s/)) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700 leading-relaxed list-disc">
              {line.replace(/^[-*]\s/, '')}
            </li>
          );
        }
        
        // Handle numbered lists with better styling
        if (line.match(/^\d+\.\s/)) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700 leading-relaxed list-decimal">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          );
        }
        
        // Handle code blocks (simple inline code)
        if (line.includes('`')) {
          const parts = line.split(/(`[^`]+`)/);
          return (
            <p key={index} className="mb-3 leading-relaxed">
              {parts.map((part, partIndex) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                  return <code key={partIndex} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
                }
                return <span key={partIndex} className="text-gray-700">{part}</span>;
              })}
            </p>
          );
        }
        
        // Regular text with improved styling
        return <p key={index} className="mb-3 text-gray-700 leading-relaxed">{line}</p>;
      });
  };

  // Enhanced preview snippet with better formatting
  const getPreviewSnippet = (text) => {
    const cleanText = text.replace(/^[#*]+\s*/, '').trim();
    const words = cleanText.split(' ');
    if (words.length <= 20) return cleanText;
    return words.slice(0, 20).join(' ') + '...';
  };

  // Improved title extraction function
  const extractSectionTitle = (section) => {
    const lines = section.split('\n');
    const firstLine = lines[0].trim();
    
    // Handle markdown headers
    if (firstLine.startsWith('#')) {
      return firstLine.replace(/^#+\s*/, '').trim();
    }
    
    // Handle bold text
    if (firstLine.startsWith('**') && firstLine.endsWith('**')) {
      return firstLine.replace(/^\*\*|\*\*$/g, '').trim();
    }
    
    // Handle numbered lists
    if (firstLine.match(/^\d+\.\s/)) {
      return firstLine.replace(/^\d+\.\s/, '').trim();
    }
    
    // Handle bullet lists
    if (firstLine.match(/^[-*]\s/)) {
      return firstLine.replace(/^[-*]\s/, '').trim();
    }
    
    // For regular text, take the first meaningful line
    return firstLine || 'Untitled Section';
  };

  // Improved section type detection
  const isMainSection = (section) => {
    const firstLine = section.split('\n')[0].trim();
    return firstLine.startsWith('#') || 
           (firstLine.startsWith('**') && firstLine.endsWith('**')) ||
           firstLine.match(/^[A-Z][^a-z]/) ||
           firstLine.match(/^\d+\.\s/);
  };

  // Get section content (everything except the title)
  const getSectionContent = (section) => {
    const lines = section.split('\n');
    const firstLine = lines[0].trim();
    
    // If the first line is a title (header, bold, or list item), skip it
    if (firstLine.startsWith('#') || 
        (firstLine.startsWith('**') && firstLine.endsWith('**')) ||
        firstLine.match(/^[A-Z][^a-z]/) ||
        firstLine.match(/^[-*]\s/) ||
        firstLine.match(/^\d+\.\s/)) {
      return lines.slice(1).join('\n').trim();
    }
    
    // Otherwise, return the entire section
    return section;
  };

  // Enhanced rendering functions for different display formats
  const renderAsTable = () => {
    if (!sections || sections.length === 0) return null;

    return (
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Section</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Content Preview</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border-b border-gray-200">Type</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, index) => {
              const title = extractSectionTitle(section);
              const content = getSectionContent(section);
              const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
              const isMain = isMainSection(section);
              
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 border-b border-gray-100">
                    {title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100">
                    {preview}
                  </td>
                  <td className="px-6 py-4 text-sm border-b border-gray-100">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      isMain ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {isMain ? 'Main Section' : 'Subsection'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAsCards = () => {
    if (!sections || sections.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, index) => {
          const title = extractSectionTitle(section);
          const content = getSectionContent(section);
          const isMain = isMainSection(section);
          const isExpanded = expandedSections.has(index);
          
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{title}</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    isMain ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isMain ? 'Main' : 'Sub'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {content.substring(0, 150) + (content.length > 150 ? '...' : '')}
                </div>
                
                <button
                  onClick={() => toggleSection(index)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                </button>
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="prose prose-sm max-w-none">
                      {renderFormattedText(content)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAsChecklist = () => {
    const completedCount = Object.values(checklistItems).filter(item => item.completed).length;
    const totalCount = Object.keys(checklistItems).length;
    const averageConfidence = Object.values(checklistItems).reduce((sum, item) => sum + item.confidence, 0) / totalCount || 0;

    return (
      <div className="space-y-6">
        {/* Progress Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{completedCount}/{totalCount}</div>
              <div className="text-sm text-gray-600">Topics Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{Math.round((completedCount/totalCount)*100)}%</div>
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

        {/* Checklist Items */}
        <div className="space-y-4">
          {Object.entries(checklistItems).map(([index, item]) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(parseInt(index))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <h3 className={`font-medium text-lg ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {item.title}
                  </h3>
                  
                  {/* Confidence Rating */}
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-700">Confidence Level:</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          onClick={() => updateConfidence(parseInt(index), level)}
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

                  {/* Notes */}
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Notes:</label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateNotes(parseInt(index), e.target.value)}
                      placeholder="Add your notes about this topic..."
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

  // Check if content is empty or invalid
  if (!content || !content.trim()) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Study Guide</h2>
        <p className="text-gray-600 mb-6">No content available to display</p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            🔄 Generate Study Guide
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📚</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Study Guide</h2>
              <p className="text-gray-600 text-sm">Organized notes from your materials</p>
            </div>
          </div>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Format Selector */}
        {sections.length > 1 && (
          <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">Display Format</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDisplayFormat('sections')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    displayFormat === 'sections' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Sections
                </button>
                <button
                  onClick={() => setDisplayFormat('table')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    displayFormat === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setDisplayFormat('cards')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    displayFormat === 'cards' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => {
                    setDisplayFormat('checklist');
                    if (Object.keys(checklistItems).length === 0) {
                      generateChecklistItems();
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    displayFormat === 'checklist' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Checklist
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {sections.length > 1 ? (
            displayFormat === 'table' ? renderAsTable() :
            displayFormat === 'cards' ? renderAsCards() :
            displayFormat === 'checklist' ? renderAsChecklist() :
            sections.map((section, index) => {
              const isExpanded = expandedSections.has(index);
              const sectionIsMain = isMainSection(section);
              const sectionTitle = extractSectionTitle(section);
              const sectionContent = getSectionContent(section);
              const previewSnippet = getPreviewSnippet(sectionContent);
              
              // Skip sections that are essentially empty after processing
              if (!sectionContent.trim() && !sectionTitle.trim()) {
                return null;
              }
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  {sectionIsMain ? (
                    <>
                      <button
                        onClick={() => toggleSection(index)}
                        className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-left transition-all duration-200 flex items-center justify-between group"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-800 text-lg group-hover:text-blue-700 transition-colors">
                            {sectionTitle}
                          </div>
                          {!isExpanded && sectionContent.trim() && (
                            <div className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                              {previewSnippet}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </span>
                          <span className="text-gray-500 text-lg transition-transform duration-200 group-hover:text-blue-600">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && sectionContent.trim() && (
                        <div className="p-6 bg-white border-t border-gray-200">
                          <div className="prose prose-sm max-w-none">
                            {renderFormattedText(sectionContent)}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-6 bg-white">
                      <div className="prose prose-sm max-w-none">
                        {renderFormattedText(section)}
                      </div>
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean) // Remove null sections
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 border border-gray-200">
              <div className="prose prose-lg max-w-none">
                {renderFormattedText(content)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Tip */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600 text-xl">💡</div>
            <div>
              <p className="text-blue-800 font-medium">Study Tip</p>
              <p className="text-blue-700 text-sm">
                Click on section headers to expand/collapse content for focused studying. 
                Use the regenerate button to create fresh content with different perspectives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
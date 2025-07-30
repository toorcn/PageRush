'use client';
import React, { useState } from 'react';

export default function StudyGuide({ content }) {
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Simple section detection (you can enhance this based on Gemini's output format)
  const sections = content.split(/\n(?=#|\*\*|^[A-Z][^a-z])/).filter(Boolean);

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  // Function to render markdown-like formatting
  const renderFormattedText = (text) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('#')) {
          const level = line.match(/^#+/)[0].length;
          const content = line.replace(/^#+\s*/, '');
          const Tag = `h${Math.min(level, 6)}`;
          return React.createElement(Tag, {
            key: index,
            className: `font-bold text-gray-800 ${level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'}`
          }, content);
        }
        
        // Handle bold text
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/);
          return (
            <div key={index} className="mb-2">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </div>
          );
        }
        
        // Handle lists
        if (line.match(/^[-*]\s/)) {
          return <li key={index} className="ml-4">{line.replace(/^[-*]\s/, '')}</li>;
        }
        
        // Handle numbered lists
        if (line.match(/^\d+\.\s/)) {
          return <li key={index} className="ml-4">{line.replace(/^\d+\.\s/, '')}</li>;
        }
        
        // Regular text
        return <p key={index} className="mb-2">{line}</p>;
      });
  };

  // Get preview snippet (first 200 characters)
  const getPreviewSnippet = (text) => {
    const cleanText = text.replace(/^[#*]+\s*/, '').trim();
    return cleanText.length > 200 ? cleanText.slice(0, 200) + '...' : cleanText;
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📚 Study Guide</h2>
        <p className="text-gray-600">Organized notes from your materials</p>
      </div>

      <div className="space-y-4">
        {sections.length > 1 ? (
          sections.map((section, index) => {
            const isExpanded = expandedSections.has(index);
            const isMainSection = section.startsWith('#') || section.startsWith('**');
            const previewSnippet = getPreviewSnippet(section);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                {isMainSection ? (
                  <>
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-lg flex items-center justify-between transition"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800">
                          {section.split('\n')[0].replace(/^[#*]+ /, '')}
                        </div>
                        {!isExpanded && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {previewSnippet}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-500 ml-4">{isExpanded ? '▼' : '▶'}</span>
                    </button>
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="prose prose-sm max-w-none">
                          {renderFormattedText(section.split('\n').slice(1).join('\n'))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-white">
                    <div className="prose prose-sm max-w-none">
                      {renderFormattedText(section)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="prose prose-sm max-w-none">
              {renderFormattedText(content)}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <p className="text-blue-800 text-sm">
          💡 <strong>Tip:</strong> Click on section headers to expand/collapse content for focused studying
        </p>
      </div>
    </div>
  );
} 
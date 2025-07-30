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
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                {isMainSection ? (
                  <>
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-lg flex items-center justify-between transition"
                      aria-expanded={isExpanded}
                    >
                      <span>{section.split('\n')[0].replace(/^[#*]+ /, '')}</span>
                      <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                    </button>
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        <div className="prose prose-sm max-w-none">
                          {section.split('\n').slice(1).join('\n')}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-white">
                    <div className="prose prose-sm max-w-none whitespace-pre-line">
                      {section}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {content}
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
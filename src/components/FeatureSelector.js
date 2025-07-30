'use client';
import React from 'react';

const features = [
  {
    key: 'examCram',
    label: 'Exam Cram',
    icon: '🚀',
    description: 'Smart topic breakdown & adaptive learning',
    color: 'red',
    gradient: 'from-red-500 to-red-600'
  },
  {
    key: 'studyGuide',
    label: 'Study Guide',
    icon: '📚',
    description: 'Get organized notes and summaries',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    icon: '🃏',
    description: 'Create interactive study cards',
    color: 'green',
    gradient: 'from-green-500 to-green-600'
  },
  {
    key: 'quiz',
    label: 'Quiz',
    icon: '❓',
    description: 'Test your knowledge with MCQs',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    key: 'exam',
    label: 'Exam',
    icon: '📝',
    description: 'Full practice exam with mixed questions',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600'
  },
];

export default function FeatureSelector({ selected, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map(f => (
          <button
            key={f.key}
            onClick={() => onSelect(f.key)}
            className={`
              group relative p-4 rounded-lg border-2 transition-all duration-300 text-left
              ${selected === f.key 
                ? 'border-gray-300 bg-white shadow-lg shadow-gray-200/50 scale-105' 
                : 'border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md hover:scale-102'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-pressed={selected === f.key}
          >
            <div className="flex items-start space-x-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-xl
                ${selected === f.key 
                  ? `bg-gradient-to-r ${f.gradient} text-white shadow-lg` 
                  : 'bg-white text-gray-600 group-hover:bg-gray-100'
                }
                transition-all duration-300
              `}>
                {f.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-base mb-1 transition-colors duration-300 ${
                  selected === f.key ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {f.label}
                </h3>
                <p className={`text-xs transition-colors duration-300 ${
                  selected === f.key ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {f.description}
                </p>
              </div>
              {selected === f.key && (
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hover effect */}
            {!selected && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300 -z-10"></div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-gray-700 text-sm font-medium">
            Ready to generate your <span className="font-bold text-blue-700">{features.find(f => f.key === selected)?.label}</span>!
          </p>
        </div>
      )}
    </div>
  );
} 
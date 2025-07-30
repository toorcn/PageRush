'use client';
import React from 'react';

const features = [
  {
    key: 'studyGuide',
    label: 'Study Guide',
    icon: '📚',
    description: 'Get organized notes and summaries',
    color: 'blue'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    icon: '🃏',
    description: 'Create interactive study cards',
    color: 'green'
  },
  {
    key: 'quiz',
    label: 'Quiz',
    icon: '❓',
    description: 'Test your knowledge with MCQs',
    color: 'purple'
  },
  {
    key: 'exam',
    label: 'Exam',
    icon: '📝',
    description: 'Full practice exam with mixed questions',
    color: 'orange'
  },
];

const colorClasses = {
  blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800',
  green: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-800',
  purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800',
  orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800',
};

const selectedColorClasses = {
  blue: 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg',
  green: 'border-green-500 bg-green-100 text-green-900 shadow-lg',
  purple: 'border-purple-500 bg-purple-100 text-purple-900 shadow-lg',
  orange: 'border-orange-500 bg-orange-100 text-orange-900 shadow-lg',
};

export default function FeatureSelector({ selected, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Choose Your Study Tool</h2>
        <p className="text-gray-600">Select how you'd like to study your materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map(f => (
          <button
            key={f.key}
            onClick={() => onSelect(f.key)}
            className={`
              p-6 rounded-xl border-2 transition-all duration-200 text-left
              ${selected === f.key ? selectedColorClasses[f.color] : colorClasses[f.color]}
              hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
            aria-pressed={selected === f.key}
          >
            <div className="flex items-start space-x-4">
              <span className="text-3xl">{f.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{f.label}</h3>
                <p className="text-sm opacity-80">{f.description}</p>
              </div>
              {selected === f.key && (
                <span className="text-2xl">✅</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-600">
            Ready to generate your <span className="font-semibold">{features.find(f => f.key === selected)?.label}</span>!
          </p>
        </div>
      )}
    </div>
  );
} 
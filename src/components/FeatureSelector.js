'use client';
import { Rocket, BookOpen, Layers, HelpCircle, ClipboardList, Check } from 'lucide-react';

const features = [
  {
    key: 'examCram',
    label: 'Exam Cram',
    Icon: Rocket,
    description: 'Smart topic breakdown & adaptive learning',
    color: 'red',
    gradient: 'from-rose-500 to-rose-600'
  },
  {
    key: 'studyGuide',
    label: 'Study Guide',
    Icon: BookOpen,
    description: 'Get organized notes and summaries',
    color: 'blue',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    Icon: Layers,
    description: 'Create interactive study cards',
    color: 'green',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    key: 'quiz',
    label: 'Quiz',
    Icon: HelpCircle,
    description: 'Test your knowledge with MCQs',
    color: 'purple',
    gradient: 'from-violet-500 to-violet-600'
  },
  {
    key: 'exam',
    label: 'Exam',
    Icon: ClipboardList,
    description: 'Full practice exam with mixed questions',
    color: 'orange',
    gradient: 'from-amber-500 to-amber-600'
  },
];

export default function FeatureSelector({ selected, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
        {features.map(f => {
          const IconComponent = f.Icon;
          return (
            <button
              key={f.key}
              onClick={() => onSelect(f.key)}
              className={`
                group relative p-4 lg:p-5 rounded-xl border-2 transition-all duration-200 text-left
                min-h-[80px] lg:min-h-[100px] flex items-center
                ${selected === f.key 
                  ? 'border-indigo-300 bg-white shadow-lg shadow-indigo-100/50 scale-[1.02]' 
                  : 'border-gray-200 bg-white/60 hover:bg-white hover:shadow-md hover:border-gray-300 hover:scale-[1.01]'
                }
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                active:scale-[0.98]
              `}
              aria-pressed={selected === f.key}
              disabled={selected === f.key}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`
                  w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center flex-shrink-0
                  ${selected === f.key 
                    ? `bg-gradient-to-br ${f.gradient} text-white shadow-lg` 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }
                  transition-all duration-200
                `}>
                  <IconComponent className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-base lg:text-lg mb-0.5 transition-colors duration-200 ${
                    selected === f.key ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {f.label}
                  </h3>
                  <p className={`text-xs lg:text-sm transition-colors duration-200 ${
                    selected === f.key ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {f.description}
                  </p>
                </div>
                {selected === f.key && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 lg:p-4 text-center">
          <p className="text-gray-700 text-sm lg:text-base font-medium">
            Ready to generate your <span className="font-semibold text-indigo-600">{features.find(f => f.key === selected)?.label}</span>
          </p>
        </div>
      )}
    </div>
  );
} 
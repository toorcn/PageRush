'use client';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}

export default function ProgressIndicator({ currentStep, totalSteps = 4, labels = [] }: ProgressIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const label = labels[index] || `Step ${index + 1}`;
          
          return (
            <div key={step} className="flex flex-col items-center flex-1 relative">
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${
                    status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : status === 'current'
                      ? 'bg-indigo-600 text-white shadow-md animate-pulse-slow'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <p
                  className={`
                    text-xs font-medium transition-colors duration-300
                    ${
                      status === 'completed'
                        ? 'text-emerald-600'
                        : status === 'current'
                        ? 'text-indigo-600 font-semibold'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

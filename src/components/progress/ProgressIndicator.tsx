'use client';

import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  readonly currentStep: number;
  readonly totalSteps?: number;
  readonly labels?: readonly string[];
}

type StepStatus = 'completed' | 'current' | 'upcoming';

function getStepStatus(stepIndex: number, currentStep: number): StepStatus {
  if (stepIndex < currentStep) return 'completed';
  if (stepIndex === currentStep) return 'current';
  return 'upcoming';
}

function getStepStyles(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-110';
    case 'current':
      return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-110 animate-pulse';
    default:
      return 'bg-gray-200 text-gray-500';
  }
}

function getLabelStyles(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'current':
      return 'text-blue-600 font-semibold';
    default:
      return 'text-gray-500';
  }
}

export function ProgressIndicator({
  currentStep,
  totalSteps = 4,
  labels = [],
}: ProgressIndicatorProps) {
  const progressWidth = totalSteps > 1 
    ? (currentStep / (totalSteps - 1)) * 100 
    : 0;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* Steps */}
        {Array.from({ length: totalSteps }).map((_, index) => {
          const status = getStepStatus(index, currentStep);
          const label = labels[index] || `Step ${index + 1}`;

          return (
            <div key={`step-${index}-${label}`} className="flex flex-col items-center flex-1 relative">
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300 ${getStepStyles(status)}
                `}
              >
                {status === 'completed' ? <Check className="w-4 h-4" /> : index + 1}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium transition-colors duration-300 ${getLabelStyles(status)}`}>
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

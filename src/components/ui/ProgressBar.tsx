'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  default: 'from-blue-500 to-indigo-600',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-yellow-500 to-orange-600',
  danger: 'from-red-500 to-rose-600',
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${sizeStyles[size]} overflow-hidden`}>
        <div
          className={`${sizeStyles[size]} bg-gradient-to-r ${variantStyles[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-500 text-center mt-1">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

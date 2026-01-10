'use client';
import { X, FileText } from 'lucide-react';

interface DocumentChipProps {
  name: string;
  isActive?: boolean;
  isPrimary?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}

export default function DocumentChip({
  name,
  isActive = true,
  isPrimary = false,
  onRemove,
  onClick,
  disabled = false,
}: DocumentChipProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 max-w-[180px] group
        ${isActive
          ? isPrimary
            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200'
        }
        ${onClick && !disabled ? 'cursor-pointer hover:shadow-sm' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{name}</span>
      {isPrimary && (
        <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 rounded text-xs flex-shrink-0">
          Primary
        </span>
      )}
      {onRemove && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          aria-label={`Remove ${name}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

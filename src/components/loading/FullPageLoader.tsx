'use client';

import { useStudyStore } from '@/stores';

interface FullPageLoaderProps {
  text?: string;
  showLogo?: boolean;
}

export function FullPageLoader({ text, showLogo = true }: FullPageLoaderProps) {
  const loading = useStudyStore((s) => s.loading);
  const storeText = useStudyStore((s) => s.loadingText);
  const displayText = text || storeText;

  if (!loading && !text) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center">
        {showLogo && (
          <img
            src="/pagerushai-logo.png"
            alt="PageRush AI"
            className="h-16 w-auto mx-auto mb-6 animate-pulse"
          />
        )}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-gray-600 font-medium">{displayText}</p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMetricsStore } from '@/stores';
import ApiMetricsPanel from '@/components/ApiMetricsPanel';

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatCost = (cost: number) => {
  if (cost < 0.0001) return '< $0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(4)}`;
};

const formatTime = (ms: number) => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
};

export function Footer() {
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const { sessionMetrics, metrics } = useMetricsStore();

  const avgResponseTime = sessionMetrics.totalCalls > 0 
    ? Math.round(sessionMetrics.totalResponseTime / sessionMetrics.totalCalls) 
    : 0;

  return (
    <>
      <footer className="mt-12 lg:mt-16 pt-8 border-t border-gray-200">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <img
              src="/pagerushai-logo.png"
              alt="PageRush AI"
              className="h-8 w-auto"
            />
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Transform your study materials into interactive learning tools
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Powered by AI • Built for Students • By Students (
            <a
              href="https://linkedin.com/in/hong-bing"
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hong
            </a>
            )
          </p>
          
          {/* Technical Stats Footer */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
              {sessionMetrics.totalCalls > 0 ? (
                <>
                  <span>{sessionMetrics.totalCalls} API calls</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatNumber(sessionMetrics.totalTokens)} tokens</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatCost(sessionMetrics.totalCost)} est.</span>
                  <span className="text-gray-300">•</span>
                  <span>~{formatTime(avgResponseTime)} avg</span>
                  <span className="text-gray-300">•</span>
                </>
              ) : (
                <>
                  <span>No API calls yet</span>
                  <span className="text-gray-300">•</span>
                </>
              )}
              <button
                onClick={() => setShowMetricsPanel(true)}
                className="text-gray-400 hover:text-blue-500 transition-colors underline decoration-dotted underline-offset-2"
              >
                dev console
              </button>
            </div>
            {metrics.length > 0 && (
              <div className="mt-2 text-xs text-gray-300">
                Last: {metrics[metrics.length - 1]?.promptType} ({formatNumber(metrics[metrics.length - 1]?.totalTokens || 0)} tok, {formatTime(metrics[metrics.length - 1]?.responseTimeMs || 0)})
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Secret Metrics Panel */}
      <ApiMetricsPanel 
        isOpen={showMetricsPanel} 
        onClose={() => setShowMetricsPanel(false)} 
      />
    </>
  );
}

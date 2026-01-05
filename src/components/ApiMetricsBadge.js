'use client';
import { useMetricsStore } from '@/stores/metricsStore';
import { BarChart2, ArrowUp, ArrowDown, Clock, DollarSign } from 'lucide-react';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatCost = (cost) => {
  if (cost < 0.0001) return '< $0.0001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(4)}`;
};

const formatTime = (ms) => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
};

/**
 * A small inline badge showing the last API call metrics
 * Can be placed anywhere to show quick stats
 */
export default function ApiMetricsBadge({ showDetails = false }) {
  const { lastMetric, sessionMetrics } = useMetricsStore();

  if (!lastMetric && sessionMetrics.totalCalls === 0) {
    return null;
  }

  if (!showDetails) {
    return (
      <div className="inline-flex items-center space-x-2 text-xs bg-gray-100 rounded-full px-3 py-1">
        <BarChart2 className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-gray-600">{formatNumber(sessionMetrics.totalTokens)} tokens</span>
        <span className="text-gray-400">•</span>
        <span className="text-green-600">{formatCost(sessionMetrics.totalCost)}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-3 text-xs bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-3 py-2 border border-gray-200">
      <div className="flex items-center space-x-1">
        <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-gray-600">{formatNumber(lastMetric?.promptTokens || 0)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <ArrowDown className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-gray-600">{formatNumber(lastMetric?.completionTokens || 0)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Clock className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-gray-600">{formatTime(lastMetric?.responseTimeMs || 0)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <DollarSign className="w-3.5 h-3.5 text-green-500" />
        <span className="text-gray-600">{formatCost(lastMetric?.estimatedCost || 0)}</span>
      </div>
    </div>
  );
}

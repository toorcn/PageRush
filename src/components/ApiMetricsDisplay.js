'use client';
import { useState } from 'react';
import { useMetricsStore } from '@/stores/metricsStore';
import { Hash, DollarSign, BarChart2, ChevronDown } from 'lucide-react';

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
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
};

export default function ApiMetricsDisplay({ compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const { lastMetric, sessionMetrics, metrics, clearSessionMetrics } = useMetricsStore();

  if (!lastMetric && sessionMetrics.totalCalls === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <div className="flex items-center space-x-1">
          <Hash className="w-3.5 h-3.5" />
          <span>{formatNumber(sessionMetrics.totalTokens)} tokens</span>
        </div>
        <div className="flex items-center space-x-1">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{formatCost(sessionMetrics.totalCost)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>{sessionMetrics.totalCalls} calls</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-800">API Metrics</span>
          {lastMetric && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
              Last: {formatNumber(lastMetric.totalTokens)} tokens
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Session Summary - Always visible */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">{sessionMetrics.totalCalls}</div>
            <div className="text-xs text-gray-600">API Calls</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-700">{formatNumber(sessionMetrics.totalTokens)}</div>
            <div className="text-xs text-gray-600">Total Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">{formatCost(sessionMetrics.totalCost)}</div>
            <div className="text-xs text-gray-600">Est. Cost</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-700">{formatTime(sessionMetrics.totalResponseTime)}</div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200">
          {/* Last Call Details */}
          {lastMetric && (
            <div className="px-4 py-3 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Last API Call</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Endpoint:</span>
                  <span className="font-medium text-gray-700">{lastMetric.promptType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Model:</span>
                  <span className="font-medium text-gray-700">{lastMetric.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Input Tokens:</span>
                  <span className="font-medium text-blue-600">{formatNumber(lastMetric.promptTokens)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Output Tokens:</span>
                  <span className="font-medium text-purple-600">{formatNumber(lastMetric.completionTokens)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Response Time:</span>
                  <span className="font-medium text-orange-600">{formatTime(lastMetric.responseTimeMs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost:</span>
                  <span className="font-medium text-green-600">{formatCost(lastMetric.estimatedCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Calls History */}
          {metrics.length > 1 && (
            <div className="px-4 py-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Calls</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.slice(-5).reverse().map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-medium text-gray-700">{metric.promptType}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600">{formatNumber(metric.totalTokens)} tok</span>
                      <span className="text-green-600">{formatCost(metric.estimatedCost)}</span>
                      <span className="text-orange-600">{formatTime(metric.responseTimeMs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={clearSessionMetrics}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Reset Session Metrics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

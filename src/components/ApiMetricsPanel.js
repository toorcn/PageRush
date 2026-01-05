'use client';
import { useState } from 'react';
import { useMetricsStore } from '@/stores/metricsStore';
import { Settings, X, ClipboardList, BarChart2, Info, Inbox, Lightbulb } from 'lucide-react';

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
  return `${Math.round(ms)}ms`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function ApiMetricsPanel({ isOpen, onClose }) {
  const { metrics, sessionMetrics, clearMetrics, clearSessionMetrics } = useMetricsStore();
  const [activeTab, setActiveTab] = useState('logs');

  if (!isOpen) return null;

  const avgResponseTime = sessionMetrics.totalCalls > 0 
    ? Math.round(sessionMetrics.totalResponseTime / sessionMetrics.totalCalls) 
    : 0;

  const avgTokensPerCall = sessionMetrics.totalCalls > 0
    ? Math.round(sessionMetrics.totalTokens / sessionMetrics.totalCalls)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-800">Developer Console</h2>
              <p className="text-xs text-gray-500">API metrics, logs, and session statistics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'logs', label: 'API Logs', icon: ClipboardList },
            { id: 'stats', label: 'Statistics', icon: BarChart2 },
            { id: 'info', label: 'System Info', icon: Info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Recent API Calls</h3>
                <button
                  onClick={clearMetrics}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              
              {metrics.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Inbox className="w-10 h-10 mx-auto mb-4" />
                  <p>No API calls recorded yet</p>
                  <p className="text-xs mt-1">Generate some content to see logs here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...metrics].reverse().map((metric, index) => (
                    <div
                      key={metric.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {metric.promptType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(metric.timestamp)}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-400">#{metrics.length - index}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Input</span>
                          <span className="font-medium text-blue-600">{formatNumber(metric.promptTokens)} tokens</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Output</span>
                          <span className="font-medium text-purple-600">{formatNumber(metric.completionTokens)} tokens</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Latency</span>
                          <span className="font-medium text-orange-600">{formatTime(metric.responseTimeMs)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Cost</span>
                          <span className="font-medium text-green-600">{formatCost(metric.estimatedCost)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                        Model: <span className="font-mono">{metric.model}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{sessionMetrics.totalCalls}</div>
                  <div className="text-xs text-blue-600">Total API Calls</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">{formatNumber(sessionMetrics.totalTokens)}</div>
                  <div className="text-xs text-purple-600">Total Tokens</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{formatCost(sessionMetrics.totalCost)}</div>
                  <div className="text-xs text-green-600">Estimated Cost</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{formatTime(sessionMetrics.totalResponseTime)}</div>
                  <div className="text-xs text-orange-600">Total API Time</div>
                </div>
              </div>

              {/* Averages */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Averages per Call</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-700">{formatNumber(avgTokensPerCall)}</div>
                    <div className="text-xs text-gray-500">Tokens/Call</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-700">{formatTime(avgResponseTime)}</div>
                    <div className="text-xs text-gray-500">Avg Latency</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-700">
                      {sessionMetrics.totalCalls > 0 ? formatCost(sessionMetrics.totalCost / sessionMetrics.totalCalls) : '$0'}
                    </div>
                    <div className="text-xs text-gray-500">Cost/Call</div>
                  </div>
                </div>
              </div>

              {/* Token Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Token Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Input Tokens</span>
                    <span className="font-medium text-blue-600">{formatNumber(sessionMetrics.totalPromptTokens)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${sessionMetrics.totalTokens > 0 ? (sessionMetrics.totalPromptTokens / sessionMetrics.totalTokens) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Output Tokens</span>
                    <span className="font-medium text-purple-600">{formatNumber(sessionMetrics.totalCompletionTokens)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${sessionMetrics.totalTokens > 0 ? (sessionMetrics.totalCompletionTokens / sessionMetrics.totalTokens) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={clearSessionMetrics}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Reset All Statistics
                </button>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">API Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model</span>
                    <span className="font-mono text-gray-700">gemini-3-flash-preview</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">API Endpoint</span>
                    <span className="font-mono text-gray-700 text-xs">generativelanguage.googleapis.com</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pricing (per 1M tokens)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Input Tokens</span>
                    <span className="text-gray-700">$0.075</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Output Tokens</span>
                    <span className="text-gray-700">$0.30</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Session Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Logs Stored</span>
                    <span className="text-gray-700">{metrics.length} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage</span>
                    <span className="text-gray-700">localStorage (persisted)</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Tips
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Metrics are stored locally and persist across sessions</li>
                  <li>• Cost estimates are based on published Gemini API pricing</li>
                  <li>• Only the last 100 API calls are stored in logs</li>
                  <li>• Response time includes network latency</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

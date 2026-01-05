'use client';
import { useState, useEffect } from 'react';
import { useMetricsStore } from '@/stores/metricsStore';
import { MODEL_PRICING, DEFAULT_MODEL, ACTION_MODELS } from '@/lib/api/gemini';

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

const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
};

const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Calculate cost for given tokens using a specific model's pricing
const calculateModelCost = (inputTokens, outputTokens, pricing) => {
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
};

export default function ApiMetricsPanel({ isOpen, onClose }) {
  const { metrics, sessionMetrics, clearMetrics, clearSessionMetrics } = useMetricsStore();
  const [activeTab, setActiveTab] = useState('logs');
  const [sessionStart] = useState(() => Date.now());
  const [uptime, setUptime] = useState(0);
  const [storageSize, setStorageSize] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Date.now() - sessionStart);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  useEffect(() => {
    try {
      const metricsData = localStorage.getItem('pagerush-metrics');
      setStorageSize(metricsData ? new Blob([metricsData]).size : 0);
    } catch {
      setStorageSize(0);
    }
  }, [metrics]);

  if (!isOpen) return null;

  const avgResponseTime = sessionMetrics.totalCalls > 0 
    ? Math.round(sessionMetrics.totalResponseTime / sessionMetrics.totalCalls) : 0;
  const avgTokensPerCall = sessionMetrics.totalCalls > 0
    ? Math.round(sessionMetrics.totalTokens / sessionMetrics.totalCalls) : 0;
  const tokensPerSecond = sessionMetrics.totalResponseTime > 0
    ? Math.round((sessionMetrics.totalCompletionTokens / sessionMetrics.totalResponseTime) * 1000) : 0;
  const ioRatio = sessionMetrics.totalPromptTokens > 0
    ? (sessionMetrics.totalCompletionTokens / sessionMetrics.totalPromptTokens).toFixed(2) : 0;
  const tokensPerDollar = sessionMetrics.totalCost > 0
    ? Math.round(sessionMetrics.totalTokens / sessionMetrics.totalCost) : 0;
  const callsPerMinute = uptime > 60000
    ? ((sessionMetrics.totalCalls / uptime) * 60000).toFixed(1) : sessionMetrics.totalCalls;

  const sortedBySpeed = [...metrics].sort((a, b) => a.responseTimeMs - b.responseTimeMs);
  const fastestCall = sortedBySpeed[0];
  const slowestCall = sortedBySpeed[sortedBySpeed.length - 1];
  const mostExpensiveCall = [...metrics].sort((a, b) => b.estimatedCost - a.estimatedCost)[0];

  const callsByType = metrics.reduce((acc, m) => {
    acc[m.promptType] = (acc[m.promptType] || 0) + 1;
    return acc;
  }, {});

  const sessionHours = uptime / (1000 * 60 * 60);
  const hourlyRate = sessionHours > 0 ? sessionMetrics.totalCost / sessionHours : 0;

  // Calculate costs for all models
  const modelCosts = Object.entries(MODEL_PRICING).map(([model, pricing]) => ({
    model,
    sessionCost: calculateModelCost(sessionMetrics.totalPromptTokens, sessionMetrics.totalCompletionTokens, pricing),
    hourlyCost: sessionHours > 0 ? calculateModelCost(sessionMetrics.totalPromptTokens, sessionMetrics.totalCompletionTokens, pricing) / sessionHours : 0,
  }));

  const currentModelCost = sessionMetrics.totalCost;

  const tabs = [
    { id: 'logs', label: 'Logs' },
    { id: 'stats', label: 'Stats' },
    { id: 'perf', label: 'Perf' },
    { id: 'info', label: 'System' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-gray-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col font-mono">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
          <div className="flex items-center space-x-3">
            <span className="text-green-400 text-lg">&gt;</span>
            <div>
              <h2 className="text-sm font-bold text-green-400">DEVELOPER CONSOLE</h2>
              <p className="text-xs text-gray-500">uptime: {formatUptime(uptime)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-500"><span className="text-green-400">*</span> LIVE</div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white">x</button>
          </div>
        </div>

        <div className="flex border-b border-gray-700 px-4 bg-gray-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-green-400 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-sm">
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{metrics.length} entries</span>
                <button onClick={clearMetrics} className="text-red-400 hover:text-red-300">[clear]</button>
              </div>
              {metrics.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg mb-2">--</p>
                  <p>No API calls recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...metrics].reverse().map((metric, index) => (
                    <div key={metric.id} className="bg-gray-800 rounded p-3 border border-gray-700 hover:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">[{formatDate(metric.timestamp)}]</span>
                          <span className="text-yellow-400">{metric.promptType}</span>
                        </div>
                        <span className="text-gray-600">#{metrics.length - index}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><span className="text-gray-500">IN:</span> <span className="text-blue-400">{formatNumber(metric.promptTokens)}</span></div>
                        <div><span className="text-gray-500">OUT:</span> <span className="text-purple-400">{formatNumber(metric.completionTokens)}</span></div>
                        <div><span className="text-gray-500">TIME:</span> <span className="text-orange-400">{formatTime(metric.responseTimeMs)}</span></div>
                        <div><span className="text-gray-500">COST:</span> <span className="text-green-400">${formatCost(metric.estimatedCost)}</span></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        model: {metric.model} | tok/s: {Math.round((metric.completionTokens / metric.responseTimeMs) * 1000)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">{sessionMetrics.totalCalls}</div>
                  <div className="text-xs text-gray-500">API Calls</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400">{formatNumber(sessionMetrics.totalTokens)}</div>
                  <div className="text-xs text-gray-500">Total Tokens</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">${formatCost(sessionMetrics.totalCost)}</div>
                  <div className="text-xs text-gray-500">Est. Cost</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-2xl font-bold text-orange-400">{formatTime(sessionMetrics.totalResponseTime)}</div>
                  <div className="text-xs text-gray-500">Total Latency</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">TOKEN BREAKDOWN</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400">INPUT</span>
                    <span>{formatNumber(sessionMetrics.totalPromptTokens)} ({sessionMetrics.totalTokens > 0 ? Math.round((sessionMetrics.totalPromptTokens / sessionMetrics.totalTokens) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${sessionMetrics.totalTokens > 0 ? (sessionMetrics.totalPromptTokens / sessionMetrics.totalTokens) * 100 : 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-400">OUTPUT</span>
                    <span>{formatNumber(sessionMetrics.totalCompletionTokens)} ({sessionMetrics.totalTokens > 0 ? Math.round((sessionMetrics.totalCompletionTokens / sessionMetrics.totalTokens) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${sessionMetrics.totalTokens > 0 ? (sessionMetrics.totalCompletionTokens / sessionMetrics.totalTokens) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {Object.keys(callsByType).length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-xs text-gray-400 mb-3">CALLS BY TYPE</h4>
                  <div className="space-y-1">
                    {Object.entries(callsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="text-yellow-400">{type}</span>
                        <span className="text-gray-400">{count} ({Math.round((count / metrics.length) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={clearSessionMetrics} className="text-xs text-red-400 hover:text-red-300">[reset all stats]</button>
            </div>
          )}

          {activeTab === 'perf' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xl font-bold text-cyan-400">{tokensPerSecond}</div>
                  <div className="text-xs text-gray-500">Tokens/sec</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xl font-bold text-yellow-400">{ioRatio}x</div>
                  <div className="text-xs text-gray-500">Output/Input Ratio</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xl font-bold text-pink-400">{formatNumber(tokensPerDollar)}</div>
                  <div className="text-xs text-gray-500">Tokens/$1</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xl font-bold text-green-400">{formatTime(avgResponseTime)}</div>
                  <div className="text-xs text-gray-500">Avg Latency</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xl font-bold text-blue-400">{avgTokensPerCall}</div>
                  <div className="text-xs text-gray-500">Avg Tokens/Call</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xl font-bold text-orange-400">{callsPerMinute}</div>
                  <div className="text-xs text-gray-500">Calls/min</div>
                </div>
              </div>

              {metrics.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-xs text-gray-400 mb-3">SESSION RECORDS</h4>
                  <div className="space-y-3 text-xs">
                    {fastestCall && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Fastest</span>
                        <span><span className="text-green-400">{formatTime(fastestCall.responseTimeMs)}</span> <span className="text-gray-600">({fastestCall.promptType})</span></span>
                      </div>
                    )}
                    {slowestCall && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Slowest</span>
                        <span><span className="text-red-400">{formatTime(slowestCall.responseTimeMs)}</span> <span className="text-gray-600">({slowestCall.promptType})</span></span>
                      </div>
                    )}
                    {mostExpensiveCall && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Most Expensive</span>
                        <span><span className="text-yellow-400">${formatCost(mostExpensiveCall.estimatedCost)}</span> <span className="text-gray-600">({mostExpensiveCall.promptType})</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">COST PROJECTIONS (current rate)</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hourly</span>
                    <span className="text-green-400">${formatCost(hourlyRate)}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily</span>
                    <span className="text-green-400">${formatCost(hourlyRate * 24)}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly</span>
                    <span className="text-green-400">${formatCost(hourlyRate * 24 * 30)}/mo</span>
                  </div>
                </div>
              </div>

              {sessionMetrics.totalTokens > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-xs text-gray-400 mb-3">MODEL COST COMPARISON (same tokens)</h4>
                  <div className="space-y-2 text-xs">
                    {modelCosts.sort((a, b) => a.sessionCost - b.sessionCost).map(({ model, sessionCost }) => {
                      const diff = sessionCost - currentModelCost;
                      const diffPercent = currentModelCost > 0 ? ((diff / currentModelCost) * 100).toFixed(0) : 0;
                      const isCurrentModel = model === DEFAULT_MODEL;
                      return (
                        <div key={model} className={`flex justify-between items-center ${isCurrentModel ? 'text-cyan-400' : 'text-gray-400'}`}>
                          <span className="truncate max-w-[180px]">{model} {isCurrentModel && '(current)'}</span>
                          <div className="flex items-center space-x-2">
                            <span>${formatCost(sessionCost)}</span>
                            {!isCurrentModel && diff !== 0 && (
                              <span className={diff < 0 ? 'text-green-400' : 'text-red-400'}>
                                ({diff < 0 ? '' : '+'}{diffPercent}%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">* Based on {formatNumber(sessionMetrics.totalPromptTokens)} input + {formatNumber(sessionMetrics.totalCompletionTokens)} output tokens</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">SYSTEM STATUS</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Session Uptime</span>
                    <span className="text-green-400">{formatUptime(uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Log Buffer</span>
                    <span className="text-gray-300">{metrics.length}/100 entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage Used</span>
                    <span className="text-gray-300">{formatBytes(storageSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Persistence</span>
                    <span className="text-green-400">localStorage [ok]</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">API CONFIGURATION</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Default Model</span>
                    <span className="text-cyan-400">{DEFAULT_MODEL}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Endpoint</span>
                    <span className="text-gray-300 text-[10px]">generativelanguage.googleapis.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">API Version</span>
                    <span className="text-gray-300">v1beta</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">MODEL PRICING (per 1M tokens)</h4>
                <div className="space-y-2">
                  {Object.entries(MODEL_PRICING).map(([model, pricing]) => (
                    <div key={model} className="text-xs border-b border-gray-700 pb-2 last:border-0">
                      <div className="text-cyan-400 mb-1">{model}</div>
                      <div className="flex justify-between text-gray-500">
                        <span>Input: <span className="text-blue-400">${pricing.input}</span></span>
                        <span>Output: <span className="text-purple-400">${pricing.output}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">ACTION ROUTING</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {Object.entries(ACTION_MODELS).map(([action, model]) => (
                    <div key={action} className="flex justify-between text-gray-500">
                      <span className="text-yellow-400">{action}</span>
                      <span className="text-cyan-400">{model}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs text-gray-400 mb-3">ENVIRONMENT</h4>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Platform</span>
                    <span className="text-gray-400">{typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Language</span>
                    <span className="text-gray-400">{typeof navigator !== 'undefined' ? navigator.language : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network</span>
                    <span className={typeof navigator !== 'undefined' && navigator.onLine ? 'text-green-400' : 'text-red-400'}>
                      {typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timezone</span>
                    <span className="text-gray-400">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50 text-xs text-gray-600 flex justify-between">
          <span>PageRush AI Dev Console v1.0</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

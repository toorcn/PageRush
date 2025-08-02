'use client';
import React, { useState, useEffect } from 'react';
import { useNotification } from './NotificationProvider';

export default function Notification() {
  const { notifications, removeNotification } = useNotification();
  const [progress, setProgress] = useState({});

  // Handle progress bars for auto-dismiss notifications
  useEffect(() => {
    const intervals = {};
    
    notifications.forEach((notification) => {
      if (notification.autoDismiss) {
        const startTime = Date.now();
        const duration = 5000; // 5 seconds
        
        intervals[notification.id] = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progressPercent = Math.max(0, 100 - (elapsed / duration) * 100);
          
          setProgress(prev => ({
            ...prev,
            [notification.id]: progressPercent
          }));
          
          if (progressPercent <= 0) {
            clearInterval(intervals[notification.id]);
          }
        }, 50); // Update every 50ms for smooth animation
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [notifications]);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 lg:top-6 lg:right-6 lg:left-auto z-50 space-y-3 max-w-xs lg:max-w-sm w-full lg:w-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start bg-white shadow-lg rounded-lg border-l-4 p-4 lg:p-5 pr-6 lg:pr-8 relative transition-all duration-300
            ${n.type === 'success' ? 'border-green-500' : n.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-1 lg:mb-2 text-gray-800 flex items-center text-sm lg:text-base">
              {n.icon && <span className="mr-2 text-lg lg:text-xl flex-shrink-0">{n.icon}</span>}
              <span className="truncate">{n.title}</span>
            </div>
            <div className="text-gray-600 text-xs lg:text-sm mb-2 lg:mb-3 leading-relaxed">{n.message}</div>
            {n.action && (
              <button
                onClick={n.action.onClick}
                className="text-blue-600 hover:text-blue-800 text-xs lg:text-sm font-medium px-3 py-2 rounded-lg transition-colors bg-blue-50 hover:bg-blue-100"
              >
                {n.action.label}
              </button>
            )}
            {/* Progress bar for auto-dismiss */}
            {n.autoDismiss && progress[n.id] !== undefined && (
              <div className="mt-2 lg:mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1 lg:h-1.5">
                  <div 
                    className={`h-1 lg:h-1.5 rounded-full transition-all duration-50 ${
                      n.type === 'success' ? 'bg-green-500' : 
                      n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress[n.id]}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => removeNotification(n.id)}
            className="ml-3 text-gray-400 hover:text-gray-700 text-xl lg:text-2xl font-bold absolute top-2 lg:top-3 right-2 lg:right-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
} 
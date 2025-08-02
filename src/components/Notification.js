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
    <div className="fixed top-6 right-6 z-50 space-y-3 max-w-xs w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start bg-white shadow-lg rounded-lg border-l-4 p-4 pr-6 relative transition-all duration-300
            ${n.type === 'success' ? 'border-green-500' : n.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}
        >
          <div className="flex-1">
            <div className="font-semibold mb-1 text-gray-800 flex items-center">
              {n.icon && <span className="mr-2 text-xl">{n.icon}</span>}
              {n.title}
            </div>
            <div className="text-gray-600 text-sm mb-2">{n.message}</div>
            {n.action && (
              <button
                onClick={n.action.onClick}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded transition-colors"
              >
                {n.action.label}
              </button>
            )}
            {/* Progress bar for auto-dismiss */}
            {n.autoDismiss && progress[n.id] !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-50 ${
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
            className="ml-3 text-gray-400 hover:text-gray-700 text-lg font-bold absolute top-2 right-2"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
} 
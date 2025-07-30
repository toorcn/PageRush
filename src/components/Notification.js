'use client';
import React from 'react';
import { useNotification } from './NotificationProvider';

export default function Notification() {
  const { notifications, removeNotification } = useNotification();

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
'use client';

import { X } from 'lucide-react';
import { useNotificationStore } from '@/stores';
import type { Notification } from '@/types';

function NotificationItem({ notification }: { notification: Notification }) {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        animate-slideIn ${bgColors[notification.type]}
      `}
      role="alert"
    >
      {notification.icon && (
        <span className="text-xl flex-shrink-0">{notification.icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold ${textColors[notification.type]}`}>
          {notification.title}
        </h4>
        <p className={`text-sm mt-0.5 ${textColors[notification.type]} opacity-80`}>
          {notification.message}
        </p>
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className={`mt-2 text-sm font-medium underline ${textColors[notification.type]} hover:opacity-70`}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className={`flex-shrink-0 ${textColors[notification.type]} opacity-50 hover:opacity-100`}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function NotificationToast() {
  const notifications = useNotificationStore((state) => state.notifications);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

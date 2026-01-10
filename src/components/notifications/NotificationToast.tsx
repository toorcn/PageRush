'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNotificationStore } from '@/stores';
import type { Notification } from '@/types';

function NotificationItem({ notification }: { notification: Notification }) {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const styles = {
    success: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-green-500 border-gray-100',
      icon: 'text-green-500',
      title: 'text-gray-900',
      message: 'text-gray-600',
    },
    error: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-red-500 border-gray-100',
      icon: 'text-red-500',
      title: 'text-gray-900',
      message: 'text-gray-600',
    },
    info: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-blue-500 border-gray-100',
      icon: 'text-blue-500',
      title: 'text-gray-900',
      message: 'text-gray-600',
    },
  };

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[notification.type];

  const style = styles[notification.type];

  return (
    <div
      className={`
        flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border shadow-lg
        animate-toast-in backdrop-blur-sm
        ${style.bg} ${style.border}
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
        {notification.icon ? (
          <span className="text-base sm:text-lg">{notification.icon}</span>
        ) : (
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <h4 className={`font-semibold text-sm sm:text-base leading-tight ${style.title}`}>
          {notification.title}
        </h4>
        <p className={`text-xs sm:text-sm mt-0.5 leading-snug ${style.message}`}>
          {notification.message}
        </p>
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 
                       active:text-blue-800 transition-colors touch-manipulation"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="flex-shrink-0 p-1.5 -mr-1 -mt-1 rounded-lg text-gray-400 
                   hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200
                   transition-colors touch-manipulation"
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
      className="fixed top-3 left-3 right-3 sm:top-4 sm:left-auto sm:right-4 z-50 
                 flex flex-col gap-2 sm:max-w-sm sm:w-full"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

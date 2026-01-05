import { create } from 'zustand';
import { createElement } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { Notification, NotificationInput } from '@/types';

interface NotificationState {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: NotificationInput) => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification: NotificationInput) => {
    const newNotification: Notification = {
      id: Date.now(),
      ...notification,
      autoDismiss: notification.autoDismiss !== false,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-dismiss after 5 seconds if enabled
    if (newNotification.autoDismiss) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== newNotification.id),
        }));
      }, 5000);
    }
  },

  removeNotification: (id: number) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

// Convenience hooks for common notification patterns
export const useNotify = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);

  return {
    success: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ 
        type: 'success', 
        title, 
        message, 
        action, 
        icon: createElement(CheckCircle, { className: 'w-5 h-5 text-green-500' })
      });
    },
    error: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ 
        type: 'error', 
        title, 
        message, 
        action, 
        icon: createElement(XCircle, { className: 'w-5 h-5 text-red-500' }),
        autoDismiss: false 
      });
    },
    info: (title: string, message: string, action?: Notification['action']) => {
      addNotification({ 
        type: 'info', 
        title, 
        message, 
        action, 
        icon: createElement(Info, { className: 'w-5 h-5 text-blue-500' })
      });
    },
  };
};

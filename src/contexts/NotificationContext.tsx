import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import {
  getNotifications, addNotification as addNotifStorage,
  markNotificationRead as markReadStorage,
  markAllNotificationsRead as markAllReadStorage,
  getUnreadCount,
} from '@/lib/storage';

interface NotifContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const NotifContext = createContext<NotifContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  refresh: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    const notifs = getNotifications();
    setNotifications(notifs);
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const full: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    addNotifStorage(full);
    refresh();
  }, [refresh]);

  const markRead = useCallback((id: string) => {
    markReadStorage(id);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(() => {
    markAllReadStorage();
    refresh();
  }, [refresh]);

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, refresh }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotifications = () => useContext(NotifContext);

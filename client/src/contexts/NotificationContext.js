import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    desktop: true,
    sound: true,
    vibration: true,
    messagePreview: true,
    groupNotifications: true,
    doNotDisturb: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  const { socket } = useSocket();
  const { user } = useAuth();

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Check if in quiet hours
  const isQuietHours = useCallback(() => {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [settings.quietHours]);

  // Show desktop notification
  const showDesktopNotification = useCallback(async (notification) => {
    if (!('Notification' in window)) return;
    
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const options = {
      body: settings.messagePreview ? notification.body : 'New message',
      icon: notification.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.chatId || 'general',
      requireInteraction: false,
      silent: false,
      data: {
        chatId: notification.chatId,
        messageId: notification.messageId,
        url: notification.url
      }
    };

    const desktopNotification = new Notification(notification.title, options);
    
    desktopNotification.onclick = () => {
      window.focus();
      if (notification.onClick) {
        notification.onClick();
      } else if (options.data.url) {
        window.location.href = options.data.url;
      }
      desktopNotification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      desktopNotification.close();
    }, 5000);
  }, [settings.messagePreview, requestPermission]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback to system sound or ignore
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show desktop notification if enabled and not in quiet hours
    if (settings.desktop && !settings.doNotDisturb && !isQuietHours()) {
      showDesktopNotification(newNotification);
    }

    // Play sound if enabled
    if (settings.sound && !settings.doNotDisturb && !isQuietHours()) {
      playNotificationSound();
    }

    // Vibrate if enabled and supported
    if (settings.vibration && 'vibrate' in navigator && !settings.doNotDisturb) {
      navigator.vibrate([200, 100, 200]);
    }

    // Also show toast for immediate feedback
    switch (notification.type) {
      case 'success':
        toast.success(notification.message || notification.body);
        break;
      case 'error':
        toast.error(notification.message || notification.body);
        break;
      case 'warning':
        toast.warning(notification.message || notification.body);
        break;
      case 'info':
      default:
        toast.info(notification.message || notification.body);
        break;
    }

    return id;
  }, [settings, isQuietHours, showDesktopNotification, playNotificationSound]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify({
      ...settings,
      ...newSettings
    }));
  }, [settings]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (data) => {
      // Don't notify for own messages
      if (data.sender._id === user.id) return;

      addNotification({
        type: 'message',
        title: data.chat.type === 'group' 
          ? `${data.sender.username} in ${data.chat.name}`
          : data.sender.username,
        body: data.content,
        message: data.content,
        icon: data.sender.avatar,
        chatId: data.chat._id,
        messageId: data._id,
        url: `/chat/${data.chat._id}`,
        onClick: () => {
          // Navigate to chat
          window.location.href = `/chat/${data.chat._id}`;
        }
      });
    };

    const handleCallIncoming = (data) => {
      addNotification({
        type: 'call',
        title: 'Incoming Call',
        body: `${data.caller.username} is calling you`,
        message: `${data.caller.username} is calling you`,
        icon: data.caller.avatar,
        chatId: data.chatId,
        persistent: true
      });
    };

    const handleUserOnline = (data) => {
      if (settings.groupNotifications) {
        addNotification({
          type: 'status',
          title: 'User Online',
          body: `${data.username} is now online`,
          message: `${data.username} is now online`,
          icon: data.avatar,
          priority: 'low'
        });
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('callIncoming', handleCallIncoming);
    socket.on('userOnline', handleUserOnline);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('callIncoming', handleCallIncoming);
      socket.off('userOnline', handleUserOnline);
    };
  }, [socket, user, addNotification, settings.groupNotifications]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    if (settings.desktop) {
      requestPermission();
    }
  }, [settings.desktop, requestPermission]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    requestPermission,
    isQuietHours: isQuietHours()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
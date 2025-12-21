import React, { useState, useEffect } from 'react';
import { FiBell, FiPhone, FiMessageSquare, FiUsers, FiUserPlus, FiX } from 'react-icons/fi';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import './Notifications.css';

const NotificationsPage = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const { selectChat, chats } = useChat();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Mock notifications - in real app, fetch from API
      const mockNotifications = [
        {
          id: '1',
          type: 'message',
          title: 'New Message',
          body: 'John sent you a message',
          sender: { username: 'John', avatar: '/default-avatar.png' },
          read: false,
          createdAt: new Date(Date.now() - 5 * 60000)
        },
        {
          id: '2',
          type: 'call',
          title: 'Missed Call',
          body: 'You missed a call from Sarah',
          sender: { username: 'Sarah', avatar: '/default-avatar.png' },
          read: false,
          createdAt: new Date(Date.now() - 30 * 60000)
        },
        {
          id: '3',
          type: 'group_invite',
          title: 'Group Invitation',
          body: 'Mike added you to "Project Team"',
          sender: { username: 'Mike', avatar: '/default-avatar.png' },
          read: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60000)
        },
        {
          id: '4',
          type: 'mention',
          title: 'Mentioned You',
          body: 'Emma mentioned you in a message',
          sender: { username: 'Emma', avatar: '/default-avatar.png' },
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60000)
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    // In real app, call API to mark as read
    // await api.put(`/notifications/${notificationId}/read`);
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    // In real app, call API
    // await api.put('/notifications/read-all');
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
    
    // In real app, call API
    // await api.delete(`/notifications/${notificationId}`);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Handle different notification types
    if (notification.type === 'message' && notification.data?.chatId) {
      const chat = chats.find(c => c._id === notification.data.chatId);
      if (chat) {
        selectChat(chat);
        if (onClose) onClose();
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <FiMessageSquare />;
      case 'call':
        return <FiPhone />;
      case 'group_invite':
        return <FiUsers />;
      case 'mention':
        return <FiUserPlus />;
      default:
        return <FiBell />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="notifications-title">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        {onClose && (
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        )}
      </div>

      <div className="notifications-content">
        {/* Filter Tabs */}
        <div className="notifications-filters">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <div className="notifications-actions">
            <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="notifications-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <FiBell size={48} />
            <h3>No notifications</h3>
            <p>
              {filter === 'unread'
                ? "You're all caught up!"
                : filter === 'read'
                ? 'No read notifications'
                : 'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p>{notification.body}</p>
                  {notification.sender && (
                    <div className="notification-sender">
                      <img
                        src={notification.sender.avatar}
                        alt="Avatar"
                        className="avatar avatar-sm"
                      />
                      <span>{notification.sender.username}</span>
                    </div>
                  )}
                </div>

                <button
                  className="notification-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <FiX />
                </button>

                {!notification.read && (
                  <div className="notification-unread-dot"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  FiBell, FiX, FiCheck, FiTrash2, FiSettings, FiFilter,
  FiMessageSquare, FiPhone, FiUsers, FiShield, FiInfo
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotification();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, type

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <FiMessageSquare className="notification-type-icon message" />;
      case 'call':
        return <FiPhone className="notification-type-icon call" />;
      case 'group':
        return <FiUsers className="notification-type-icon group" />;
      case 'security':
        return <FiShield className="notification-type-icon security" />;
      case 'info':
        return <FiInfo className="notification-type-icon info" />;
      default:
        return <FiBell className="notification-type-icon default" />;
    }
  };

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'read') return notification.read;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle notification action based on type
    if (notification.action) {
      notification.action();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-header">
          <div className="header-title">
            <FiBell className="header-icon" />
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount}</span>
            )}
          </div>
          
          <div className="header-actions">
            <button 
              className="header-btn"
              onClick={() => {/* Open notification settings */}}
              title="Notification Settings"
            >
              <FiSettings />
            </button>
            <button className="header-btn close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="notification-controls">
          <div className="filter-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="control-select"
            >
              <option value="all">All ({notifications.length})</option>
              <option value="unread">Unread ({unreadCount})</option>
              <option value="read">Read ({notifications.length - unreadCount})</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="type">By Type</option>
            </select>
          </div>

          <div className="action-controls">
            {unreadCount > 0 && (
              <button 
                className="control-btn primary"
                onClick={markAllAsRead}
              >
                <FiCheck /> Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                className="control-btn danger"
                onClick={clearAll}
              >
                <FiTrash2 /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <FiBell className="empty-icon" />
              <h3>No notifications</h3>
              <p>
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'You have no notifications yet'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : 'read'} ${notification.type}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header-info">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.data && (
                    <div className="notification-data">
                      {notification.data.sender && (
                        <span className="notification-sender">
                          From: {notification.data.sender}
                        </span>
                      )}
                      {notification.data.preview && (
                        <span className="notification-preview">
                          "{notification.data.preview}"
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="notification-action-btn mark-read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Mark as read"
                    >
                      <FiCheck />
                    </button>
                  )}
                  
                  <button
                    className="notification-action-btn remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    title="Remove notification"
                  >
                    <FiX />
                  </button>
                </div>

                {!notification.read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notification-footer">
            <span className="footer-stats">
              {filteredNotifications.length} of {notifications.length} notifications
            </span>
            <button 
              className="footer-btn"
              onClick={() => {/* Open full notification history */}}
            >
              View All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
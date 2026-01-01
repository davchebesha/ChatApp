import React from 'react';
import './NotificationBadge.css';

const NotificationBadge = ({ 
  count = 0, 
  maxCount = 99, 
  showZero = false, 
  variant = 'primary',
  size = 'md',
  position = 'top-right',
  children,
  className = '',
  onClick,
  ...props 
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  const shouldShow = showZero || count > 0;

  if (!shouldShow && !children) {
    return null;
  }

  const badgeClasses = [
    'notification-badge',
    `notification-badge-${variant}`,
    `notification-badge-${size}`,
    `notification-badge-${position}`,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <div className="notification-badge-container" {...props}>
      {children}
      {shouldShow && (
        <span 
          className={badgeClasses}
          onClick={handleClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick(e);
            }
          } : undefined}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;
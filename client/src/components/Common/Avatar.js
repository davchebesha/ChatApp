import React from 'react';
import { getAvatarUrl, handleAvatarError, generatePlaceholderAvatar } from '../../utils/avatarUtils';

const Avatar = ({ 
  src, 
  alt = 'Avatar', 
  size = 'md', 
  username = '', 
  className = '',
  onClick,
  style = {}
}) => {
  const sizeClasses = {
    xs: 'avatar-xs',
    sm: 'avatar-sm', 
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  };

  const sizePixels = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  };

  const avatarSrc = src ? getAvatarUrl(src) : generatePlaceholderAvatar(username, sizePixels[size]);
  const avatarClass = `avatar ${sizeClasses[size]} ${className}`.trim();

  return (
    <img
      src={avatarSrc}
      alt={alt}
      className={avatarClass}
      onClick={onClick}
      style={style}
      onError={handleAvatarError}
    />
  );
};

export default Avatar;
/**
 * Avatar utility functions
 */

/**
 * Get avatar URL with fallback
 * @param {string} avatarUrl - Original avatar URL
 * @returns {string} - Avatar URL with fallback
 */
export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) {
    return '/default-avatar.svg';
  }
  
  // If it's already a fallback, return as is
  if (avatarUrl.includes('default-avatar')) {
    return '/default-avatar.svg';
  }
  
  return avatarUrl;
};

/**
 * Handle avatar image error by setting fallback
 * @param {Event} event - Image error event
 */
export const handleAvatarError = (event) => {
  event.target.src = '/default-avatar.svg';
  event.target.onerror = null; // Prevent infinite loop
};

/**
 * Generate a placeholder avatar based on username
 * @param {string} username - Username
 * @param {number} size - Avatar size (default: 40)
 * @returns {string} - Data URL for generated avatar
 */
export const generatePlaceholderAvatar = (username, size = 40) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const initial = username ? username.charAt(0).toUpperCase() : '?';
  const colorIndex = username ? username.charCodeAt(0) % colors.length : 0;
  const backgroundColor = colors[colorIndex];
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${backgroundColor}"/>
      <text x="${size/2}" y="${size/2 + 6}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/2.5}" font-weight="bold">${initial}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
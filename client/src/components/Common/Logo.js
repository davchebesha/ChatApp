import React from 'react';
import './Logo.css';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'logo-sm',
    md: 'logo-md',
    lg: 'logo-lg',
    xl: 'logo-xl'
  };

  return (
    <div className={`nexus-logo ${sizeClasses[size]} ${className}`}>
      <div className="logo-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Circle with Gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <dropShadow dx="2" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>
          
          {/* Main Circle Background */}
          <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" filter="url(#shadow)"/>
          
          {/* Letter "N" */}
          <path d="M16 20 L16 44 L20 44 L20 28 L28 44 L32 44 L32 20 L28 20 L28 36 L20 20 Z" 
                fill="white" 
                stroke="white" 
                strokeWidth="0.5"/>
          
          {/* Letter "C" */}
          <path d="M40 20 C44 20 48 24 48 32 C48 40 44 44 40 44 C38 44 36 43 35 41 L37 39 C37.5 40 38.5 41 40 41 C42 41 45 38 45 32 C45 26 42 23 40 23 C38.5 23 37.5 24 37 25 L35 23 C36 21 38 20 40 20 Z" 
                fill="white" 
                stroke="white" 
                strokeWidth="0.5"/>
          
          {/* Connection Line between N and C */}
          <line x1="32" y1="32" x2="35" y2="32" stroke="white" strokeWidth="2" opacity="0.6"/>
          
          {/* Small decorative dots */}
          <circle cx="32" cy="16" r="1.5" fill="white" opacity="0.8"/>
          <circle cx="32" cy="48" r="1.5" fill="white" opacity="0.8"/>
        </svg>
      </div>
      {showText && (
        <div className="logo-text">
          <span className="logo-brand">Nexus</span>
          <span className="logo-subtitle">ChatApp</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = {
  default: {
    name: 'Default',
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e1e5e9',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  },
  dark: {
    name: 'Dark',
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#404040',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  },
  blue: {
    name: 'Ocean Blue',
    primary: '#0066cc',
    secondary: '#004499',
    background: '#f0f8ff',
    surface: '#e6f3ff',
    text: '#1a1a1a',
    textSecondary: '#4d4d4d',
    border: '#b3d9ff',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  },
  green: {
    name: 'Forest Green',
    primary: '#28a745',
    secondary: '#1e7e34',
    background: '#f8fff8',
    surface: '#e8f5e8',
    text: '#1a1a1a',
    textSecondary: '#4d4d4d',
    border: '#c3e6c3',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  },
  purple: {
    name: 'Royal Purple',
    primary: '#6f42c1',
    secondary: '#5a2d91',
    background: '#faf9ff',
    surface: '#f0ebff',
    text: '#1a1a1a',
    textSecondary: '#4d4d4d',
    border: '#d1c4e9',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  }
};

const backgrounds = {
  none: {
    name: 'None',
    value: 'none'
  },
  gradient1: {
    name: 'Sunset Gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  gradient2: {
    name: 'Ocean Gradient',
    value: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)'
  },
  gradient3: {
    name: 'Forest Gradient',
    value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  pattern1: {
    name: 'Subtle Pattern',
    value: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23667eea" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentBackground, setCurrentBackground] = useState('none');

  useEffect(() => {
    const savedTheme = localStorage.getItem('nexus-theme');
    const savedBackground = localStorage.getItem('nexus-background');
    
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedBackground && backgrounds[savedBackground]) {
      setCurrentBackground(savedBackground);
    }
  }, []);

  useEffect(() => {
    const theme = themes[currentTheme];
    const background = backgrounds[currentBackground];
    
    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
    
    // Apply background
    if (background.value === 'none') {
      root.style.setProperty('--app-background', theme.background);
    } else {
      root.style.setProperty('--app-background', background.value);
    }
    
    // Save to localStorage
    localStorage.setItem('nexus-theme', currentTheme);
    localStorage.setItem('nexus-background', currentBackground);
  }, [currentTheme, currentBackground]);

  const changeTheme = (themeKey) => {
    if (themes[themeKey]) {
      setCurrentTheme(themeKey);
    }
  };

  const changeBackground = (backgroundKey) => {
    if (backgrounds[backgroundKey]) {
      setCurrentBackground(backgroundKey);
    }
  };

  const value = {
    currentTheme,
    currentBackground,
    theme: themes[currentTheme],
    background: backgrounds[currentBackground],
    themes,
    backgrounds,
    changeTheme,
    changeBackground
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
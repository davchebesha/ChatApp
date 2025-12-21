import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FiDroplet, FiImage } from 'react-icons/fi';
import './ThemeSettings.css';

const ThemeSettings = () => {
  const { 
    currentTheme, 
    currentBackground, 
    themes, 
    backgrounds, 
    changeTheme, 
    changeBackground 
  } = useTheme();

  return (
    <div className="theme-settings">
      <div className="settings-section">
        <div className="section-header">
          <FiDroplet className="section-icon" />
          <h3>Color Theme</h3>
        </div>
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <div
              key={key}
              className={`theme-option ${currentTheme === key ? 'active' : ''}`}
              onClick={() => changeTheme(key)}
            >
              <div className="theme-preview">
                <div 
                  className="color-swatch primary" 
                  style={{ backgroundColor: theme.primary }}
                />
                <div 
                  className="color-swatch secondary" 
                  style={{ backgroundColor: theme.secondary }}
                />
                <div 
                  className="color-swatch background" 
                  style={{ backgroundColor: theme.background }}
                />
              </div>
              <span className="theme-name">{theme.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <FiImage className="section-icon" />
          <h3>Background</h3>
        </div>
        <div className="background-grid">
          {Object.entries(backgrounds).map(([key, bg]) => (
            <div
              key={key}
              className={`background-option ${currentBackground === key ? 'active' : ''}`}
              onClick={() => changeBackground(key)}
            >
              <div 
                className="background-preview"
                style={{ 
                  background: bg.value === 'none' ? '#f0f0f0' : bg.value 
                }}
              >
                {bg.value === 'none' && <span className="no-bg-text">None</span>}
              </div>
              <span className="background-name">{bg.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
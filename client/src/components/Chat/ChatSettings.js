import React, { useState } from 'react';
import { FiX, FiImage } from 'react-icons/fi';
import './Chat.css';

const ChatSettings = ({ onClose }) => {
  const [background, setBackground] = useState(localStorage.getItem('chatBackground') || 'default');
  const [customBg, setCustomBg] = useState(localStorage.getItem('customChatBg') || '');

  const backgrounds = [
    { id: 'default', name: 'Default', color: '#f0f2f5' },
    { id: 'dark', name: 'Dark', color: '#1c1e21' },
    { id: 'blue', name: 'Blue', color: '#e7f3ff' },
    { id: 'green', name: 'Green', color: '#e8f5e9' },
    { id: 'purple', name: 'Purple', color: '#f3e5f5' },
    { id: 'pink', name: 'Pink', color: '#fce4ec' },
  ];

  const handleBackgroundChange = (bgId) => {
    setBackground(bgId);
    localStorage.setItem('chatBackground', bgId);
    
    const bg = backgrounds.find(b => b.id === bgId);
    if (bg) {
      document.documentElement.style.setProperty('--chat-bg-color', bg.color);
    }
  };

  const handleCustomBackground = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setCustomBg(imageUrl);
        localStorage.setItem('customChatBg', imageUrl);
        document.documentElement.style.setProperty('--chat-bg-image', `url(${imageUrl})`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chat-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chat Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <h3>Background Theme</h3>
          <div className="background-grid">
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                className={`background-option ${background === bg.id ? 'active' : ''}`}
                onClick={() => handleBackgroundChange(bg.id)}
                style={{ backgroundColor: bg.color }}
              >
                <span>{bg.name}</span>
                {background === bg.id && <div className="check-mark">✓</div>}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '24px' }}>Custom Background</h3>
          <div className="custom-bg-upload">
            <label htmlFor="bg-upload" className="upload-label">
              <FiImage />
              <span>Upload Image</span>
            </label>
            <input
              id="bg-upload"
              type="file"
              accept="image/*"
              onChange={handleCustomBackground}
              style={{ display: 'none' }}
            />
          </div>

          {customBg && (
            <div className="custom-bg-preview">
              <img src={customBg} alt="Custom background" />
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setCustomBg('');
                  localStorage.removeItem('customChatBg');
                  document.documentElement.style.removeProperty('--chat-bg-image');
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;

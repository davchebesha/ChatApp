import React, { useState, useEffect } from 'react';
import { FiX, FiImage, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { ImageCompressor } from '../../utils/imageCompression';
import BackgroundStorageManager from '../../utils/BackgroundStorageManager';
import './Chat.css';

const ChatSettings = ({ onClose }) => {
  const [background, setBackground] = useState(localStorage.getItem('chatBackground') || 'default');
  const [customBg, setCustomBg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [backgroundManager] = useState(() => new BackgroundStorageManager());

  // Load current custom background on component mount
  useEffect(() => {
    const loadCurrentBackground = async () => {
      try {
        const currentBg = await backgroundManager.getCurrentBackground();
        if (currentBg && currentBg.imageData) {
          setCustomBg(currentBg.imageData);
          document.documentElement.style.setProperty('--chat-bg-image', `url(${currentBg.imageData})`);
        }
      } catch (error) {
        console.error('Failed to load current background:', error);
      }
    };

    loadCurrentBackground();
  }, [backgroundManager]);

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

  const handleCustomBackground = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = ImageCompressor.validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    
    try {
      // Show loading toast for large files
      if (file.size > 1024 * 1024) { // 1MB
        toast.info('Compressing large image, please wait...');
      }

      // Compress the image
      const compressedImage = await ImageCompressor.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      });

      // Check final size
      const compressedSize = ImageCompressor.getBase64Size(compressedImage);
      console.log(`📸 Final compressed size: ${Math.round(compressedSize / 1024)}KB`);

      // Store using BackgroundStorageManager (IndexedDB)
      const backgroundId = await backgroundManager.storeBackground(compressedImage, {
        originalName: file.name,
        originalSize: file.size,
        compressedSize: compressedSize,
        uploadDate: new Date().toISOString()
      });

      // Update UI
      setCustomBg(compressedImage);
      document.documentElement.style.setProperty('--chat-bg-image', `url(${compressedImage})`);
      
      toast.success('Background updated successfully!');
      console.log(`✅ Background stored with ID: ${backgroundId}`);

    } catch (error) {
      console.error('Failed to process background image:', error);
      
      if (error.name === 'QuotaExceededError') {
        toast.error('Image too large for storage. Please try a smaller image or clear some browser data.');
      } else {
        toast.error('Failed to upload background. Please try again.');
      }
    } finally {
      setUploading(false);
      // Clear the input
      e.target.value = '';
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
            <label htmlFor="bg-upload" className={`upload-label ${uploading ? 'uploading' : ''}`}>
              {uploading ? <FiLoader className="spinning" /> : <FiImage />}
              <span>{uploading ? 'Processing...' : 'Upload Image'}</span>
            </label>
            <input
              id="bg-upload"
              type="file"
              accept="image/*"
              onChange={handleCustomBackground}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <small className="upload-hint">
              Supports JPEG, PNG, GIF, WebP. Max 10MB. Large images will be compressed automatically.
            </small>
          </div>

          {customBg && (
            <div className="custom-bg-preview">
              <img src={customBg} alt="Custom background" />
              <button 
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  try {
                    await backgroundManager.removeCurrentBackground();
                    setCustomBg('');
                    document.documentElement.style.removeProperty('--chat-bg-image');
                    toast.success('Background removed');
                  } catch (error) {
                    console.error('Failed to remove background:', error);
                    toast.error('Failed to remove background');
                  }
                }}
                disabled={uploading}
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

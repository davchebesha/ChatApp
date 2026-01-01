import React, { useState, useRef, useCallback } from 'react';
import { 
  FiUpload, FiX, FiFile, FiImage, FiVideo, FiMusic, 
  FiFileText, FiDownload, FiTrash2, FiSend, FiFolder
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './FileUploadModal.css';

const FileUploadModal = ({ isVisible, onSendFiles, onCancel, fileType = 'all' }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const fileTypeConfig = {
    image: {
      accept: 'image/*',
      maxSize: 10 * 1024 * 1024, // 10MB
      icon: FiImage,
      title: 'Upload Images',
      description: 'Select images to share (JPG, PNG, GIF, WebP)'
    },
    video: {
      accept: 'video/*',
      maxSize: 100 * 1024 * 1024, // 100MB
      icon: FiVideo,
      title: 'Upload Videos',
      description: 'Select videos to share (MP4, WebM, AVI, MOV)'
    },
    audio: {
      accept: 'audio/*',
      maxSize: 50 * 1024 * 1024, // 50MB
      icon: FiMusic,
      title: 'Upload Audio',
      description: 'Select audio files to share (MP3, WAV, OGG, M4A)'
    },
    document: {
      accept: '.pdf,.doc,.docx,.txt,.rtf,.odt',
      maxSize: 25 * 1024 * 1024, // 25MB
      icon: FiFileText,
      title: 'Upload Documents',
      description: 'Select documents to share (PDF, DOC, DOCX, TXT)'
    },
    all: {
      accept: '*/*',
      maxSize: 100 * 1024 * 1024, // 100MB
      icon: FiFile,
      title: 'Upload Files',
      description: 'Select any files to share'
    }
  };

  const config = fileTypeConfig[fileType] || fileTypeConfig.all;

  const validateFile = (file) => {
    if (file.size > config.maxSize) {
      toast.error(`File "${file.name}" is too large. Maximum size is ${formatFileSize(config.maxSize)}`);
      return false;
    }
    
    if (fileType !== 'all') {
      const acceptedTypes = config.accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        if (type.includes('/*')) {
          return mimeType.startsWith(type.replace('/*', ''));
        }
        return mimeType === type;
      });
      
      if (!isAccepted) {
        toast.error(`File type not supported for "${file.name}"`);
        return false;
      }
    }
    
    return true;
  };

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(validateFile);
    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: createFilePreview(file),
      size: file.size,
      type: file.type,
      name: file.name
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const createFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const removeFile = (fileId) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up preview URLs
      const removed = prev.find(f => f.id === fileId);
      if (removed && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const handleSend = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    
    const files = selectedFiles.map(f => f.file);
    onSendFiles(files, fileType);
    
    // Clean up preview URLs
    selectedFiles.forEach(f => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    
    setSelectedFiles([]);
  };

  const handleCancel = () => {
    // Clean up preview URLs
    selectedFiles.forEach(f => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    
    setSelectedFiles([]);
    onCancel();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return FiImage;
    if (file.type.startsWith('video/')) return FiVideo;
    if (file.type.startsWith('audio/')) return FiMusic;
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return FiFileText;
    return FiFile;
  };

  if (!isVisible) return null;

  const IconComponent = config.icon;

  return (
    <div className="file-upload-overlay">
      <div className="file-upload-modal">
        <div className="file-upload-header">
          <div className="header-content">
            <IconComponent className="header-icon" />
            <div>
              <h3>{config.title}</h3>
              <p>{config.description}</p>
            </div>
          </div>
          <button className="close-btn" onClick={handleCancel}>
            <FiX />
          </button>
        </div>
        
        <div className="file-upload-content">
          <div 
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="upload-icon" />
            <h4>Drop files here or click to browse</h4>
            <p>Maximum file size: {formatFileSize(config.maxSize)}</p>
            <button className="browse-btn">
              <FiFolder />
              Browse Files
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={config.accept}
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
          
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files ({selectedFiles.length})</h4>
              <div className="files-list">
                {selectedFiles.map((fileObj) => {
                  const FileIcon = getFileIcon(fileObj.file);
                  return (
                    <div key={fileObj.id} className="file-item">
                      <div className="file-preview">
                        {fileObj.preview ? (
                          <img src={fileObj.preview} alt={fileObj.name} />
                        ) : (
                          <FileIcon className="file-icon" />
                        )}
                      </div>
                      <div className="file-info">
                        <span className="file-name">{fileObj.name}</span>
                        <span className="file-size">{formatFileSize(fileObj.size)}</span>
                      </div>
                      <button 
                        className="remove-file-btn"
                        onClick={() => removeFile(fileObj.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="file-upload-actions">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="send-btn"
            onClick={handleSend}
            disabled={selectedFiles.length === 0}
          >
            <FiSend />
            Send {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
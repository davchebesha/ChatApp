import React, { useState, useRef, useEffect } from 'react';
import { 
  FiSend, FiMic, FiPaperclip, FiSmile, FiBold, FiItalic, 
  FiUnderline, FiType, FiList, FiCode, FiLink, FiImage,
  FiFile, FiVideo, FiMusic, FiMoreHorizontal, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import VoiceRecorder from './VoiceRecorder';
import FileUploadModal from './FileUploadModal';
import TelegramEmojiPicker from './TelegramEmojiPicker';
import TelegramTextToolbar from './TelegramTextToolbar';
import './RichMessageInput.css';

const RichMessageInput = ({ onSendMessage, onSendFile, replyTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), replyTo);
      setMessage('');
      if (onCancelReply) onCancelReply();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = message.substring(start, end);
      
      if (selected.length > 0) {
        setSelectedText(selected);
        setCursorPosition(start);
        
        // Calculate toolbar position
        const rect = textareaRef.current.getBoundingClientRect();
        const containerRect = inputContainerRef.current.getBoundingClientRect();
        
        setToolbarPosition({
          top: rect.top - containerRect.top - 50,
          left: rect.left - containerRect.left + (rect.width / 2) - 100
        });
        
        setShowTextToolbar(true);
      } else {
        setShowTextToolbar(false);
        setSelectedText('');
      }
    }
  };

  // Handle text formatting from toolbar
  const handleFormatText = (formattedText, formatType) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);
    
    // Set cursor position after formatting
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + formattedText.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
    
    setShowTextToolbar(false);
  };

  // Handle link insertion
  const handleInsertLink = (linkMarkdown) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const newMessage = message.substring(0, start) + linkMarkdown + message.substring(end);
    setMessage(newMessage);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + linkMarkdown.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
    
    setShowTextToolbar(false);
  };

  const insertEmoji = (emoji) => {
    const start = textareaRef.current?.selectionStart || message.length;
    const newMessage = message.substring(0, start) + emoji + message.substring(start);
    setMessage(newMessage);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
      }
    }, 0);
    
    setShowEmojiPicker(false);
  };

  const insertSticker = (sticker) => {
    // For now, treat stickers as large emojis
    insertEmoji(sticker + ' ');
  };

  const handleVoiceSend = (audioFile, duration) => {
    onSendFile(audioFile, 'voice', { duration });
    setShowVoiceRecorder(false);
    toast.success('Voice message sent!');
  };

  const handleFileSend = (files, fileType) => {
    files.forEach(file => {
      onSendFile(file, fileType);
    });
    setShowFileUpload(false);
    toast.success(`${files.length} file(s) sent!`);
  };

  const triggerFileUpload = (fileType) => {
    setShowFileUpload(true);
  };

  const formatPreview = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  };

  return (
    <div className="rich-message-input" ref={inputContainerRef}>
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span className="reply-to">Replying to {replyTo.sender.username}</span>
            <p className="reply-message">{replyTo.content}</p>
          </div>
          <button className="cancel-reply" onClick={onCancelReply}>
            <FiX />
          </button>
        </div>
      )}
      
      <div className="telegram-input-container">
        {/* Telegram-style Text Toolbar */}
        <TelegramTextToolbar
          isVisible={showTextToolbar}
          selectedText={selectedText}
          textAreaRef={textareaRef}
          position={toolbarPosition}
          onFormatText={handleFormatText}
          onInsertLink={handleInsertLink}
        />
        
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onSelect={handleTextSelection}
            onMouseUp={handleTextSelection}
            placeholder="Type a message... Select text for formatting options"
            className="telegram-message-textarea"
            rows="1"
          />
          
          {message && (
            <div className="message-preview">
              <div 
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: formatPreview(message) }}
              />
            </div>
          )}
        </div>
        
        <div className="telegram-input-actions">
          {/* Attachment Menu */}
          <div className="attachment-wrapper">
            <button 
              className={`action-btn attachment-btn ${showAttachMenu ? 'active' : ''}`}
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              title="Attach Files"
            >
              <FiPaperclip />
            </button>
            
            {showAttachMenu && (
              <div className="telegram-attach-menu">
                <button 
                  className="attach-item"
                  onClick={() => { triggerFileUpload('image'); setShowAttachMenu(false); }}
                >
                  <FiImage />
                  <span>Photo</span>
                </button>
                <button 
                  className="attach-item"
                  onClick={() => { triggerFileUpload('video'); setShowAttachMenu(false); }}
                >
                  <FiVideo />
                  <span>Video</span>
                </button>
                <button 
                  className="attach-item"
                  onClick={() => { triggerFileUpload('audio'); setShowAttachMenu(false); }}
                >
                  <FiMusic />
                  <span>Audio</span>
                </button>
                <button 
                  className="attach-item"
                  onClick={() => { triggerFileUpload('document'); setShowAttachMenu(false); }}
                >
                  <FiFile />
                  <span>Document</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Emoji & Stickers */}
          <button 
            className={`action-btn emoji-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emojis & Stickers"
          >
            <FiSmile />
          </button>
          
          {/* Voice Message */}
          <button 
            className="action-btn voice-btn"
            onClick={() => setShowVoiceRecorder(true)}
            title="Voice Message"
          >
            <FiMic />
          </button>
          
          {/* Send Button */}
          <button 
            className={`action-btn send-btn ${message.trim() ? 'active' : ''}`}
            onClick={handleSend}
            disabled={!message.trim()}
            title="Send Message (Enter)"
          >
            <FiSend />
          </button>
        </div>
      </div>
      
      {/* Telegram Emoji & Sticker Picker */}
      <TelegramEmojiPicker
        isVisible={showEmojiPicker}
        onEmojiSelect={insertEmoji}
        onStickerSelect={insertSticker}
        onClose={() => setShowEmojiPicker(false)}
      />
      
      {/* Voice Recorder */}
      <VoiceRecorder
        isVisible={showVoiceRecorder}
        onSendVoice={handleVoiceSend}
        onCancel={() => setShowVoiceRecorder(false)}
      />
      
      {/* File Upload Modal */}
      <FileUploadModal
        isVisible={showFileUpload}
        onSendFiles={handleFileSend}
        onCancel={() => setShowFileUpload(false)}
      />
    </div>
  );
};

export default RichMessageInput;
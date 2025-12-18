import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiPaperclip, FiPhone, FiVideo, FiMoreVertical, FiX, FiMic, FiImage, FiSettings } from 'react-icons/fi';
import Message from './Message';
import VideoCall from './VideoCall';
import ChatSettings from './ChatSettings';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Chat.css';

const ChatWindow = () => {
  const { selectedChat, messages, sendMessage, sendTyping, onlineUsers } = useChat();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    sendMessage(messageInput.trim(), 'text', replyingTo?._id);
    setMessageInput('');
    setReplyingTo(null);
    setIsTyping(false);
    sendTyping(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', selectedChat._id);
    formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');

    try {
      await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      setShowAttachMenu(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleForward = (message) => {
    // Forward functionality - you can enhance this
    toast.info('Forward feature - select a chat to forward to');
  };

  const handleVoiceCall = () => {
    setShowVoiceCall(true);
    toast.info('Voice call initiated');
  };

  const getChatName = () => {
    if (!selectedChat) return '';
    
    if (selectedChat.type === 'private') {
      const otherUser = selectedChat.participants.find(p => p._id !== user.id);
      return otherUser?.username || 'Unknown';
    }
    return selectedChat.name || 'Group Chat';
  };

  const getChatAvatar = () => {
    if (!selectedChat) return '';
    
    if (selectedChat.type === 'private') {
      const otherUser = selectedChat.participants.find(p => p._id !== user.id);
      return otherUser?.avatar || '/default-avatar.png';
    }
    return selectedChat.avatar || '/default-group.png';
  };

  const isUserOnline = () => {
    if (!selectedChat || selectedChat.type !== 'private') return false;
    
    const otherUser = selectedChat.participants.find(p => p._id !== user.id);
    return otherUser && onlineUsers.has(otherUser._id);
  };

  if (!selectedChat) {
    return null;
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-header-info">
          <div className="chat-avatar-wrapper">
            <img src={getChatAvatar()} alt="Avatar" className="avatar avatar-md" />
            {isUserOnline() && <span className="status-indicator status-online"></span>}
          </div>
          <div>
            <h3>{getChatName()}</h3>
            <span className="status-text">
              {isUserOnline() ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={handleVoiceCall} title="Voice Call">
            <FiPhone />
          </button>
          <button className="icon-btn" onClick={() => setShowVideoCall(true)} title="Video Call">
            <FiVideo />
          </button>
          <div className="more-menu-wrapper">
            <button 
              className="icon-btn" 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More"
            >
              <FiMoreVertical />
            </button>
            {showMoreMenu && (
              <div className="more-menu">
                <button onClick={() => { setShowChatSettings(true); setShowMoreMenu(false); }}>
                  <FiSettings /> Chat Settings
                </button>
                <button onClick={() => { toast.info('Mute chat'); setShowMoreMenu(false); }}>
                  🔕 Mute Chat
                </button>
                <button onClick={() => { toast.info('Clear chat'); setShowMoreMenu(false); }}>
                  🗑️ Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map(message => (
          <Message 
            key={message._id} 
            message={message}
            onReply={handleReply}
            onForward={handleForward}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="replying-to-bar">
          <div className="replying-to-content">
            <strong>Replying to {replyingTo.sender.username}</strong>
            <p>{replyingTo.content}</p>
          </div>
          <button className="icon-btn" onClick={() => setReplyingTo(null)}>
            <FiX />
          </button>
        </div>
      )}

      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-input-form">
          <div className="attach-menu-wrapper">
            <button 
              type="button" 
              className="icon-btn" 
              title="Attach File"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <FiPaperclip />
            </button>
            
            {showAttachMenu && (
              <div className="attach-menu">
                <button 
                  type="button" 
                  className="attach-menu-item"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiImage /> Photo/Video
                </button>
                <button 
                  type="button" 
                  className="attach-menu-item"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiPaperclip /> Document
                </button>
                <button 
                  type="button" 
                  className="attach-menu-item"
                >
                  <FiMic /> Audio
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />

          <input
            type="text"
            className="message-input"
            placeholder={uploadingFile ? "Uploading..." : "Type a message..."}
            value={messageInput}
            onChange={handleInputChange}
            disabled={uploadingFile}
          />
          <button type="submit" className="icon-btn send-btn" disabled={!messageInput.trim() || uploadingFile}>
            <FiSend />
          </button>
        </form>
      </div>

      {showVideoCall && (
        <VideoCall
          chat={selectedChat}
          onClose={() => setShowVideoCall(false)}
          isVoiceOnly={false}
        />
      )}

      {showVoiceCall && (
        <VideoCall
          chat={selectedChat}
          onClose={() => setShowVoiceCall(false)}
          isVoiceOnly={true}
        />
      )}

      {showChatSettings && (
        <ChatSettings onClose={() => setShowChatSettings(false)} />
      )}
    </div>
  );
};

export default ChatWindow;

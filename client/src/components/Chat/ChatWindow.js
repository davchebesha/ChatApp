import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiPhone, FiVideo, FiMoreVertical, FiX, FiSettings, FiChevronDown } from 'react-icons/fi';
import Message from './Message';
import VideoCall from './VideoCall';
import ChatSettings from './ChatSettings';
import RichMessageInput from './RichMessageInput';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Chat.css';

const ChatWindow = () => {
  const { selectedChat, messages, sendMessage, sendTyping, onlineUsers } = useChat();
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced scroll detection for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  const handleScrollToBottom = () => {
    scrollToBottom(true);
    setShowScrollButton(false);
  };

  const handleSendMessage = (content, replyTo = null) => {
    if (content.trim()) {
      sendMessage(content.trim(), replyTo);
      setReplyingTo(null);
    }
  };

  const handleSendFile = async (file, fileType, metadata = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', selectedChat._id);
      formData.append('type', fileType);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // File uploaded successfully, message will be sent via socket
        toast.success('File sent successfully!');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to send file');
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    setShowMoreMenu(false);
  };

  const handleForward = (message) => {
    setForwardingMessage(message);
    // TODO: Implement forward modal
    toast.info('Forward feature coming soon!');
    setShowMoreMenu(false);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
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
      return otherUser?.avatar || '/default-avatar.svg';
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

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map(message => (
          <Message 
            key={message._id} 
            message={message}
            onReply={handleReply}
            onForward={handleForward}
          />
        ))}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        <button 
          className={`scroll-to-bottom ${showScrollButton ? 'visible' : ''}`}
          onClick={handleScrollToBottom}
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <FiChevronDown />
        </button>
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

      <RichMessageInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        replyTo={replyingTo}
        onCancelReply={handleCancelReply}
      />

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

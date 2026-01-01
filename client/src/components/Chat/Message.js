import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  FiEdit2, FiTrash2, FiCornerUpLeft, FiCornerUpRight, FiSmile, 
  FiDownload, FiMoreVertical, FiCopy, FiShare, FiPlay, FiPause,
  FiVolume2, FiVolumeX, FiPin, FiStar, FiInfo, FiFlag
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Avatar from '../Common/Avatar';
import './Chat.css';

const Message = ({ message, onReply, onForward }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const isOwnMessage = message.sender._id === user.id;

  const handleEdit = () => {
    if (!editedContent.trim()) return;
    
    if (socket) {
      socket.emit('edit_message', {
        messageId: message._id,
        content: editedContent,
        chatId: message.chat
      });
    }
    setIsEditing(false);
    toast.success('Message edited');
  };

  const handleDelete = (deleteForEveryone = false) => {
    if (window.confirm(deleteForEveryone ? 'Delete for everyone?' : 'Delete for you?')) {
      if (socket) {
        socket.emit('delete_message', {
          messageId: message._id,
          chatId: message.chat,
          deleteForEveryone
        });
      }
      toast.success('Message deleted');
    }
  };

  const handleReaction = (emoji) => {
    if (socket) {
      socket.emit('toggle_reaction', {
        messageId: message._id,
        emoji,
        chatId: message.chat
      });
    }
    setShowEmojiPicker(false);
  };

  const handleDownload = () => {
    if (message.file) {
      const link = document.createElement('a');
      link.href = message.file.url;
      link.download = message.file.name || `file-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started...');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Shared Message',
        text: message.content,
        url: window.location.href
      });
    } else {
      handleCopy();
    }
  };

  const handlePin = () => {
    if (socket) {
      socket.emit('pin_message', {
        messageId: message._id,
        chatId: message.chat,
        pinned: !message.pinned
      });
    }
    toast.success(message.pinned ? 'Message unpinned' : 'Message pinned');
    setShowMoreMenu(false);
  };

  const handleReport = () => {
    if (window.confirm('Report this message as inappropriate?')) {
      if (socket) {
        socket.emit('report_message', {
          messageId: message._id,
          chatId: message.chat,
          reason: 'inappropriate_content'
        });
      }
      toast.success('Message reported');
      setShowMoreMenu(false);
    }
  };

  const handleSelectMessage = () => {
    // This would integrate with a message selection system
    toast.info('Message selection feature coming soon');
    setShowMoreMenu(false);
  };

  const handleMessageInfo = () => {
    const info = `
Message Info:
- Sent: ${new Date(message.createdAt).toLocaleString()}
- Type: ${message.type || 'text'}
- Size: ${message.file ? (message.file.size / 1024).toFixed(2) + ' KB' : 'N/A'}
- Read by: ${message.readBy?.length || 0} users
${message.edited ? '- Edited: Yes' : ''}
    `;
    alert(info);
    setShowMoreMenu(false);
  };

  const handleAddToFavorites = () => {
    // This would integrate with a favorites system
    if (socket) {
      socket.emit('add_to_favorites', {
        messageId: message._id,
        chatId: message.chat
      });
    }
    toast.success('Added to favorites');
    setShowMoreMenu(false);
  };

  const playVoiceMessage = () => {
    if (message.type === 'voice' && message.file) {
      const audio = new Audio(message.file.url);
      
      audio.onplay = () => setIsPlayingVoice(true);
      audio.onpause = () => setIsPlayingVoice(false);
      audio.onended = () => {
        setIsPlayingVoice(false);
        setVoiceProgress(0);
      };
      
      audio.ontimeupdate = () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setVoiceProgress(progress);
      };
      
      if (isPlayingVoice) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  };

  const formatMessageContent = (content) => {
    if (!content) return '';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br>');
  };

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div 
      className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Other user's messages - Left side with avatar */}
      {!isOwnMessage && (
        <div className="message-left">
          <Avatar 
            src={message.sender.avatar}
            alt="Avatar"
            size="sm"
            username={message.sender.username}
            className="message-avatar"
          />
          <div className="message-content">
            <span className="message-sender">{message.sender.username}</span>
            {renderMessageContent()}
            {renderMessageMeta()}
            {renderReactions()}
          </div>
        </div>
      )}

      {/* Own messages - Right side without avatar */}
      {isOwnMessage && (
        <div className="message-right">
          <div className="message-content">
            {renderMessageContent()}
            {renderMessageMeta()}
            {renderReactions()}
          </div>
        </div>
      )}

      {/* Message actions */}
      {showActions && !message.deleted && (
        <div className={`message-actions ${isOwnMessage ? 'own' : 'other'}`}>
          <button 
            className="action-btn" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="React"
          >
            <FiSmile />
          </button>
          <button 
            className="action-btn" 
            onClick={() => onReply(message)}
            title="Reply"
          >
            <FiCornerUpLeft />
          </button>
          <button 
            className="action-btn" 
            onClick={() => onForward(message)}
            title="Forward"
          >
            <FiCornerUpRight />
          </button>
          <button 
            className="action-btn" 
            onClick={handleCopy}
            title="Copy"
          >
            <FiCopy />
          </button>
          <button 
            className="action-btn" 
            onClick={handleShare}
            title="Share"
          >
            <FiShare />
          </button>
          {isOwnMessage && (
            <>
              <button 
                className="action-btn" 
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                <FiEdit2 />
              </button>
              <button 
                className="action-btn delete-btn" 
                onClick={() => handleDelete(true)}
                title="Delete for everyone"
              >
                <FiTrash2 />
              </button>
            </>
          )}
          <div className="more-actions">
            <button 
              className="action-btn" 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More options"
            >
              <FiMoreVertical />
            </button>
            {showMoreMenu && (
              <div className="more-menu">
                <button onClick={() => handleDelete(false)}>
                  <FiTrash2 />
                  Delete for me
                </button>
                
                {isOwnMessage && (
                  <button onClick={() => handleDelete(true)}>
                    <FiTrash2 />
                    Delete for everyone
                  </button>
                )}
                
                {message.file && (
                  <button onClick={handleDownload}>
                    <FiDownload />
                    Save to device
                  </button>
                )}
                
                <button onClick={handlePin}>
                  📌 {message.pinned ? 'Unpin' : 'Pin message'}
                </button>
                
                <button onClick={handleAddToFavorites}>
                  ⭐ Add to favorites
                </button>
                
                <button onClick={handleSelectMessage}>
                  ☑️ Select message
                </button>
                
                <button onClick={handleMessageInfo}>
                  ℹ️ Message info
                </button>
                
                {!isOwnMessage && (
                  <button onClick={handleReport} className="report-btn">
                    🚨 Report message
                  </button>
                )}
                
                <button onClick={handleCopy}>
                  <FiCopy />
                  Copy text
                </button>
                
                <button onClick={handleShare}>
                  <FiShare />
                  Share message
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          {quickEmojis.map((emoji, index) => {
            const userHasReacted = message.reactions?.some(
              r => r.user === user.id && r.emoji === emoji
            );
            return (
              <button
                key={index}
                className={`emoji-btn ${userHasReacted ? 'active' : ''}`}
                onClick={() => handleReaction(emoji)}
                title={userHasReacted ? `Remove ${emoji}` : `Add ${emoji}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Helper function to render message content
  function renderMessageContent() {
    if (isEditing) {
      return (
        <div className="message-edit-box">
          <input
            type="text"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
            autoFocus
          />
          <div className="edit-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={handleEdit}>Save</button>
          </div>
        </div>
      );
    }

    if (message.deleted) {
      return (
        <div className="message-bubble deleted">
          <em className="deleted-message">{message.content}</em>
        </div>
      );
    }

    return (
      <div className="message-bubble">
        {message.replyTo && (
          <div className="message-reply">
            <div className="reply-indicator"></div>
            <div className="reply-content">
              <span className="reply-author">{message.replyTo.sender?.username}</span>
              <p className="reply-text">{message.replyTo.content}</p>
            </div>
          </div>
        )}
        
        {message.type === 'voice' ? (
          <div className="voice-message">
            <button 
              className="voice-play-btn"
              onClick={playVoiceMessage}
            >
              {isPlayingVoice ? <FiPause /> : <FiPlay />}
            </button>
            <div className="voice-waveform">
              <div 
                className="voice-progress"
                style={{ width: `${voiceProgress}%` }}
              ></div>
            </div>
            <span className="voice-duration">
              {message.metadata?.duration ? 
                `${Math.floor(message.metadata.duration / 60)}:${(message.metadata.duration % 60).toString().padStart(2, '0')}` : 
                '0:00'
              }
            </span>
            <button 
              className="voice-mute-btn"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
          </div>
        ) : message.file && message.type === 'image' ? (
          <div className="message-image">
            <img src={message.file.url} alt={message.file.name} />
            {message.content && (
              <div 
                className="image-caption"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
              />
            )}
          </div>
        ) : message.file && message.type === 'video' ? (
          <div className="message-video">
            <video controls>
              <source src={message.file.url} type={message.file.type} />
              Your browser does not support the video tag.
            </video>
            {message.content && (
              <div 
                className="video-caption"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
              />
            )}
          </div>
        ) : message.file ? (
          <div className="message-file">
            <div className="file-info">
              <FiDownload />
              <div>
                <strong>{message.file.name}</strong>
                <small>{(message.file.size / 1024).toFixed(2)} KB</small>
              </div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={handleDownload}>
              Download
            </button>
          </div>
        ) : (
          <div 
            className="message-text"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
          />
        )}
      </div>
    );
  }

  // Helper function to render message metadata
  function renderMessageMeta() {
    return (
      <div className="message-meta">
        <span className="message-time">
          {message.createdAt ? 
            formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 
            'Just now'
          }
        </span>
        {message.edited && <span className="edited-indicator">Edited</span>}
        {isOwnMessage && (
          <span className="message-status">
            {message.readBy?.length > 1 ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    );
  }

  // Helper function to render reactions
  function renderReactions() {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <div className="message-reactions">
        {message.reactions.map((reaction, index) => {
          const isUserReaction = reaction.user === user.id;
          return (
            <span 
              key={index} 
              className={`reaction ${isUserReaction ? 'user-reaction' : ''}`}
              title={`Reacted by ${isUserReaction ? 'you' : 'user'}`}
              onClick={() => handleReaction(reaction.emoji)}
            >
              {reaction.emoji}
            </span>
          );
        })}
      </div>
    );
  }
};

export default Message;

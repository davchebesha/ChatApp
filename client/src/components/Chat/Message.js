import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { FiEdit2, FiTrash2, FiCornerUpLeft, FiCornerUpRight, FiSmile, FiDownload, FiMoreVertical } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Chat.css';

const Message = ({ message, onReply, onForward }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
      socket.emit('add_reaction', {
        messageId: message._id,
        emoji,
        chatId: message.chat
      });
    }
    setShowEmojiPicker(false);
  };

  const handleDownload = () => {
    if (message.file) {
      window.open(message.file.url, '_blank');
      toast.success('Downloading file...');
    }
  };

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div 
      className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwnMessage && (
        <img 
          src={message.sender.avatar || '/default-avatar.png'} 
          alt="Avatar" 
          className="avatar avatar-sm message-avatar"
        />
      )}
      <div className="message-content">
        {!isOwnMessage && (
          <span className="message-sender">{message.sender.username}</span>
        )}
        
        {isEditing ? (
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
        ) : (
          <div className="message-bubble">
            {message.deleted ? (
              <em className="deleted-message">{message.content}</em>
            ) : (
              <>
                {message.replyTo && (
                  <div className="message-reply">
                    <small>↩️ Replying to a message</small>
                  </div>
                )}
                {message.file && message.type === 'image' ? (
                  <div className="message-image">
                    <img src={message.file.url} alt={message.file.name} />
                    {message.content && <p>{message.content}</p>}
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
                  <p>{message.content}</p>
                )}
              </>
            )}
          </div>
        )}

        <div className="message-meta">
          <span className="message-time">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {message.edited && <span className="edited-indicator">Edited</span>}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, index) => (
              <span key={index} className="reaction" title={`Reacted by user`}>
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

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
                  className="action-btn" 
                  onClick={() => handleDelete(true)}
                  title="Delete for everyone"
                >
                  <FiTrash2 />
                </button>
              </>
            )}
            <button className="action-btn" title="More">
              <FiMoreVertical />
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="emoji-picker">
            {quickEmojis.map((emoji, index) => (
              <button
                key={index}
                className="emoji-btn"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;

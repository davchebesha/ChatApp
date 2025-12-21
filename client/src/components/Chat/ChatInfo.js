import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { 
  FiX, FiUsers, FiImage, FiFile, FiLink, FiSettings, 
  FiUserPlus, FiUserMinus, FiEdit3, FiTrash2, FiVolumeX,
  FiVolume2, FiBell, FiBellOff, FiStar, FiArchive
} from 'react-icons/fi';
import './ChatInfo.css';

const ChatInfo = ({ chat, onClose }) => {
  const { user } = useAuth();
  const { updateChat, leaveChat } = useChat();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [chatName, setChatName] = useState(chat?.name || '');

  if (!chat) return null;

  const isGroupChat = chat.type === 'group';
  const otherUser = isGroupChat ? null : chat.participants?.find(p => p._id !== user?.id);
  const isAdmin = isGroupChat && chat.admins?.includes(user?.id);

  const handleSaveName = async () => {
    try {
      await updateChat(chat._id, { name: chatName });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update chat name:', error);
    }
  };

  const handleLeaveChat = async () => {
    if (window.confirm('Are you sure you want to leave this chat?')) {
      try {
        await leaveChat(chat._id);
        onClose();
      } catch (error) {
        console.error('Failed to leave chat:', error);
      }
    }
  };

  const tabs = [
    { id: 'info', label: 'Info', icon: <FiUsers /> },
    { id: 'media', label: 'Media', icon: <FiImage /> },
    { id: 'files', label: 'Files', icon: <FiFile /> },
    { id: 'links', label: 'Links', icon: <FiLink /> }
  ];

  const renderInfoTab = () => (
    <div className="chat-info-content">
      {/* Chat Header */}
      <div className="chat-info-header">
        <div className="chat-avatar-large">
          <img 
            src={isGroupChat ? (chat.avatar || '/default-group.png') : (otherUser?.avatar || '/default-avatar.png')} 
            alt="Chat Avatar" 
          />
        </div>
        
        <div className="chat-title-section">
          {isEditing ? (
            <div className="edit-name-section">
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="input"
                placeholder="Chat name"
              />
              <div className="edit-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveName}>
                  Save
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-title-display">
              <h2>{isGroupChat ? chat.name : otherUser?.username}</h2>
              {isGroupChat && isAdmin && (
                <button className="edit-name-btn" onClick={() => setIsEditing(true)}>
                  <FiEdit3 />
                </button>
              )}
            </div>
          )}
          
          <p className="chat-subtitle">
            {isGroupChat 
              ? `${chat.participants?.length || 0} members`
              : otherUser?.status || 'Last seen recently'
            }
          </p>
        </div>
      </div>

      {/* Chat Actions */}
      <div className="chat-actions">
        <button className="action-btn">
          <FiBell />
          <span>Notifications</span>
        </button>
        <button className="action-btn">
          <FiStar />
          <span>Starred</span>
        </button>
        <button className="action-btn">
          <FiArchive />
          <span>Archive</span>
        </button>
        <button className="action-btn mute">
          <FiVolumeX />
          <span>Mute</span>
        </button>
      </div>

      {/* Group Members */}
      {isGroupChat && (
        <div className="members-section">
          <div className="section-header">
            <h3>Members ({chat.participants?.length || 0})</h3>
            {isAdmin && (
              <button className="btn btn-primary btn-sm">
                <FiUserPlus /> Add Member
              </button>
            )}
          </div>
          
          <div className="members-list">
            {chat.participants?.map(member => (
              <div key={member._id} className="member-item">
                <img src={member.avatar || '/default-avatar.png'} alt="Avatar" className="avatar avatar-sm" />
                <div className="member-info">
                  <span className="member-name">{member.username}</span>
                  <span className="member-status">{member.status}</span>
                </div>
                {chat.admins?.includes(member._id) && (
                  <span className="admin-badge">Admin</span>
                )}
                {isAdmin && member._id !== user?.id && (
                  <button className="member-action-btn">
                    <FiUserMinus />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Settings */}
      <div className="settings-section">
        <h3>Settings</h3>
        <div className="settings-list">
          <button className="setting-item">
            <FiSettings />
            <span>Chat Settings</span>
          </button>
          <button className="setting-item danger" onClick={handleLeaveChat}>
            <FiTrash2 />
            <span>{isGroupChat ? 'Leave Group' : 'Delete Chat'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="chat-info-content">
      <div className="media-grid">
        <div className="media-placeholder">
          <FiImage size={48} />
          <p>No media shared yet</p>
        </div>
      </div>
    </div>
  );

  const renderFilesTab = () => (
    <div className="chat-info-content">
      <div className="files-list">
        <div className="files-placeholder">
          <FiFile size={48} />
          <p>No files shared yet</p>
        </div>
      </div>
    </div>
  );

  const renderLinksTab = () => (
    <div className="chat-info-content">
      <div className="links-list">
        <div className="links-placeholder">
          <FiLink size={48} />
          <p>No links shared yet</p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info': return renderInfoTab();
      case 'media': return renderMediaTab();
      case 'files': return renderFilesTab();
      case 'links': return renderLinksTab();
      default: return renderInfoTab();
    }
  };

  return (
    <div className="chat-info">
      <div className="chat-info-header-bar">
        <h2>Chat Info</h2>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <div className="chat-info-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="chat-info-body">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ChatInfo;
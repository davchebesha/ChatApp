import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { FiX, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Chat.css';

const NewChatModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatType, setChatType] = useState('private');
  const [groupName, setGroupName] = useState('');
  const { createChat } = useChat();

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers();
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      const response = await api.get(`/users/search?query=${searchQuery}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Search users error:', error);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (chatType === 'group' && !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const chat = await createChat(
      chatType,
      selectedUsers.map(u => u._id),
      groupName,
      ''
    );

    if (chat) {
      toast.success('Chat created successfully');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Chat</h2>
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="chat-type-selector">
            <button
              className={`btn ${chatType === 'private' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setChatType('private')}
            >
              Private Chat
            </button>
            <button
              className={`btn ${chatType === 'group' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setChatType('group')}
            >
              Group Chat
            </button>
          </div>

          {chatType === 'group' && (
            <div className="form-group">
              <input
                type="text"
                className="input"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="selected-users">
              {selectedUsers.map(user => (
                <div key={user._id} className="selected-user-chip">
                  {user.username}
                  <button onClick={() => toggleUserSelection(user)}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="user-list">
            {users.map(user => (
              <div
                key={user._id}
                className={`user-item ${selectedUsers.find(u => u._id === user._id) ? 'selected' : ''}`}
                onClick={() => toggleUserSelection(user)}
              >
                <img src={user.avatar || '/default-avatar.png'} alt="Avatar" className="avatar avatar-sm" />
                <div className="user-info">
                  <h4>{user.username}</h4>
                  <p>{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreateChat}>
            Create Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;

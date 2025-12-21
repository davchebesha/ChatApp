import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Search.css';

const SearchPage = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, users, messages, chats
  const [results, setResults] = useState({
    users: [],
    messages: [],
    chats: []
  });
  const [loading, setLoading] = useState(false);
  const { createChat, selectChat, chats } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const promises = [];

        if (searchType === 'all' || searchType === 'users') {
          promises.push(
            api.get(`/users/search?query=${searchQuery}`)
              .then(res => ({ users: res.data.users }))
              .catch(() => ({ users: [] }))
          );
        }

        if (searchType === 'all' || searchType === 'messages') {
          promises.push(
            api.get(`/messages/search?query=${searchQuery}`)
              .then(res => ({ messages: res.data.messages }))
              .catch(() => ({ messages: [] }))
          );
        }

        const responses = await Promise.all(promises);
        const combinedResults = responses.reduce((acc, curr) => ({ ...acc, ...curr }), {});

        // Filter chats locally
        if (searchType === 'all' || searchType === 'chats') {
          const filteredChats = chats.filter(chat => {
            const chatName = chat.type === 'private'
              ? chat.participants.find(p => p._id !== user.id)?.username || ''
              : chat.name || '';
            return chatName.toLowerCase().includes(searchQuery.toLowerCase());
          });
          combinedResults.chats = filteredChats;
        }

        setResults(combinedResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setResults({ users: [], messages: [], chats: [] });
    }
  }, [searchQuery, searchType, chats, user.id]);

  const handleUserClick = async (selectedUser) => {
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.type === 'private' && 
        chat.participants.some(p => p._id === selectedUser._id)
      );

      if (existingChat) {
        selectChat(existingChat);
      } else {
        const newChat = await createChat('private', [selectedUser._id]);
        if (newChat) {
          selectChat(newChat);
        }
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('Failed to open chat');
    }
  };

  const handleChatClick = (chat) => {
    selectChat(chat);
    if (onClose) onClose();
  };

  const handleMessageClick = (message) => {
    const chat = chats.find(c => c._id === message.chat._id);
    if (chat) {
      selectChat(chat);
      if (onClose) onClose();
    }
  };

  const getChatName = (chat) => {
    if (chat.type === 'private') {
      const otherUser = chat.participants.find(p => p._id !== user.id);
      return otherUser?.username || 'Unknown';
    }
    return chat.name || 'Group Chat';
  };

  return (
    <div className="search-page">
      <div className="search-page-header">
        <h2>Search</h2>
      </div>

      <div className="search-page-content">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input-large"
            placeholder="Search users, messages, or chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Search Type Filters */}
        <div className="search-filters">
          <button
            className={`filter-btn ${searchType === 'all' ? 'active' : ''}`}
            onClick={() => setSearchType('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${searchType === 'users' ? 'active' : ''}`}
            onClick={() => setSearchType('users')}
          >
            <FiUser /> Users
          </button>
          <button
            className={`filter-btn ${searchType === 'messages' ? 'active' : ''}`}
            onClick={() => setSearchType('messages')}
          >
            <FiMessageSquare /> Messages
          </button>
          <button
            className={`filter-btn ${searchType === 'chats' ? 'active' : ''}`}
            onClick={() => setSearchType('chats')}
          >
            <FiUsers /> Chats
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchQuery.length > 2 && (
          <div className="search-results">
            {/* Users Results */}
            {(searchType === 'all' || searchType === 'users') && results.users && results.users.length > 0 && (
              <div className="search-section">
                <h3 className="search-section-title">
                  <FiUser /> Users ({results.users.length})
                </h3>
                <div className="search-items">
                  {results.users.map(foundUser => (
                    <div
                      key={foundUser._id}
                      className="search-item user-item"
                      onClick={() => handleUserClick(foundUser)}
                    >
                      <img
                        src={foundUser.avatar || '/default-avatar.png'}
                        alt="Avatar"
                        className="avatar avatar-md"
                      />
                      <div className="search-item-info">
                        <h4>{foundUser.username}</h4>
                        <p>{foundUser.email}</p>
                      </div>
                      <span className={`status-indicator status-${foundUser.status}`}></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Results */}
            {(searchType === 'all' || searchType === 'messages') && results.messages && results.messages.length > 0 && (
              <div className="search-section">
                <h3 className="search-section-title">
                  <FiMessageSquare /> Messages ({results.messages.length})
                </h3>
                <div className="search-items">
                  {results.messages.map(message => (
                    <div
                      key={message._id}
                      className="search-item message-item"
                      onClick={() => handleMessageClick(message)}
                    >
                      <img
                        src={message.sender?.avatar || '/default-avatar.png'}
                        alt="Avatar"
                        className="avatar avatar-sm"
                      />
                      <div className="search-item-info">
                        <h4>{message.sender?.username}</h4>
                        <p className="message-preview">{message.content}</p>
                        <small className="message-date">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chats Results */}
            {(searchType === 'all' || searchType === 'chats') && results.chats && results.chats.length > 0 && (
              <div className="search-section">
                <h3 className="search-section-title">
                  <FiUsers /> Chats ({results.chats.length})
                </h3>
                <div className="search-items">
                  {results.chats.map(chat => (
                    <div
                      key={chat._id}
                      className="search-item chat-item"
                      onClick={() => handleChatClick(chat)}
                    >
                      <img
                        src={
                          chat.type === 'private'
                            ? chat.participants.find(p => p._id !== user.id)?.avatar || '/default-avatar.png'
                            : chat.avatar || '/default-group.png'
                        }
                        alt="Avatar"
                        className="avatar avatar-md"
                      />
                      <div className="search-item-info">
                        <h4>{getChatName(chat)}</h4>
                        <p>{chat.type === 'group' ? `${chat.participants.length} members` : 'Private chat'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.users?.length === 0 && 
             results.messages?.length === 0 && 
             results.chats?.length === 0 && (
              <div className="no-results">
                <FiSearch size={48} />
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && searchQuery.length <= 2 && (
          <div className="search-empty">
            <FiSearch size={64} />
            <h3>Start Searching</h3>
            <p>Search for users, messages, or chats</p>
            <ul className="search-tips">
              <li>Type at least 3 characters to search</li>
              <li>Use filters to narrow down results</li>
              <li>Click on any result to open</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

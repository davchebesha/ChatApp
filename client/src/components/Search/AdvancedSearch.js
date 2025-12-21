import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiSearch, FiFilter, FiX, FiCalendar, FiUser, FiMessageSquare,
  FiFile, FiImage, FiVideo, FiMic, FiLink, FiClock, FiTag
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import './AdvancedSearch.css';

const AdvancedSearch = ({ isOpen, onClose }) => {
  const { chats, searchMessages } = useChat();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // all, messages, files, media, links
    chat: 'all', // all, specific chat id
    sender: 'all', // all, me, others, specific user
    dateRange: 'all', // all, today, week, month, custom
    customDateFrom: '',
    customDateTo: '',
    hasAttachments: false,
    isStarred: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, searchFilters) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Mock search results - in real app, this would call API
        const mockResults = await performSearch(query, searchFilters);
        setSearchResults(mockResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery, filters);
  }, [searchQuery, filters, debouncedSearch]);

  const performSearch = async (query, searchFilters) => {
    // Mock search implementation
    const mockMessages = [
      {
        id: '1',
        content: 'Hey, how are you doing today?',
        sender: { id: '2', username: 'John', avatar: '/default-avatar.png' },
        chat: { id: 'chat1', name: 'John', type: 'private' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'message',
        hasAttachments: false,
        isStarred: false
      },
      {
        id: '2',
        content: 'Check out this document I shared',
        sender: { id: '3', username: 'Sarah', avatar: '/default-avatar.png' },
        chat: { id: 'chat2', name: 'Project Team', type: 'group' },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'file',
        hasAttachments: true,
        attachment: { name: 'project-plan.pdf', type: 'pdf' },
        isStarred: true
      },
      {
        id: '3',
        content: 'Great photo from our meeting!',
        sender: { id: user?.id, username: user?.username, avatar: user?.avatar },
        chat: { id: 'chat2', name: 'Project Team', type: 'group' },
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        type: 'image',
        hasAttachments: true,
        attachment: { name: 'meeting.jpg', type: 'image' },
        isStarred: false
      }
    ];

    // Apply filters
    let filteredResults = mockMessages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.sender.username.toLowerCase().includes(query.toLowerCase())
    );

    // Apply type filter
    if (searchFilters.type !== 'all') {
      filteredResults = filteredResults.filter(msg => msg.type === searchFilters.type);
    }

    // Apply chat filter
    if (searchFilters.chat !== 'all') {
      filteredResults = filteredResults.filter(msg => msg.chat.id === searchFilters.chat);
    }

    // Apply sender filter
    if (searchFilters.sender === 'me') {
      filteredResults = filteredResults.filter(msg => msg.sender.id === user?.id);
    } else if (searchFilters.sender === 'others') {
      filteredResults = filteredResults.filter(msg => msg.sender.id !== user?.id);
    }

    // Apply date range filter
    if (searchFilters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (searchFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filteredResults = filteredResults.filter(msg => 
        new Date(msg.timestamp) >= filterDate
      );
    }

    // Apply attachment filter
    if (searchFilters.hasAttachments) {
      filteredResults = filteredResults.filter(msg => msg.hasAttachments);
    }

    // Apply starred filter
    if (searchFilters.isStarred) {
      filteredResults = filteredResults.filter(msg => msg.isStarred);
    }

    return filteredResults;
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      chat: 'all',
      sender: 'all',
      dateRange: 'all',
      customDateFrom: '',
      customDateTo: '',
      hasAttachments: false,
      isStarred: false
    });
  };

  const getResultIcon = (result) => {
    switch (result.type) {
      case 'file':
        return <FiFile className="result-type-icon file" />;
      case 'image':
        return <FiImage className="result-type-icon image" />;
      case 'video':
        return <FiVideo className="result-type-icon video" />;
      case 'audio':
        return <FiMic className="result-type-icon audio" />;
      case 'link':
        return <FiLink className="result-type-icon link" />;
      default:
        return <FiMessageSquare className="result-type-icon message" />;
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="advanced-search-overlay" onClick={onClose}>
      <div className="advanced-search" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="search-header">
          <div className="search-title">
            <FiSearch className="search-icon" />
            <h2>Advanced Search</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Search Input */}
        <div className="search-input-section">
          <div className="search-input-wrapper">
            <FiSearch className="input-icon" />
            <input
              type="text"
              placeholder="Search messages, files, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <FiX />
              </button>
            )}
          </div>
          
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Type</label>
                <select 
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="message">Messages</option>
                  <option value="file">Files</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="link">Links</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Chat</label>
                <select 
                  value={filters.chat}
                  onChange={(e) => handleFilterChange('chat', e.target.value)}
                >
                  <option value="all">All Chats</option>
                  {chats.map(chat => (
                    <option key={chat._id} value={chat._id}>
                      {chat.type === 'private' 
                        ? chat.participants?.find(p => p._id !== user?.id)?.username || 'Unknown'
                        : chat.name || 'Group Chat'
                      }
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Sender</label>
                <select 
                  value={filters.sender}
                  onChange={(e) => handleFilterChange('sender', e.target.value)}
                >
                  <option value="all">Anyone</option>
                  <option value="me">Me</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Date Range</label>
                <select 
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            <div className="filter-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                />
                <span>Has Attachments</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.isStarred}
                  onChange={(e) => handleFilterChange('isStarred', e.target.checked)}
                />
                <span>Starred Only</span>
              </label>
            </div>

            <div className="filter-actions">
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="search-results">
          {isSearching ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : searchQuery && searchResults.length === 0 ? (
            <div className="no-results">
              <FiSearch className="no-results-icon" />
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="results-header">
                <span className="results-count">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </span>
              </div>
              
              <div className="results-list">
                {searchResults.map(result => (
                  <div 
                    key={result.id}
                    className="result-item"
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="result-icon">
                      {getResultIcon(result)}
                    </div>
                    
                    <div className="result-content">
                      <div className="result-header">
                        <span className="result-sender">
                          {result.sender.username}
                        </span>
                        <span className="result-chat">
                          in {result.chat.name}
                        </span>
                        <span className="result-time">
                          <FiClock />
                          {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="result-message">
                        {highlightText(result.content, searchQuery)}
                      </div>
                      
                      {result.hasAttachments && (
                        <div className="result-attachment">
                          <FiFile />
                          <span>{result.attachment?.name}</span>
                        </div>
                      )}
                    </div>
                    
                    {result.isStarred && (
                      <div className="result-starred">
                        <FiTag />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="search-placeholder">
              <FiSearch className="placeholder-icon" />
              <h3>Search your conversations</h3>
              <p>Find messages, files, images, and more across all your chats</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default AdvancedSearch;
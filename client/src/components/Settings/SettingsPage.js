import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiDroplet, FiUser, FiBell, FiShield, FiInfo, FiMessageSquare, FiChevronRight, FiChevronDown, FiArrowLeft, FiNavigation, FiX } from 'react-icons/fi';
import ThemeSettings from './ThemeSettings';
import ProfileSettings from './ProfileSettings';
import NotificationSettings from './NotificationSettings';
import ChattingSettings from './ChattingSettings';
import AboutNexus from './AboutNexus';
import PrivacySettings from './PrivacySettings';
import SettingsFlow from './SettingsFlow';
import { useNavigation } from '../../contexts/NavigationContext';
import { useNotification } from '../../contexts/NotificationContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [expandedTab, setExpandedTab] = useState(null);
  const [showGuidedSetup, setShowGuidedSetup] = useState(false);
  const { startFlow } = useNavigation();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const tabs = [
    { id: 'theme', label: 'Theme & Appearance', icon: <FiDroplet /> },
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'chatting', label: 'Chatting Settings', icon: <FiMessageSquare /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <FiShield /> },
    { id: 'about', label: 'About Nexus', icon: <FiInfo /> }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Close settings (Escape)
      if (event.key === 'Escape') {
        event.preventDefault();
        navigate('/chat');
      }
      
      // Navigate between tabs (Arrow keys)
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        let nextIndex;
        
        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        }
        
        const nextTab = tabs[nextIndex];
        handleTabClick(nextTab.id);
      }
      
      // Quick access shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleTabClick('theme');
            break;
          case '2':
            event.preventDefault();
            handleTabClick('profile');
            break;
          case '3':
            event.preventDefault();
            handleTabClick('notifications');
            break;
          case '4':
            event.preventDefault();
            handleTabClick('chatting');
            break;
          case '5':
            event.preventDefault();
            handleTabClick('privacy');
            break;
          case '6':
            event.preventDefault();
            handleTabClick('about');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, navigate]);

  const handleTabClick = (tabId) => {
    if (expandedTab === tabId) {
      // If clicking on already expanded tab, collapse it
      setExpandedTab(null);
      setActiveTab(null);
    } else {
      // Expand the clicked tab
      setExpandedTab(tabId);
      setActiveTab(tabId);
    }
  };

  const handleBackToList = () => {
    setExpandedTab(null);
    setActiveTab(null);
  };

  const handleStartGuidedSetup = () => {
    setShowGuidedSetup(true);
  };

  const handleExitGuidedSetup = () => {
    setShowGuidedSetup(false);
  };

  const handleClose = () => {
    navigate('/chat');
  };

  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'theme':
        return <ThemeSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'chatting':
        return <ChattingSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'about':
        return <AboutNexus />;
      default:
        return null;
    }
  };

  // Show guided setup if requested
  if (showGuidedSetup) {
    return <SettingsFlow onExit={handleExitGuidedSetup} />;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-header-content">
          <div className="settings-title">
            <FiSettings className="settings-icon" />
            <h1>Settings</h1>
          </div>
          <div className="settings-header-actions">
            {unreadCount > 0 && (
              <div className="notification-indicator">
                <FiBell />
                <span className="notification-count">{unreadCount}</span>
              </div>
            )}
            <button 
              className="close-settings-btn"
              onClick={handleClose}
              title="Close Settings (Esc)"
            >
              <FiX />
            </button>
          </div>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="keyboard-shortcuts-hint">
          <span>Tip: Use Ctrl+1-6 for quick access, ↑↓ to navigate, Esc to close</span>
        </div>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          {!expandedTab ? (
            // Main settings list
            <div className="settings-list">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                  title={`${tab.label} (Ctrl+${index + 1})`}
                >
                  <div className="tab-content">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  <div className="tab-shortcut">
                    Ctrl+{index + 1}
                  </div>
                  <FiChevronRight className="tab-arrow" />
                </button>
              ))}
              
              <div className="settings-divider"></div>
              
              <button 
                className="settings-tab guided-setup-tab"
                onClick={handleStartGuidedSetup}
              >
                <div className="tab-content">
                  <FiNavigation />
                  <span>Guided Setup</span>
                </div>
                <FiChevronRight className="tab-arrow" />
              </button>
            </div>
          ) : (
            // Expanded tab content within sidebar
            <div className="expanded-tab-content">
              <div className="expanded-tab-header">
                <button className="back-btn" onClick={handleBackToList}>
                  <FiArrowLeft />
                </button>
                <div className="expanded-tab-info">
                  {tabs.find(tab => tab.id === expandedTab)?.icon}
                  <span>{tabs.find(tab => tab.id === expandedTab)?.label}</span>
                </div>
              </div>
              <div className="expanded-tab-body">
                {renderTabContent(expandedTab)}
              </div>
            </div>
          )}
        </div>
        
        <div className="settings-main">
          {!expandedTab ? (
            <div className="settings-welcome">
              <div className="welcome-content">
                <FiSettings className="welcome-icon" />
                <h2>Settings</h2>
                <p>Configure your Nexus ChatApp experience with professional-grade customization options.</p>
                
                <div className="settings-stats">
                  <div className="stat-item">
                    <div className="stat-number">{tabs.length}</div>
                    <div className="stat-label">Setting Categories</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{unreadCount}</div>
                    <div className="stat-label">Notifications</div>
                  </div>
                </div>
                
                <div className="guided-setup-prompt">
                  <button 
                    className="btn btn-primary guided-setup-btn"
                    onClick={handleStartGuidedSetup}
                  >
                    <FiNavigation />
                    Start Guided Setup
                  </button>
                  <p className="guided-setup-description">
                    Let us walk you through configuring your preferences step by step
                  </p>
                </div>
                
                <div className="settings-overview">
                  <div className="overview-grid">
                    {tabs.map((tab, index) => (
                      <div 
                        key={tab.id}
                        className="overview-item"
                        onClick={() => handleTabClick(tab.id)}
                      >
                        <div className="overview-icon">
                          {tab.icon}
                        </div>
                        <div className="overview-content">
                          <span className="overview-title">{tab.label}</span>
                          <span className="overview-shortcut">Ctrl+{index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="settings-main-content">
              <div className="settings-main-header">
                <h2>{tabs.find(tab => tab.id === expandedTab)?.label}</h2>
                <p>Configure your {tabs.find(tab => tab.id === expandedTab)?.label.toLowerCase()} preferences</p>
              </div>
              {renderTabContent(expandedTab)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
import React, { useState } from 'react';
import { FiSettings, FiDroplet, FiUser, FiBell, FiShield, FiInfo } from 'react-icons/fi';
import ThemeSettings from './ThemeSettings';
import AboutNexus from './AboutNexus';
import PrivacySettings from './PrivacySettings';
import './SettingsPage.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('theme');

  const tabs = [
    { id: 'theme', label: 'Theme & Appearance', icon: <FiDroplet /> },
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <FiShield /> },
    { id: 'about', label: 'About Nexus', icon: <FiInfo /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theme':
        return <ThemeSettings />;
      case 'profile':
        return (
          <div className="settings-content">
            <h3>Profile Settings</h3>
            <p>Profile settings will be implemented here.</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="settings-content">
            <h3>Notification Settings</h3>
            <p>Notification settings will be implemented here.</p>
          </div>
        );
      case 'privacy':
        return <PrivacySettings />;
      case 'about':
        return <AboutNexus />;
      default:
        return <ThemeSettings />;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <FiSettings className="settings-icon" />
        <h1>Settings</h1>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="settings-main">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
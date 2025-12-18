import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiBell, FiLock, FiShield, FiInfo, FiLogOut, FiChevronRight } from 'react-icons/fi';
import ProfilePage from '../Profile/ProfilePage';
import AboutPage from '../About/AboutPage';
import './Settings.css';

const SettingsPage = ({ onClose }) => {
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [notifications, setNotifications] = useState({
    messages: true,
    calls: true,
    groups: true,
    mentions: true,
    desktop: true,
    sound: true
  });

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (activeSection === 'profile') {
    return <ProfilePage onClose={() => setActiveSection(null)} />;
  }

  if (activeSection === 'about') {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <button className="btn btn-secondary" onClick={() => setActiveSection(null)}>
            ← Back
          </button>
        </div>
        <AboutPage />
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-content">
        {/* Account Section */}
        <div className="settings-section">
          <h3 className="settings-section-title">Account</h3>
          
          <div className="settings-item" onClick={() => setActiveSection('profile')}>
            <div className="settings-item-icon">
              <FiUser />
            </div>
            <div className="settings-item-content">
              <h4>Profile</h4>
              <p>Update your profile information</p>
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiLock />
            </div>
            <div className="settings-item-content">
              <h4>Privacy</h4>
              <p>Control who can see your information</p>
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiShield />
            </div>
            <div className="settings-item-content">
              <h4>Security</h4>
              <p>Password and security settings</p>
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h3 className="settings-section-title">Notifications</h3>
          
          <div className="settings-item">
            <div className="settings-item-icon">
              <FiBell />
            </div>
            <div className="settings-item-content">
              <h4>Message Notifications</h4>
              <p>Get notified about new messages</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.messages}
                onChange={() => toggleNotification('messages')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiBell />
            </div>
            <div className="settings-item-content">
              <h4>Call Notifications</h4>
              <p>Get notified about incoming calls</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.calls}
                onChange={() => toggleNotification('calls')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiBell />
            </div>
            <div className="settings-item-content">
              <h4>Group Notifications</h4>
              <p>Get notified about group activities</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.groups}
                onChange={() => toggleNotification('groups')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiBell />
            </div>
            <div className="settings-item-content">
              <h4>Mention Notifications</h4>
              <p>Get notified when someone mentions you</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.mentions}
                onChange={() => toggleNotification('mentions')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiBell />
            </div>
            <div className="settings-item-content">
              <h4>Desktop Notifications</h4>
              <p>Show desktop notifications</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.desktop}
                onChange={() => toggleNotification('desktop')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiBell />
            </div>
            <div className="settings-item-content">
              <h4>Notification Sound</h4>
              <p>Play sound for notifications</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.sound}
                onChange={() => toggleNotification('sound')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* About Section */}
        <div className="settings-section">
          <h3 className="settings-section-title">About</h3>
          
          <div className="settings-item" onClick={() => setActiveSection('about')}>
            <div className="settings-item-icon">
              <FiInfo />
            </div>
            <div className="settings-item-content">
              <h4>About</h4>
              <p>App version and information</p>
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiInfo />
            </div>
            <div className="settings-item-content">
              <h4>Terms of Service</h4>
              <p>Read our terms and conditions</p>
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <FiInfo />
            </div>
            <div className="settings-item-content">
              <h4>Privacy Policy</h4>
              <p>Read our privacy policy</p>
            </div>
            <FiChevronRight className="settings-item-arrow" />
          </div>
        </div>

        {/* Logout Section */}
        <div className="settings-section">
          <div className="settings-item logout-item" onClick={handleLogout}>
            <div className="settings-item-icon logout-icon">
              <FiLogOut />
            </div>
            <div className="settings-item-content">
              <h4>Logout</h4>
              <p>Sign out of your account</p>
            </div>
          </div>
        </div>

        {/* User Info Footer */}
        <div className="settings-footer">
          <p>Logged in as <strong>{user?.email}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

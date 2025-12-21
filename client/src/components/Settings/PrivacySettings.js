import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  FiShield, FiLock, FiEye, FiEyeOff, FiKey, FiSmartphone, 
  FiGlobe, FiUserCheck, FiAlertTriangle, FiTrash2, FiDownload,
  FiUpload, FiRefreshCw, FiCheck, FiX
} from 'react-icons/fi';
import './PrivacySettings.css';

const PrivacySettings = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'contacts', // public, contacts, nobody
    lastSeenVisibility: 'contacts',
    readReceiptsEnabled: true,
    typingIndicatorEnabled: true,
    onlineStatusVisible: true,
    phoneNumberVisible: false,
    emailVisible: false,
    allowGroupInvites: 'contacts',
    allowDirectMessages: 'everyone',
    blockUnknownContacts: false,
    autoDeleteMessages: 'never', // never, 24h, 7d, 30d
    dataBackupEnabled: true,
    analyticsEnabled: false
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: '30d',
    deviceManagement: true,
    encryptionEnabled: true,
    secureConnectionOnly: true,
    passwordStrength: 'strong',
    loginAttempts: 3,
    accountLockDuration: '15m'
  });

  // Active Sessions State
  const [activeSessions] = useState([
    {
      id: '1',
      device: 'Windows PC',
      browser: 'Chrome 120.0',
      location: 'New York, US',
      lastActive: '2 minutes ago',
      current: true,
      ip: '192.168.1.100'
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari Mobile',
      location: 'New York, US',
      lastActive: '1 hour ago',
      current: false,
      ip: '192.168.1.101'
    },
    {
      id: '3',
      device: 'Android Phone',
      browser: 'Chrome Mobile',
      location: 'California, US',
      lastActive: '2 days ago',
      current: false,
      ip: '10.0.0.50'
    }
  ]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    addNotification({
      type: 'success',
      title: 'Privacy Setting Updated',
      message: `${setting} has been updated successfully`
    });
  };

  const handleSecurityChange = (setting, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    addNotification({
      type: 'success',
      title: 'Security Setting Updated',
      message: `${setting} has been updated successfully`
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New passwords do not match'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      addNotification({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Simulate password change
    addNotification({
      type: 'success',
      title: 'Password Changed',
      message: 'Your password has been updated successfully'
    });
    
    setShowChangePassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleTerminateSession = (sessionId) => {
    addNotification({
      type: 'success',
      title: 'Session Terminated',
      message: 'Device session has been terminated successfully'
    });
  };

  const handleExportData = () => {
    addNotification({
      type: 'info',
      title: 'Data Export Started',
      message: 'Your data export will be ready for download shortly'
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      addNotification({
        type: 'warning',
        title: 'Account Deletion',
        message: 'Account deletion process has been initiated'
      });
    }
  };

  return (
    <div className="privacy-settings">
      {/* Privacy Section */}
      <div className="settings-section">
        <div className="section-header">
          <FiEye className="section-icon" />
          <h3>Privacy Settings</h3>
        </div>

        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Profile Visibility</h4>
              <p>Who can see your profile information</p>
            </div>
            <select 
              value={privacySettings.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              className="setting-select"
            >
              <option value="public">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Last Seen</h4>
              <p>Who can see when you were last online</p>
            </div>
            <select 
              value={privacySettings.lastSeenVisibility}
              onChange={(e) => handlePrivacyChange('lastSeenVisibility', e.target.value)}
              className="setting-select"
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Read Receipts</h4>
              <p>Send read receipts to message senders</p>
            </div>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={privacySettings.readReceiptsEnabled}
                onChange={(e) => handlePrivacyChange('readReceiptsEnabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Typing Indicator</h4>
              <p>Show when you're typing a message</p>
            </div>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={privacySettings.typingIndicatorEnabled}
                onChange={(e) => handlePrivacyChange('typingIndicatorEnabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Auto-Delete Messages</h4>
              <p>Automatically delete messages after a period</p>
            </div>
            <select 
              value={privacySettings.autoDeleteMessages}
              onChange={(e) => handlePrivacyChange('autoDeleteMessages', e.target.value)}
              className="setting-select"
            >
              <option value="never">Never</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="settings-section">
        <div className="section-header">
          <FiShield className="section-icon" />
          <h3>Security Settings</h3>
        </div>

        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
            </div>
            <button 
              className={`setting-btn ${securitySettings.twoFactorEnabled ? 'enabled' : 'disabled'}`}
              onClick={() => handleSecurityChange('twoFactorEnabled', !securitySettings.twoFactorEnabled)}
            >
              {securitySettings.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Login Notifications</h4>
              <p>Get notified when someone logs into your account</p>
            </div>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={securitySettings.loginNotifications}
                onChange={(e) => handleSecurityChange('loginNotifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Session Timeout</h4>
              <p>Automatically log out after inactivity</p>
            </div>
            <select 
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
              className="setting-select"
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>End-to-End Encryption</h4>
              <p>Encrypt all your messages and calls</p>
            </div>
            <div className="setting-status enabled">
              <FiCheck /> Enabled
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <div className="section-header">
          <FiKey className="section-icon" />
          <h3>Password & Authentication</h3>
        </div>

        <div className="password-section">
          {!showChangePassword ? (
            <button 
              className="setting-btn primary"
              onClick={() => setShowChangePassword(true)}
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                  className="input"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                  className="input"
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                  className="input"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowChangePassword(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="settings-section">
        <div className="section-header">
          <FiSmartphone className="section-icon" />
          <h3>Active Sessions</h3>
        </div>

        <div className="sessions-list">
          {activeSessions.map(session => (
            <div key={session.id} className={`session-item ${session.current ? 'current' : ''}`}>
              <div className="session-info">
                <div className="session-device">
                  <FiSmartphone />
                  <div>
                    <h4>{session.device}</h4>
                    <p>{session.browser}</p>
                  </div>
                </div>
                <div className="session-details">
                  <span className="session-location">
                    <FiGlobe /> {session.location}
                  </span>
                  <span className="session-time">{session.lastActive}</span>
                  <span className="session-ip">IP: {session.ip}</span>
                </div>
              </div>
              {!session.current && (
                <button 
                  className="terminate-btn"
                  onClick={() => handleTerminateSession(session.id)}
                >
                  <FiX /> Terminate
                </button>
              )}
              {session.current && (
                <span className="current-badge">Current Session</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <div className="section-header">
          <FiDownload className="section-icon" />
          <h3>Data Management</h3>
        </div>

        <div className="data-actions">
          <button className="setting-btn secondary" onClick={handleExportData}>
            <FiDownload /> Export My Data
          </button>
          <button className="setting-btn danger" onClick={handleDeleteAccount}>
            <FiTrash2 /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
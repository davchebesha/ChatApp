import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    dateOfBirth: user?.dateOfBirth || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      dateOfBirth: user?.dateOfBirth || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-settings">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt="Profile"
              className="profile-avatar"
            />
            <button className="avatar-edit-btn">
              <FiEdit3 />
            </button>
          </div>
          <div className="profile-basic-info">
            <h2>{user?.username}</h2>
            <p className="profile-status">{user?.status || 'Available'}</p>
            <span className="profile-joined">
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
            </span>
          </div>
        </div>
        
        <div className="profile-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <FiEdit3 /> Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={loading}
              >
                <FiSave /> {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <FiX /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <FiUser className="form-icon" />
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter username"
                />
              ) : (
                <div className="form-value">{user?.username || 'Not set'}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                <FiMail className="form-icon" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter email"
                />
              ) : (
                <div className="form-value">{user?.email || 'Not set'}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <FiPhone className="form-icon" />
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="form-value">{user?.phone || 'Not set'}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                <FiMapPin className="form-icon" />
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter location"
                />
              ) : (
                <div className="form-value">{user?.location || 'Not set'}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>
              <FiCalendar className="form-icon" />
              Date of Birth
            </label>
            {isEditing ? (
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="input"
              />
            ) : (
              <div className="form-value">
                {user?.dateOfBirth 
                  ? new Date(user.dateOfBirth).toLocaleDateString()
                  : 'Not set'
                }
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="input textarea"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            ) : (
              <div className="form-value bio-value">
                {user?.bio || 'No bio added yet'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
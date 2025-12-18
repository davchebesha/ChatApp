import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiCamera, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const ProfilePage = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    status: user?.status || 'online'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      updateUser({ avatar: response.data.avatar });
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile', formData);
      updateUser(response.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      status: user?.status || 'online'
    });
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        {onClose && (
          <button className="icon-btn" onClick={onClose}>
            <FiX />
          </button>
        )}
      </div>

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <img 
              src={user?.avatar || '/default-avatar.png'} 
              alt="Avatar" 
              className="profile-avatar"
            />
            <label className="avatar-upload-btn" htmlFor="avatar-upload">
              <FiCamera />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </label>
          </div>
          <p className="avatar-hint">Click camera icon to change avatar</p>
        </div>

        {/* Profile Form */}
        <div className="profile-form">
          <div className="form-group">
            <label>Username</label>
            {editing ? (
              <input
                type="text"
                name="username"
                className="input"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
            ) : (
              <p className="profile-value">{user?.username}</p>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            <p className="profile-value">{user?.email}</p>
            <small className="form-hint">Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Bio</label>
            {editing ? (
              <textarea
                name="bio"
                className="input"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                disabled={loading}
              />
            ) : (
              <p className="profile-value">{user?.bio || 'No bio yet'}</p>
            )}
          </div>

          <div className="form-group">
            <label>Status</label>
            {editing ? (
              <select
                name="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            ) : (
              <p className="profile-value">
                <span className={`status-badge status-${user?.status}`}>
                  {user?.status}
                </span>
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Member Since</label>
            <p className="profile-value">
              {new Date(user?.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {editing ? (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <FiX /> Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={loading}
                >
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => setEditing(true)}
              >
                <FiEdit2 /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RouteDebug = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f0f0', 
      margin: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <h3>🔍 Route Debug Info</h3>
      <p><strong>Current Path:</strong> {location.pathname}</p>
      <p><strong>Auth Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>User Logged In:</strong> {user ? 'Yes' : 'No'}</p>
      {user && <p><strong>User:</strong> {user.username} ({user.email})</p>}
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => navigate('/login')}
          style={{ margin: '5px', padding: '10px' }}
        >
          Go to Login
        </button>
        <button 
          onClick={() => navigate('/register')}
          style={{ margin: '5px', padding: '10px' }}
        >
          Go to Register
        </button>
        <button 
          onClick={() => navigate('/chat')}
          style={{ margin: '5px', padding: '10px' }}
        >
          Go to Chat
        </button>
        <button 
          onClick={() => navigate('/')}
          style={{ margin: '5px', padding: '10px' }}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default RouteDebug;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('demo@nexuschat.com'); // Pre-filled for testing
  const [password, setPassword] = useState('demo123'); // Pre-filled for testing
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔐 Login: Form submitted', { email, password: '***' });
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Login: Calling login function');
      const result = await login(email, password);
      console.log('🔐 Login: Result received', result);
      
      if (!result.success) {
        console.error('❌ Login: Login failed', result.message);
        // Error toast is already shown in AuthContext
      } else {
        console.log('✅ Login: Login successful');
        // Success toast is already shown in AuthContext
      }
    } catch (error) {
      console.error('🚨 Login: Unexpected error', error);
      toast.error('An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Quick login button for testing
  const quickLogin = async () => {
    console.log('⚡ Login: Quick login triggered');
    setLoading(true);
    
    try {
      const result = await login('demo@nexuschat.com', 'demo123');
      console.log('⚡ Login: Quick login result', result);
    } catch (error) {
      console.error('🚨 Login: Quick login error', error);
      toast.error('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Nexus ChatApp</h1>
          <p>Welcome back! Please sign in to your account.</p>
        </div>
        
        <h2>Sign In</h2>
        
        {/* Quick Test Button */}
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={quickLogin}
            disabled={loading}
            style={{
              background: '#059669',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}
          >
            ⚡ Quick Test Login
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block login-button" 
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
        
        {/* Debug Info */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#f8fafc', 
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <strong>Debug Info:</strong><br/>
          Server: http://localhost:5001<br/>
          Demo User: demo@nexuschat.com / demo123<br/>
          Check browser console (F12) for detailed logs
        </div>
      </div>
    </div>
  );
};

export default Login;

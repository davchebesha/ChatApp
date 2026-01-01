import React, { useState, useEffect } from 'react';

const SimpleAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('demo@nexuschat.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    // Check if already logged in
    console.log('useEffect: Checking localStorage...');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    console.log('useEffect: Token exists:', !!token);
    console.log('useEffect: User data exists:', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('useEffect: Setting logged in state with user:', parsedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('useEffect: Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Add global fetch interceptor to debug all API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      console.log('🌐 Fetch intercepted:', args[0], args[1]);
      return originalFetch.apply(this, args)
        .then(response => {
          console.log('🌐 Fetch response:', args[0], response.status);
          return response;
        })
        .catch(error => {
          console.error('🌐 Fetch error:', args[0], error);
          throw error;
        });
    };

    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setMessage('🔄 Attempting login...');
    
    try {
      console.log('Making login request to http://localhost:5001/api/auth/login');
      
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setMessage(`❌ Login failed: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Login successful:', data);

      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update state
      console.log('Setting user state:', data.user);
      setUser(data.user);
      console.log('Setting isLoggedIn to true');
      setIsLoggedIn(true);
      setMessage('✅ Login successful!');
      
      // Debug: Check what's in localStorage
      console.log('Token in localStorage:', localStorage.getItem('token'));
      console.log('User in localStorage:', localStorage.getItem('user'));
      
    } catch (error) {
      console.error('Network error:', error);
      setMessage(`🚨 Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setMessage('Logged out successfully');
  };

  const handleRegister = async () => {
    if (!username || !regEmail || !regPassword) {
      setMessage('❌ Please fill in all registration fields');
      return;
    }
    
    setLoading(true);
    setMessage('🔄 Creating account...');
    
    try {
      console.log('Making registration request');
      
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email: regEmail, password: regPassword }),
      });

      console.log('Registration response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration error response:', errorText);
        setMessage(`❌ Registration failed: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Registration successful:', data);

      // Store in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update state
      setUser(data.user);
      setIsLoggedIn(true);
      setMessage('✅ Registration successful!');
      
    } catch (error) {
      console.error('Registration network error:', error);
      setMessage(`🚨 Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testServerConnection = async () => {
    setMessage('🔄 Testing server connection...');
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      });
      
      if (response.status === 401) {
        setMessage('✅ Server is responding! (Got expected 401 error)');
      } else {
        setMessage(`✅ Server responded with status: ${response.status}`);
      }
    } catch (error) {
      setMessage(`❌ Server connection failed: ${error.message}`);
    }
  };

  const testAuthenticatedEndpoint = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('❌ No token found. Please login first.');
      return;
    }

    setMessage('🔄 Testing authenticated endpoint...');
    try {
      const response = await fetch('http://localhost:5001/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Auth test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth test successful:', data);
        setMessage('✅ Authentication working correctly!');
      } else {
        const errorText = await response.text();
        console.error('Auth test failed:', errorText);
        setMessage(`❌ Auth test failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Auth test network error:', error);
      setMessage(`🚨 Auth test network error: ${error.message}`);
    }
  };

  console.log('SimpleAuth render - isLoggedIn:', isLoggedIn, 'user:', user);

  if (isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '600px',
          width: '90%'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            color: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            marginBottom: '2rem'
          }}>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '2.5rem' }}>
              🎉 Welcome to NexusChat!
            </h1>
            <p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
              Professional Chat Application
            </p>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: '2rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#2563eb', marginBottom: '1rem' }}>
              ✅ Authentication Successful
            </h2>
            <div style={{ textAlign: 'left', color: '#475569' }}>
              <p><strong>👤 Username:</strong> {user?.username}</p>
              <p><strong>📧 Email:</strong> {user?.email}</p>
              <p><strong>🆔 User ID:</strong> {user?.id}</p>
              <p><strong>⏰ Login Time:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: '#059669', marginBottom: '1rem' }}>
              🚀 Ready to Chat!
            </h3>
            <p style={{ color: '#047857', margin: '0' }}>
              Your authentication is complete. The chat application is ready to use with all features enabled.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={testAuthenticatedEndpoint}
              style={{
                background: '#059669',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🔐 Test Auth
            </button>
            <button 
              onClick={handleLogout}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🚪 Logout
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#2563eb',
                color: 'white',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            🚀 NexusChat
          </h1>
          <p style={{ margin: '0', opacity: '0.9' }}>
            Professional Chat Application
          </p>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={testServerConnection}
            style={{
              background: '#059669',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              width: '100%',
              marginBottom: '1rem'
            }}
          >
            🔗 Test Server Connection
          </button>
        </div>

        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button 
            onClick={() => setShowRegister(!showRegister)}
            style={{
              background: 'transparent',
              color: '#2563eb',
              padding: '0.5rem 1rem',
              border: '2px solid #2563eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              width: '100%',
              marginBottom: '1rem',
              fontWeight: 'bold'
            }}
          >
            {showRegister ? '🔐 Switch to Login' : '📝 Switch to Register'}
          </button>
        </div>

        {showRegister ? (
          // Registration Form
          <div>
            <h2 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '1.5rem' }}>
              📝 Create Account
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              onClick={handleRegister}
              disabled={loading}
              style={{
                background: loading ? '#94a3b8' : '#059669',
                color: 'white',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                width: '100%',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Creating Account...' : '✨ Create Account'}
            </button>
          </div>
        ) : (
          // Login Form
          <div>
            <h2 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '1.5rem' }}>
              🔐 Login
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              onClick={handleLogin}
              disabled={loading}
              style={{
                background: loading ? '#94a3b8' : '#2563eb',
                color: 'white',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                width: '100%',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Logging in...' : '🚀 Login'}
            </button>
          </div>
        )}

        {message && (
          <div style={{
            padding: '1rem',
            background: message.includes('✅') ? '#ecfdf5' : message.includes('❌') || message.includes('🚨') ? '#fef2f2' : '#eff6ff',
            color: message.includes('✅') ? '#059669' : message.includes('❌') || message.includes('🚨') ? '#dc2626' : '#2563eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            border: `2px solid ${message.includes('✅') ? '#10b981' : message.includes('❌') || message.includes('🚨') ? '#ef4444' : '#3b82f6'}`
          }}>
            {message}
          </div>
        )}

        <div style={{
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#64748b',
          border: '1px solid #e2e8f0'
        }}>
          <strong>🔧 Debug Info:</strong><br/>
          Server: http://localhost:5001<br/>
          Demo User: demo@nexuschat.com / demo123<br/>
          Open browser console (F12) for detailed logs
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;
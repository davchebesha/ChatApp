import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();

  const testLogin = async () => {
    setLoading(true);
    setTestResult('Testing login...');
    
    try {
      const result = await login('demo@nexuschat.com', 'demo123');
      setTestResult(`Login result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`Login error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testRegister = async () => {
    setLoading(true);
    setTestResult('Testing registration...');
    
    try {
      const result = await register('testuser', 'test@example.com', 'password123');
      setTestResult(`Register result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`Register error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testAPI = async () => {
    setLoading(true);
    setTestResult('Testing API connection...');
    
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'demo@nexuschat.com', password: 'demo123' }),
      });
      
      const data = await response.json();
      setTestResult(`API test result: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`API test error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Authentication Debug Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current User:</h3>
        <pre>{user ? JSON.stringify(user, null, 2) : 'No user logged in'}</pre>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={testLogin} disabled={loading}>
          Test Login
        </button>
        <button onClick={testRegister} disabled={loading}>
          Test Register
        </button>
        <button onClick={testAPI} disabled={loading}>
          Test API Direct
        </button>
      </div>
      
      <div>
        <h3>Test Result:</h3>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {testResult || 'No test run yet'}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Environment Info:</h3>
        <ul>
          <li>Current URL: {window.location.href}</li>
          <li>API URL: http://localhost:5001</li>
          <li>User Agent: {navigator.userAgent}</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthTest;
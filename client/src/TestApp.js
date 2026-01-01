import React from 'react';

function TestApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#333333',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '1rem' }}>
        🚀 NexusChat Test Page
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        If you can see this, the React app is working!
      </p>
      
      <div style={{
        background: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ color: '#1d4ed8', marginBottom: '1rem' }}>✅ Status Check</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ React is running</li>
          <li>✅ CSS is loading</li>
          <li>✅ Components are rendering</li>
          <li>✅ Styles are working</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => alert('Button works!')}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default TestApp;
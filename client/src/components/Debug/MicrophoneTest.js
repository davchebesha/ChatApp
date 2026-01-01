import React, { useState } from 'react';
import { FiMic, FiMicOff, FiPlay, FiStopCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MicrophoneTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResults, setTestResults] = useState([]);
  
  const mediaRecorderRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const audioRef = React.useRef(null);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date() }]);
  };

  const testMicrophonePermission = async () => {
    addTestResult('Permission Check', 'testing', 'Requesting microphone permission...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      streamRef.current = stream;
      addTestResult('Permission Check', 'success', 'Microphone permission granted');
      toast.success('Microphone permission granted!');
      return true;
    } catch (error) {
      setHasPermission(false);
      let errorDetails = `${error.name}: ${error.message}`;
      
      if (error.name === 'NotAllowedError') {
        errorDetails = 'User denied microphone permission';
      } else if (error.name === 'NotFoundError') {
        errorDetails = 'No microphone device found';
      } else if (error.name === 'NotReadableError') {
        errorDetails = 'Microphone is being used by another application';
      }
      
      addTestResult('Permission Check', 'error', errorDetails);
      toast.error('Microphone permission denied: ' + errorDetails);
      return false;
    }
  };

  const testRecording = async () => {
    if (!streamRef.current) {
      const hasPermission = await testMicrophonePermission();
      if (!hasPermission) return;
    }

    addTestResult('Recording Test', 'testing', 'Starting recording test...');
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        addTestResult('Recording Test', 'success', `Recording created: ${blob.size} bytes`);
        toast.success('Recording test successful!');
      };

      mediaRecorder.onerror = (event) => {
        addTestResult('Recording Test', 'error', `MediaRecorder error: ${event.error}`);
        toast.error('Recording failed: ' + event.error);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 3000);
      
    } catch (error) {
      addTestResult('Recording Test', 'error', `Failed to start recording: ${error.message}`);
      toast.error('Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const runFullTest = async () => {
    setTestResults([]);
    
    // Test 1: Browser Support
    addTestResult('Browser Support', 'testing', 'Checking browser capabilities...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addTestResult('Browser Support', 'error', 'getUserMedia not supported');
      return;
    }
    
    if (!window.MediaRecorder) {
      addTestResult('Browser Support', 'error', 'MediaRecorder not supported');
      return;
    }
    
    addTestResult('Browser Support', 'success', 'All required APIs supported');
    
    // Test 2: HTTPS Check
    addTestResult('Security Check', 'testing', 'Checking connection security...');
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      addTestResult('Security Check', 'warning', 'HTTPS required for microphone access in production');
    } else {
      addTestResult('Security Check', 'success', 'Secure connection verified');
    }
    
    // Test 3: Permission
    const hasPermission = await testMicrophonePermission();
    if (!hasPermission) return;
    
    // Test 4: Recording
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
    await testRecording();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setHasPermission(null);
    setIsRecording(false);
    setIsPlaying(false);
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'success': return <FiCheckCircle style={{ color: '#10b981' }} />;
      case 'error': return <FiXCircle style={{ color: '#ef4444' }} />;
      case 'warning': return <FiXCircle style={{ color: '#f59e0b' }} />;
      default: return <div className="spinner" />;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🎤 Microphone Test Tool</h2>
      <p>Use this tool to diagnose microphone permission and recording issues.</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={runFullTest}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Run Full Test
        </button>
        
        <button 
          onClick={testMicrophonePermission}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Test Permission
        </button>
        
        <button 
          onClick={isRecording ? stopRecording : testRecording}
          disabled={!hasPermission}
          style={{
            background: isRecording ? '#ef4444' : '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: hasPermission ? 'pointer' : 'not-allowed',
            opacity: hasPermission ? 1 : 0.5
          }}
        >
          {isRecording ? <><FiStopCircle /> Stop Recording</> : <><FiMic /> Test Recording</>}
        </button>
        
        {audioUrl && (
          <button 
            onClick={playRecording}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <><FiStopCircle /> Stop</> : <><FiPlay /> Play Recording</>}
          </button>
        )}
        
        <button 
          onClick={cleanup}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cleanup
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results:</h3>
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '16px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {testResults.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No tests run yet</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '8px',
                padding: '8px',
                background: 'white',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                {getResultIcon(result.result)}
                <div style={{ flex: 1 }}>
                  <strong>{result.test}:</strong> {result.details}
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Browser Information:</h3>
        <ul style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
          <li><strong>User Agent:</strong> {navigator.userAgent}</li>
          <li><strong>Protocol:</strong> {window.location.protocol}</li>
          <li><strong>Host:</strong> {window.location.host}</li>
          <li><strong>getUserMedia Support:</strong> {navigator.mediaDevices ? '✅' : '❌'}</li>
          <li><strong>MediaRecorder Support:</strong> {window.MediaRecorder ? '✅' : '❌'}</li>
          <li><strong>Permissions API:</strong> {navigator.permissions ? '✅' : '❌'}</li>
        </ul>
      </div>
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
      
      <style jsx>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MicrophoneTest;
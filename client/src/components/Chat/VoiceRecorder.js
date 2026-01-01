import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiMicOff, FiPlay, FiPause, FiSend, FiX, FiTrash2, FiAlertCircle, FiSkipForward, FiArrowLeft, FiHome, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import MicrophonePermissionGuide from './MicrophonePermissionGuide';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onSendVoice, onCancel, isVisible }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('main'); // main, permission, guide, recording, preview
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      setCurrentScreen('main');
      initializeRecorder();
    } else {
      cleanup();
    }
    
    return () => cleanup();
  }, [isVisible]);

  const cleanup = () => {
    console.log('🧹 VoiceRecorder: Cleaning up resources');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 VoiceRecorder: Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // Reset states
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    setRecordingTime(0);
    setPermissionError(null);
    setIsInitializing(false);
    setCurrentScreen('main');
  };

  // Enhanced navigation functions
  const goBack = () => {
    if (currentScreen === 'guide') {
      setCurrentScreen('permission');
      setShowPermissionGuide(false);
    } else if (currentScreen === 'permission') {
      setCurrentScreen('main');
      setPermissionError(null);
    } else if (currentScreen === 'preview') {
      setCurrentScreen('recording');
    } else if (currentScreen === 'recording') {
      setCurrentScreen('main');
      stopRecording();
    }
  };

  const skipToRecording = () => {
    setCurrentScreen('recording');
    setPermissionError(null);
    setShowPermissionGuide(false);
    initializeRecorder();
  };

  const exitCompletely = () => {
    cleanup();
    onCancel();
  };

  const initializeRecorder = async () => {
    console.log('🎤 VoiceRecorder: Initializing recorder');
    setIsInitializing(true);
    setPermissionError(null);
    
    try {
      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.');
      }
      
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in your browser. Please update your browser.');
      }

      // Check if we're on HTTPS or localhost (required for microphone access)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Microphone access requires HTTPS or localhost. Please use a secure connection.');
      }
      
      console.log('🔍 VoiceRecorder: Requesting microphone permission');
      
      // First, check current permission state
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          console.log('🔍 VoiceRecorder: Current permission state:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            throw new Error('PERMISSION_PERMANENTLY_DENIED');
          }
        } catch (permError) {
          console.warn('⚠️ VoiceRecorder: Could not check permission state:', permError);
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      console.log('✅ VoiceRecorder: Microphone permission granted');
      streamRef.current = stream;
      setCurrentScreen('recording');
      
      // Setup audio analysis for waveform
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        console.log('🎵 VoiceRecorder: Audio analysis setup complete');
      } catch (audioError) {
        console.warn('⚠️ VoiceRecorder: Audio analysis setup failed:', audioError);
        // Continue without waveform visualization
      }
      
      // Start recording immediately
      await startRecording();
      
    } catch (error) {
      console.error('❌ VoiceRecorder: Initialization failed:', error);
      
      let errorMessage = 'Could not access microphone';
      let isPermissionError = false;
      
      if (error.name === 'NotAllowedError' || error.message === 'PERMISSION_PERMANENTLY_DENIED') {
        errorMessage = 'Microphone permission denied';
        isPermissionError = true;
        setCurrentScreen('permission');
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
        setCurrentScreen('permission');
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps using the microphone.';
        setCurrentScreen('permission');
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone does not meet the required specifications. Please try with a different microphone.';
        setCurrentScreen('permission');
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked by browser security settings.';
        setCurrentScreen('permission');
      } else if (error.message) {
        errorMessage = error.message;
        setCurrentScreen('permission');
      }
      
      setPermissionError({ message: errorMessage, isPermissionError });
      toast.error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      console.error('❌ VoiceRecorder: No stream available for recording');
      return;
    }
    
    try {
      console.log('🎙️ VoiceRecorder: Starting recording');
      
      // Check MediaRecorder support for different formats
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      console.log('🎵 VoiceRecorder: Using MIME type:', mimeType || 'browser default');
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType || undefined
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 VoiceRecorder: Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('⏹️ VoiceRecorder: Recording stopped, creating blob');
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setCurrentScreen('preview');
        console.log('✅ VoiceRecorder: Audio blob created:', blob.size, 'bytes');
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ VoiceRecorder: MediaRecorder error:', event.error);
        toast.error('Recording error occurred');
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          console.log('⏱️ VoiceRecorder: Recording time:', newTime);
          return newTime;
        });
      }, 1000);
      
      // Start waveform visualization
      if (analyserRef.current) {
        drawWaveform();
      }
      
      console.log('✅ VoiceRecorder: Recording started successfully');
      
    } catch (error) {
      console.error('❌ VoiceRecorder: Failed to start recording:', error);
      toast.error('Failed to start recording');
      setPermissionError('Failed to start recording: ' + error.message);
      setCurrentScreen('permission');
    }
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording && !isPaused) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const pauseRecording = () => {
    console.log('⏸️ VoiceRecorder: Pausing recording');
    if (mediaRecorderRef.current && isRecording && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    console.log('▶️ VoiceRecorder: Resuming recording');
    if (mediaRecorderRef.current && isPaused && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    console.log('⏹️ VoiceRecorder: Stopping recording');
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(intervalRef.current);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const playRecording = () => {
    console.log('🔊 VoiceRecorder: Playing recording');
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

  const deleteRecording = () => {
    console.log('🗑️ VoiceRecorder: Deleting recording');
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setIsPlaying(false);
    setCurrentScreen('recording');
    
    // Restart recording
    initializeRecorder();
  };

  const sendVoiceMessage = () => {
    console.log('📤 VoiceRecorder: Sending voice message');
    if (audioBlob) {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: audioBlob.type
      });
      
      console.log('📤 VoiceRecorder: Voice file created:', {
        name: file.name,
        size: file.size,
        type: file.type,
        duration: recordingTime
      });
      
      onSendVoice(file, recordingTime);
      cleanup();
      toast.success('Voice message sent!');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced Navigation Header
  const renderNavigationHeader = () => (
    <div className="voice-recorder-header enhanced-header">
      <div className="header-left">
        {currentScreen !== 'main' && (
          <button className="nav-btn back-btn" onClick={goBack} title="Go Back">
            <FiArrowLeft />
            <span>Back</span>
          </button>
        )}
      </div>
      
      <div className="header-center">
        <h3>
          {currentScreen === 'main' && 'Voice Message'}
          {currentScreen === 'permission' && 'Microphone Setup'}
          {currentScreen === 'guide' && 'Permission Guide'}
          {currentScreen === 'recording' && 'Recording...'}
          {currentScreen === 'preview' && 'Preview & Send'}
        </h3>
      </div>
      
      <div className="header-right">
        {currentScreen !== 'main' && (
          <button className="nav-btn skip-btn" onClick={skipToRecording} title="Skip to Recording">
            <FiSkipForward />
            <span>Skip</span>
          </button>
        )}
        <button className="nav-btn exit-btn" onClick={exitCompletely} title="Exit Voice Recorder">
          <FiX />
        </button>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="voice-recorder-overlay">
      <div className="voice-recorder-container enhanced-container">
        {renderNavigationHeader()}
        
        <div className="voice-recorder-content">
          {/* Main Screen */}
          {currentScreen === 'main' && (
            <div className="main-screen">
              <div className="welcome-content">
                <FiMic className="main-icon" />
                <h4>Ready to Record?</h4>
                <p>Tap the button below to start recording your voice message.</p>
                <button className="start-recording-btn" onClick={initializeRecorder}>
                  <FiMic />
                  Start Recording
                </button>
              </div>
            </div>
          )}

          {/* Initializing Screen */}
          {isInitializing && currentScreen !== 'main' && (
            <div className="initializing-container">
              <div className="loading-spinner"></div>
              <p>Initializing microphone...</p>
              <div className="initializing-actions">
                <button className="secondary-btn" onClick={() => setCurrentScreen('main')}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Permission Error Screen */}
          {permissionError && currentScreen === 'permission' && (
            <div className="permission-error">
              <FiAlertCircle />
              <h4>Microphone Access Required</h4>
              <p>{permissionError.message}</p>
              
              {permissionError.isPermissionError && (
                <div className="permission-instructions">
                  <h5>Quick Fix:</h5>
                  <div className="browser-instructions">
                    <div className="instruction-step">
                      <strong>Chrome/Edge:</strong>
                      <ol>
                        <li>Click the 🔒 or 🛡️ icon in the address bar</li>
                        <li>Set "Microphone" to "Allow"</li>
                        <li>Refresh the page and try again</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="permission-actions">
                <button className="primary-btn" onClick={initializeRecorder}>
                  Try Again
                </button>
                <button className="secondary-btn" onClick={() => {
                  setShowPermissionGuide(true);
                  setCurrentScreen('guide');
                }}>
                  Show Detailed Guide
                </button>
                <button className="tertiary-btn" onClick={() => setCurrentScreen('main')}>
                  Go Back
                </button>
              </div>
            </div>
          )}
          
          {/* Recording Screen */}
          {currentScreen === 'recording' && !isInitializing && !permissionError && (
            <>
              <div className="waveform-container">
                <canvas 
                  ref={canvasRef} 
                  width="300" 
                  height="80"
                  className="waveform-canvas"
                />
              </div>
              
              <div className="recording-info">
                <div className="recording-time">
                  {formatTime(recordingTime)}
                </div>
                <div className="recording-status">
                  {isRecording && !isPaused && (
                    <span className="recording-indicator">
                      <span className="pulse"></span>
                      Recording...
                    </span>
                  )}
                  {isPaused && <span className="paused-indicator">Paused</span>}
                </div>
              </div>
              
              <div className="voice-recorder-controls">
                {isRecording && !isPaused && (
                  <>
                    <button className="control-btn pause-btn" onClick={pauseRecording}>
                      <FiPause />
                      <span>Pause</span>
                    </button>
                    <button className="control-btn stop-btn" onClick={stopRecording}>
                      <FiMicOff />
                      <span>Stop</span>
                    </button>
                  </>
                )}
                
                {isPaused && (
                  <>
                    <button className="control-btn resume-btn" onClick={resumeRecording}>
                      <FiMic />
                      <span>Resume</span>
                    </button>
                    <button className="control-btn stop-btn" onClick={stopRecording}>
                      <FiMicOff />
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Preview Screen */}
          {currentScreen === 'preview' && audioBlob && (
            <div className="preview-screen">
              <div className="preview-info">
                <FiCheckCircle className="success-icon" />
                <h4>Recording Complete!</h4>
                <div className="recording-details">
                  <span>Duration: {formatTime(recordingTime)}</span>
                  <span>Size: {(audioBlob.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              
              <div className="preview-controls">
                <button className="control-btn play-btn" onClick={playRecording}>
                  {isPlaying ? <FiPause /> : <FiPlay />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button className="control-btn delete-btn" onClick={deleteRecording}>
                  <FiTrash2 />
                  <span>Re-record</span>
                </button>
                <button className="control-btn send-btn primary" onClick={sendVoiceMessage}>
                  <FiSend />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Footer Navigation */}
        <div className="voice-recorder-footer">
          <div className="screen-indicator">
            <div className={`indicator-dot ${currentScreen === 'main' ? 'active' : ''}`}></div>
            <div className={`indicator-dot ${currentScreen === 'permission' ? 'active' : ''}`}></div>
            <div className={`indicator-dot ${currentScreen === 'recording' ? 'active' : ''}`}></div>
            <div className={`indicator-dot ${currentScreen === 'preview' ? 'active' : ''}`}></div>
          </div>
          
          <div className="footer-actions">
            <button className="footer-btn home-btn" onClick={() => setCurrentScreen('main')} title="Go to Start">
              <FiHome />
            </button>
            <button className="footer-btn exit-btn" onClick={exitCompletely} title="Exit Completely">
              <FiX />
              <span>Exit</span>
            </button>
          </div>
        </div>
        
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
        )}
      </div>
      
      {/* Microphone Permission Guide */}
      {showPermissionGuide && currentScreen === 'guide' && (
        <MicrophonePermissionGuide
          onPermissionGranted={() => {
            setShowPermissionGuide(false);
            setPermissionError(null);
            setCurrentScreen('recording');
            initializeRecorder();
          }}
          onClose={() => {
            setShowPermissionGuide(false);
            setCurrentScreen('permission');
          }}
          onSkip={() => {
            setShowPermissionGuide(false);
            setCurrentScreen('main');
          }}
        />
      )}
    </div>
  );
};

export default VoiceRecorder;
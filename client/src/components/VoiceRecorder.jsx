import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiMicOff, FiSend, FiX, FiPause, FiPlay } from 'react-icons/fi';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onSendVoiceMessage, onCancel, isOpen }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initializeRecorder();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const initializeRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check permissions.');
    }
  };

  const startRecording = () => {
    if (!mediaRecorderRef.current) {
      initializeRecorder();
      return;
    }

    try {
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob && onSendVoiceMessage) {
      const reader = new FileReader();
      reader.onload = () => {
        onSendVoiceMessage({
          audioData: reader.result,
          duration: recordingTime,
          mimeType: audioBlob.type,
          size: audioBlob.size
        });
        handleCancel();
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const handleCancel = () => {
    cleanup();
    if (onCancel) {
      onCancel();
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setError(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="voice-recorder-overlay">
      <div className="voice-recorder">
        <div className="voice-recorder-header">
          <h3>Voice Message</h3>
          <button className="close-btn" onClick={handleCancel}>
            <FiX />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={initializeRecorder} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <div className="voice-recorder-content">
            <div className="recording-visualizer">
              <div className={`mic-icon ${isRecording ? 'recording' : ''}`}>
                <FiMic />
              </div>
              
              {isRecording && (
                <div className="sound-waves">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
              )}
            </div>

            <div className="recording-info">
              <div className="recording-time">
                {formatTime(recordingTime)}
              </div>
              
              {isRecording && (
                <div className="recording-status">
                  {isPaused ? 'Paused' : 'Recording...'}
                </div>
              )}
            </div>

            {audioUrl && !isRecording && (
              <div className="audio-preview">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                <button
                  className="play-btn"
                  onClick={isPlaying ? pauseAudio : playAudio}
                >
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                
                <span className="preview-label">
                  Preview ({formatTime(recordingTime)})
                </span>
              </div>
            )}

            <div className="recording-controls">
              {!isRecording && !audioBlob && (
                <button
                  className="record-btn primary"
                  onClick={startRecording}
                  disabled={!!error}
                >
                  <FiMic />
                  Start Recording
                </button>
              )}

              {isRecording && (
                <>
                  <button
                    className="control-btn"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                  >
                    {isPaused ? <FiPlay /> : <FiPause />}
                  </button>
                  
                  <button
                    className="stop-btn"
                    onClick={stopRecording}
                  >
                    <FiMicOff />
                    Stop
                  </button>
                </>
              )}

              {audioBlob && !isRecording && (
                <div className="final-controls">
                  <button
                    className="control-btn secondary"
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                      setRecordingTime(0);
                    }}
                  >
                    Re-record
                  </button>
                  
                  <button
                    className="send-btn primary"
                    onClick={sendVoiceMessage}
                  >
                    <FiSend />
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
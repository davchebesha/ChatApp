import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiX } from 'react-icons/fi';
import Peer from 'simple-peer';
import './Chat.css';

const VideoCall = ({ chat, onClose, isVoiceOnly = false }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    startCall();

    return () => {
      endCall();
    };
  }, []);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      setPermissionError(null);

      // Request media permissions
      const constraints = {
        audio: true,
        video: isVoiceOnly ? false : true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(mediaStream);
      setIsConnecting(false);
      
      if (localVideoRef.current && !isVoiceOnly) {
        localVideoRef.current.srcObject = mediaStream;
      }

      // Get the other user
      const otherUser = chat.participants.find(p => p._id !== user.id);
      
      // Create peer connection
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: mediaStream
      });

      peer.on('signal', (data) => {
        socket.emit('call_user', {
          to: otherUser._id,
          from: user.id,
          offer: data,
          callType: isVoiceOnly ? 'voice' : 'video'
        });
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current && !isVoiceOnly) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peerRef.current = peer;

      // Listen for call acceptance
      socket.on('call_accepted', ({ answer }) => {
        peer.signal(answer);
      });

      socket.on('call_rejected', () => {
        setPermissionError('Call was rejected by the other user');
        setTimeout(() => onClose(), 2000);
      });

      socket.on('call_ended', () => {
        onClose();
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      
      // Provide specific error messages based on error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError(
          'Camera/microphone access denied. Please allow permissions in your browser:\n\n' +
          '1. Click the lock icon (🔒) in the address bar\n' +
          '2. Allow Camera and Microphone\n' +
          '3. Refresh the page and try again'
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionError(
          'No camera or microphone found. Please connect a device and try again.'
        );
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionError(
          'Camera/microphone is already in use by another application. Please close other apps and try again.'
        );
      } else if (error.name === 'OverconstrainedError') {
        setPermissionError(
          'Camera/microphone does not meet requirements. Try using a different device.'
        );
      } else if (error.name === 'SecurityError') {
        setPermissionError(
          'Security error: Please make sure you are using HTTPS or localhost.'
        );
      } else {
        setPermissionError(
          'Could not access camera/microphone. Error: ' + error.message
        );
      }
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const otherUser = chat.participants.find(p => p._id !== user.id);
    socket.emit('end_call', {
      to: otherUser._id,
      callId: `${user.id}-${otherUser._id}`
    });

    onClose();
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);

      const otherUser = chat.participants.find(p => p._id !== user.id);
      socket.emit('toggle_audio', {
        to: otherUser._id,
        enabled: audioTrack.enabled
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);

      const otherUser = chat.participants.find(p => p._id !== user.id);
      socket.emit('toggle_video', {
        to: otherUser._id,
        enabled: videoTrack.enabled
      });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerRef.current.streams[0].getVideoTracks()[0];
        
        peerRef.current.replaceTrack(sender, screenTrack, stream);
        
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setScreenSharing(true);

        const otherUser = chat.participants.find(p => p._id !== user.id);
        socket.emit('start_screen_share', { to: otherUser._id });
      } else {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerRef.current.streams[0].getVideoTracks()[0];
        
        peerRef.current.replaceTrack(sender, videoTrack, stream);
        setScreenSharing(false);

        const otherUser = chat.participants.find(p => p._id !== user.id);
        socket.emit('stop_screen_share', { to: otherUser._id });
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        {permissionError ? (
          <div className="permission-error-container">
            <div className="permission-error-content">
              <h2>⚠️ Permission Required</h2>
              <p className="error-message">{permissionError}</p>
              <div className="error-instructions">
                <h3>How to fix this:</h3>
                <ol>
                  <li>Click the <strong>lock icon (🔒)</strong> or <strong>camera icon</strong> in your browser's address bar</li>
                  <li>Select <strong>"Allow"</strong> for Camera and Microphone</li>
                  <li>Click <strong>"Retry"</strong> below or refresh the page</li>
                </ol>
                <p className="browser-note">
                  <strong>Note:</strong> If you're using Chrome, you can also go to:<br/>
                  Settings → Privacy and security → Site Settings → Camera/Microphone
                </p>
              </div>
              <div className="error-actions">
                <button className="retry-btn" onClick={startCall}>
                  🔄 Retry
                </button>
                <button className="close-btn" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : isConnecting ? (
          <div className="connecting-container">
            <div className="connecting-spinner"></div>
            <p>Requesting camera and microphone access...</p>
            <p className="connecting-hint">Please allow permissions when prompted</p>
          </div>
        ) : (
          <>
            {!isVoiceOnly && (
              <div className="remote-video-container">
                <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                {!remoteStream && (
                  <div className="waiting-message">
                    <p>Waiting for other user to join...</p>
                  </div>
                )}
              </div>
            )}

            {!isVoiceOnly && (
              <div className="local-video-container">
                <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
              </div>
            )}

            {isVoiceOnly && (
              <div className="voice-call-container">
                <div className="voice-call-avatar">
                  <div className="avatar-placeholder">
                    {chat.participants.find(p => p._id !== user.id)?.username?.charAt(0).toUpperCase()}
                  </div>
                  <h3>{chat.participants.find(p => p._id !== user.id)?.username}</h3>
                  <p className="call-status">
                    {remoteStream ? 'Connected' : 'Calling...'}
                  </p>
                </div>
              </div>
            )}

            <div className="video-call-controls">
              <button
                className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
                onClick={toggleAudio}
                title={audioEnabled ? 'Mute' : 'Unmute'}
              >
                {audioEnabled ? <FiMic /> : <FiMicOff />}
              </button>

              {!isVoiceOnly && (
                <button
                  className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
                  onClick={toggleVideo}
                  title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {videoEnabled ? <FiVideo /> : <FiVideoOff />}
                </button>
              )}

              {!isVoiceOnly && (
                <button
                  className={`control-btn ${screenSharing ? 'active' : ''}`}
                  onClick={toggleScreenShare}
                  title="Share screen"
                >
                  <FiMonitor />
                </button>
              )}

              <button
                className="control-btn end-call-btn"
                onClick={endCall}
                title="End call"
              >
                <FiX />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;

import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiX, FiPhone } from 'react-icons/fi';
import './Chat.css';

const VideoCall = ({ chat, onClose, isVoiceOnly = false }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(!isVoiceOnly);
  const [screenSharing, setScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callStatus, setCallStatus] = useState('initializing');
  const [callId, setCallId] = useState(null);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const iceCandidatesQueue = useRef([]);

  // WebRTC configuration with STUN servers
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      setCallStatus('requesting_permissions');
      setPermissionError(null);

      // Get user media
      const constraints = {
        audio: true,
        video: !isVoiceOnly
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current && !isVoiceOnly) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setCallStatus('connected');
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const otherUser = chat.participants.find(p => p._id !== user.id);
          socket.emit('ice_candidate', {
            to: otherUser._id,
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          setIsConnecting(false);
        } else if (peerConnection.connectionState === 'disconnected') {
          setCallStatus('disconnected');
        } else if (peerConnection.connectionState === 'failed') {
          setCallStatus('failed');
          setPermissionError('Connection failed. Please try again.');
        }
      };

      // Setup socket listeners
      setupSocketListeners(peerConnection);

      // Start the call
      await initiateCall(peerConnection);

    } catch (error) {
      console.error('Error initializing call:', error);
      handleMediaError(error);
    }
  };

  const setupSocketListeners = (peerConnection) => {
    // Handle incoming call
    socket.on('incoming_call', async ({ callId: incomingCallId, from, offer }) => {
      setCallId(incomingCallId);
      setCallStatus('incoming');
      
      // Auto-accept for now (you can add UI for accept/reject)
      await handleIncomingCall(peerConnection, offer, from, incomingCallId);
    });

    // Handle call accepted
    socket.on('call_accepted', async ({ answer }) => {
      setCallStatus('connecting');
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      
      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Handle call rejected
    socket.on('call_rejected', () => {
      setCallStatus('rejected');
      setPermissionError('Call was rejected by the other user');
      setTimeout(() => onClose(), 2000);
    });

    // Handle call ended
    socket.on('call_ended', () => {
      setCallStatus('ended');
      onClose();
    });

    // Handle ICE candidates
    socket.on('ice_candidate', async ({ candidate }) => {
      if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    });

    // Handle offer
    socket.on('offer', async ({ from, offer }) => {
      await handleIncomingCall(peerConnection, offer, from);
    });

    // Handle answer
    socket.on('answer', async ({ answer }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Handle peer audio/video toggles
    socket.on('peer_audio_toggle', ({ enabled }) => {
      console.log('Peer audio toggled:', enabled);
    });

    socket.on('peer_video_toggle', ({ enabled }) => {
      console.log('Peer video toggled:', enabled);
    });
  };

  const initiateCall = async (peerConnection) => {
    try {
      const otherUser = chat.participants.find(p => p._id !== user.id);
      
      // Create offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: !isVoiceOnly
      });
      
      await peerConnection.setLocalDescription(offer);
      
      // Send call request
      socket.emit('call_user', {
        to: otherUser._id,
        from: user.id,
        offer: offer,
        callType: isVoiceOnly ? 'voice' : 'video'
      });
      
      setCallStatus('calling');
      
    } catch (error) {
      console.error('Error initiating call:', error);
      setPermissionError('Failed to initiate call: ' + error.message);
    }
  };

  const handleIncomingCall = async (peerConnection, offer, from, incomingCallId) => {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('accept_call', {
        callId: incomingCallId,
        answer: answer,
        to: from
      });
      
      setCallStatus('connecting');
      
    } catch (error) {
      console.error('Error handling incoming call:', error);
      socket.emit('reject_call', {
        callId: incomingCallId,
        to: from
      });
    }
  };

  const handleMediaError = (error) => {
    setIsConnecting(false);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setPermissionError(
        'Camera/microphone access denied. Please allow permissions and try again.'
      );
    } else if (error.name === 'NotFoundError') {
      setPermissionError(
        'No camera or microphone found. Please connect a device and try again.'
      );
    } else if (error.name === 'NotReadableError') {
      setPermissionError(
        'Camera/microphone is already in use. Please close other apps and try again.'
      );
    } else {
      setPermissionError(
        'Could not access camera/microphone: ' + error.message
      );
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Remove socket listeners
    socket.off('incoming_call');
    socket.off('call_accepted');
    socket.off('call_rejected');
    socket.off('call_ended');
    socket.off('ice_candidate');
    socket.off('offer');
    socket.off('answer');
    socket.off('peer_audio_toggle');
    socket.off('peer_video_toggle');
  };

  const endCall = () => {
    const otherUser = chat.participants.find(p => p._id !== user.id);
    
    socket.emit('end_call', {
      callId: callId || `${user.id}-${otherUser._id}`,
      to: otherUser._id
    });

    cleanup();
    onClose();
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);

        const otherUser = chat.participants.find(p => p._id !== user.id);
        socket.emit('toggle_audio', {
          to: otherUser._id,
          enabled: audioTrack.enabled
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && !isVoiceOnly) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);

        const otherUser = chat.participants.find(p => p._id !== user.id);
        socket.emit('toggle_video', {
          to: otherUser._id,
          enabled: videoTrack.enabled
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        videoTrack.onended = () => {
          toggleScreenShare();
        };

        setScreenSharing(true);

        const otherUser = chat.participants.find(p => p._id !== user.id);
        socket.emit('start_screen_share', { to: otherUser._id });
        
      } else {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
        
        setScreenSharing(false);

        const otherUser = chat.participants.find(p => p._id !== user.id);
        socket.emit('stop_screen_share', { to: otherUser._id });
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const getCallStatusText = () => {
    switch (callStatus) {
      case 'initializing': return 'Initializing...';
      case 'requesting_permissions': return 'Requesting permissions...';
      case 'calling': return 'Calling...';
      case 'incoming': return 'Incoming call...';
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'failed': return 'Connection failed';
      case 'rejected': return 'Call rejected';
      case 'ended': return 'Call ended';
      default: return 'Unknown status';
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
                  <li>Click the <strong>lock icon (🔒)</strong> in your browser's address bar</li>
                  <li>Select <strong>"Allow"</strong> for Camera and Microphone</li>
                  <li>Click <strong>"Retry"</strong> below</li>
                </ol>
              </div>
              <div className="error-actions">
                <button className="retry-btn" onClick={initializeCall}>
                  🔄 Retry
                </button>
                <button className="close-btn" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="call-header">
              <h3>{chat.participants.find(p => p._id !== user.id)?.username}</h3>
              <p className="call-status">{getCallStatusText()}</p>
            </div>

            {!isVoiceOnly ? (
              <div className="video-container">
                <div className="remote-video-wrapper">
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="remote-video"
                  />
                  {!remoteStream && (
                    <div className="waiting-message">
                      <div className="avatar-placeholder">
                        {chat.participants.find(p => p._id !== user.id)?.username?.charAt(0).toUpperCase()}
                      </div>
                      <p>Waiting for response...</p>
                    </div>
                  )}
                </div>

                <div className="local-video-wrapper">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="local-video"
                  />
                </div>
              </div>
            ) : (
              <div className="voice-call-container">
                <div className="voice-call-avatar">
                  <div className="avatar-placeholder large">
                    {chat.participants.find(p => p._id !== user.id)?.username?.charAt(0).toUpperCase()}
                  </div>
                  <h3>{chat.participants.find(p => p._id !== user.id)?.username}</h3>
                  <p className="call-duration">{getCallStatusText()}</p>
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
                {isVoiceOnly ? <FiPhone /> : <FiX />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;

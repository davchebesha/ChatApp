import React, { useState, useEffect } from 'react';
import { FiMic, FiAlertCircle, FiCheckCircle, FiX, FiRefreshCw, FiArrowLeft, FiSkipForward, FiHome, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './MicrophonePermissionGuide.css';

const MicrophonePermissionGuide = ({ onPermissionGranted, onClose, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [browserType, setBrowserType] = useState('');

  useEffect(() => {
    // Detect browser type
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) {
      setBrowserType('chrome');
    } else if (userAgent.includes('Firefox')) {
      setBrowserType('firefox');
    } else if (userAgent.includes('Safari')) {
      setBrowserType('safari');
    } else if (userAgent.includes('Edge')) {
      setBrowserType('edge');
    } else {
      setBrowserType('other');
    }
  }, []);

  const checkPermission = async () => {
    setIsChecking(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Permission granted!
      stream.getTracks().forEach(track => track.stop());
      toast.success('Microphone permission granted!');
      onPermissionGranted();
      
    } catch (error) {
      console.error('Permission check failed:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permission still denied. Please follow the steps above.');
        setCurrentStep(1); // Show detailed instructions
      } else {
        toast.error('Error checking microphone: ' + error.message);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const getBrowserInstructions = () => {
    switch (browserType) {
      case 'chrome':
      case 'edge':
        return {
          title: 'Chrome/Edge Instructions',
          steps: [
            'Look for the 🔒 or 🛡️ icon in the address bar (left side)',
            'Click on the icon to open site settings',
            'Find "Microphone" in the permissions list',
            'Change it from "Block" to "Allow"',
            'Refresh the page and try again'
          ],
          image: '/images/chrome-mic-permission.png'
        };
      
      case 'firefox':
        return {
          title: 'Firefox Instructions',
          steps: [
            'Look for the 🛡️ shield icon in the address bar',
            'Click on the shield icon',
            'Click "Allow" next to microphone access',
            'Or go to Settings → Privacy & Security → Permissions',
            'Find "Microphone" and manage permissions for this site'
          ],
          image: '/images/firefox-mic-permission.png'
        };
      
      case 'safari':
        return {
          title: 'Safari Instructions',
          steps: [
            'Go to Safari menu → Settings (or Preferences)',
            'Click on "Websites" tab',
            'Select "Microphone" from the left sidebar',
            'Find this website in the list',
            'Change the setting to "Allow"',
            'Refresh the page'
          ],
          image: '/images/safari-mic-permission.png'
        };
      
      default:
        return {
          title: 'Browser Instructions',
          steps: [
            'Look for a microphone or permission icon in your address bar',
            'Click on it to open site permissions',
            'Allow microphone access for this website',
            'Refresh the page if needed'
          ],
          image: null
        };
    }
  };

  const instructions = getBrowserInstructions();

  const steps = [
    {
      title: 'Microphone Permission Required',
      content: (
        <div className="step-content">
          <FiMic className="step-icon" />
          <p>To record voice messages, we need access to your microphone.</p>
          <p>This is completely safe and we only access your microphone when you're actively recording.</p>
          <div className="step-actions">
            <button className="primary-btn" onClick={() => setCurrentStep(1)}>
              Show Me How
            </button>
            <button className="secondary-btn" onClick={checkPermission} disabled={isChecking}>
              {isChecking ? 'Checking...' : 'Try Now'}
            </button>
          </div>
        </div>
      )
    },
    {
      title: instructions.title,
      content: (
        <div className="step-content">
          <div className="browser-instructions">
            <ol>
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          
          <div className="instruction-note">
            <FiAlertCircle />
            <p>
              <strong>Important:</strong> If you previously clicked "Block" or "Deny", 
              you'll need to manually enable microphone access using the steps above.
            </p>
          </div>
          
          <div className="step-actions">
            <button className="primary-btn" onClick={checkPermission} disabled={isChecking}>
              {isChecking ? (
                <>
                  <FiRefreshCw className="spinning" />
                  Checking...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  I've Enabled It
                </>
              )}
            </button>
            <button className="secondary-btn" onClick={() => setCurrentStep(2)}>
              Still Having Issues?
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Troubleshooting',
      content: (
        <div className="step-content">
          <div className="troubleshooting-tips">
            <h4>Common Issues & Solutions:</h4>
            
            <div className="tip-item">
              <strong>🔒 Permission Permanently Denied</strong>
              <p>Clear your browser's site data and try again, or use an incognito/private window.</p>
            </div>
            
            <div className="tip-item">
              <strong>🎤 No Microphone Found</strong>
              <p>Check that your microphone is connected and working in other applications.</p>
            </div>
            
            <div className="tip-item">
              <strong>🚫 Microphone In Use</strong>
              <p>Close other applications that might be using your microphone (Zoom, Skype, etc.).</p>
            </div>
            
            <div className="tip-item">
              <strong>🌐 HTTPS Required</strong>
              <p>Microphone access requires a secure connection. Make sure you're using HTTPS.</p>
            </div>
          </div>
          
          <div className="step-actions">
            <button className="primary-btn" onClick={checkPermission} disabled={isChecking}>
              {isChecking ? (
                <>
                  <FiRefreshCw className="spinning" />
                  Checking...
                </>
              ) : (
                'Try Again'
              )}
            </button>
            <button 
              className="secondary-btn" 
              onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
            >
              Get More Help
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="mic-permission-guide-overlay">
      <div className="mic-permission-guide enhanced-guide">
        <div className="guide-header enhanced-guide-header">
          <div className="header-left">
            {currentStep > 0 && (
              <button className="nav-btn back-btn" onClick={() => setCurrentStep(currentStep - 1)}>
                <FiArrowLeft />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div className="header-center">
            <h3>{steps[currentStep].title}</h3>
          </div>
          
          <div className="header-right">
            {onSkip && (
              <button className="nav-btn skip-btn" onClick={onSkip} title="Skip Guide">
                <FiSkipForward />
                <span>Skip</span>
              </button>
            )}
            <button className="nav-btn close-btn" onClick={onClose} title="Close Guide">
              <FiX />
            </button>
          </div>
        </div>
        
        <div className="guide-content">
          {steps[currentStep].content}
        </div>
        
        <div className="guide-footer enhanced-guide-footer">
          <div className="step-indicator">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
                title={`Step ${index + 1}`}
              />
            ))}
          </div>
          
          <div className="navigation-buttons">
            <button 
              className="footer-btn home-btn" 
              onClick={() => setCurrentStep(0)} 
              title="Go to Start"
            >
              <FiHome />
            </button>
            
            {currentStep < steps.length - 1 && (
              <button 
                className="nav-btn next-btn" 
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
                <FiArrowRight />
              </button>
            )}
            
            <button className="footer-btn exit-btn" onClick={onClose} title="Exit Guide">
              <FiX />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionGuide;
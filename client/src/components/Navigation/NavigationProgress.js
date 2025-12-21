import React from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { FiChevronLeft, FiChevronRight, FiX, FiCheck } from 'react-icons/fi';
import './NavigationProgress.css';

const NavigationProgress = ({ 
  showControls = true, 
  showProgress = true, 
  showSteps = true,
  onCancel,
  className = '' 
}) => {
  const { 
    getCurrentFlowInfo, 
    nextStep, 
    previousStep, 
    cancelFlow,
    isLinearMode,
    navigationFlows 
  } = useNavigation();

  if (!isLinearMode) return null;

  const flowInfo = getCurrentFlowInfo();
  if (!flowInfo) return null;

  const handleNext = () => {
    nextStep();
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      cancelFlow();
    }
  };

  return (
    <div className={`navigation-progress ${className}`}>
      {/* Progress Header */}
      <div className="progress-header">
        <div className="flow-info">
          <h3 className="flow-title">{flowInfo.flowName}</h3>
          <p className="step-title">{flowInfo.currentStepInfo.title}</p>
        </div>
        
        <button 
          className="cancel-btn"
          onClick={handleCancel}
          title="Cancel flow"
        >
          <FiX />
        </button>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${flowInfo.progress}%` }}
            />
          </div>
          <div className="progress-text">
            Step {flowInfo.currentStep + 1} of {flowInfo.totalSteps}
          </div>
        </div>
      )}

      {/* Step Indicators */}
      {showSteps && (
        <div className="steps-indicator">
          {flowInfo.flowId && navigationFlows && navigationFlows[flowInfo.flowId]?.steps.map((step, index) => (
            <div 
              key={step.id}
              className={`step-item ${
                index < flowInfo.currentStep ? 'completed' : 
                index === flowInfo.currentStep ? 'current' : 'pending'
              }`}
            >
              <div className="step-circle">
                {index < flowInfo.currentStep ? (
                  <FiCheck />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="step-label">{step.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Controls */}
      {showControls && (
        <div className="navigation-controls">
          <button 
            className="nav-btn secondary"
            onClick={handlePrevious}
            disabled={!flowInfo.canGoPrevious}
          >
            <FiChevronLeft />
            Previous
          </button>
          
          <button 
            className="nav-btn primary"
            onClick={handleNext}
            disabled={!flowInfo.canGoNext}
          >
            {flowInfo.isLastStep ? 'Complete' : 'Next'}
            {!flowInfo.isLastStep && <FiChevronRight />}
          </button>
        </div>
      )}
    </div>
  );
};

export default NavigationProgress;
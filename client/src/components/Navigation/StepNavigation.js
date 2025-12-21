import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { FiChevronLeft, FiChevronRight, FiHome, FiCheck, FiX } from 'react-icons/fi';
import './StepNavigation.css';

const StepNavigation = ({ 
  steps = [], 
  currentStep = 0, 
  onStepChange, 
  showProgress = true,
  showControls = true,
  allowSkipping = false,
  className = ''
}) => {
  const { startFlow, nextStep, previousStep, completeFlow, cancelFlow } = useNavigation();
  const [localStep, setLocalStep] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState(new Set([0]));

  useEffect(() => {
    setLocalStep(currentStep);
  }, [currentStep]);

  const handleNext = () => {
    if (localStep < steps.length - 1) {
      const newStep = localStep + 1;
      setLocalStep(newStep);
      setCompletedSteps(prev => new Set([...prev, newStep]));
      
      if (onStepChange) {
        onStepChange(newStep, 'next');
      }
      
      nextStep({ currentStepData: steps[localStep] });
    } else {
      // Last step - complete the flow
      completeFlow({ finalStep: steps[localStep] });
    }
  };

  const handlePrevious = () => {
    if (localStep > 0) {
      const newStep = localStep - 1;
      setLocalStep(newStep);
      
      if (onStepChange) {
        onStepChange(newStep, 'previous');
      }
      
      previousStep();
    }
  };

  const handleStepClick = (stepIndex) => {
    if (!allowSkipping && !completedSteps.has(stepIndex)) {
      return; // Don't allow skipping to uncompleted steps
    }
    
    setLocalStep(stepIndex);
    if (onStepChange) {
      onStepChange(stepIndex, 'jump');
    }
  };

  const handleHome = () => {
    setLocalStep(0);
    setCompletedSteps(new Set([0]));
    if (onStepChange) {
      onStepChange(0, 'home');
    }
  };

  const handleCancel = () => {
    cancelFlow();
    if (onStepChange) {
      onStepChange(0, 'cancel');
    }
  };

  const currentStepData = steps[localStep];
  const progress = ((localStep + 1) / steps.length) * 100;

  return (
    <div className={`step-navigation ${className}`}>
      {/* Progress Header */}
      <div className="step-nav-header">
        <div className="step-info">
          <h3 className="step-title">
            {currentStepData?.title || `Step ${localStep + 1}`}
          </h3>
          <p className="step-description">
            {currentStepData?.description || `Step ${localStep + 1} of ${steps.length}`}
          </p>
        </div>
        
        <div className="step-actions">
          <button 
            className="step-action-btn home-btn"
            onClick={handleHome}
            title="Go to first step"
          >
            <FiHome />
          </button>
          <button 
            className="step-action-btn cancel-btn"
            onClick={handleCancel}
            title="Cancel navigation"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="step-progress-section">
          <div className="step-progress-bar">
            <div 
              className="step-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="step-progress-text">
            {localStep + 1} of {steps.length} steps ({Math.round(progress)}%)
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="step-indicators">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`step-indicator ${
              index < localStep ? 'completed' : 
              index === localStep ? 'current' : 'pending'
            } ${allowSkipping || completedSteps.has(index) ? 'clickable' : ''}`}
            onClick={() => handleStepClick(index)}
          >
            <div className="step-circle">
              {index < localStep ? (
                <FiCheck />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="step-label">
              <span className="step-name">{step.title}</span>
              {step.subtitle && (
                <span className="step-subtitle">{step.subtitle}</span>
              )}
            </div>
            
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div className={`step-connector ${index < localStep ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {showControls && (
        <div className="step-nav-controls">
          <button 
            className="step-nav-btn secondary"
            onClick={handlePrevious}
            disabled={localStep === 0}
          >
            <FiChevronLeft />
            Previous
          </button>
          
          <div className="step-counter">
            {localStep + 1} / {steps.length}
          </div>
          
          <button 
            className="step-nav-btn primary"
            onClick={handleNext}
          >
            {localStep === steps.length - 1 ? (
              <>
                <FiCheck />
                Complete
              </>
            ) : (
              <>
                Next
                <FiChevronRight />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step Content Area */}
      <div className="step-content">
        {currentStepData?.content || (
          <div className="default-step-content">
            <h4>Step {localStep + 1}: {currentStepData?.title}</h4>
            <p>{currentStepData?.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
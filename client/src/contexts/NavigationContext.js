import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Define navigation flows and their steps
const navigationFlows = {
  onboarding: {
    name: 'User Onboarding',
    steps: [
      { id: 'welcome', path: '/onboarding/welcome', title: 'Welcome' },
      { id: 'profile', path: '/onboarding/profile', title: 'Setup Profile' },
      { id: 'preferences', path: '/onboarding/preferences', title: 'Preferences' },
      { id: 'complete', path: '/onboarding/complete', title: 'Complete' }
    ]
  },
  settings: {
    name: 'Settings Configuration',
    steps: [
      { id: 'theme', path: '/settings/theme', title: 'Theme & Appearance' },
      { id: 'profile', path: '/settings/profile', title: 'Profile Settings' },
      { id: 'notifications', path: '/settings/notifications', title: 'Notifications' },
      { id: 'privacy', path: '/settings/privacy', title: 'Privacy & Security' }
    ]
  },
  chatSetup: {
    name: 'Chat Setup',
    steps: [
      { id: 'type', path: '/chat/setup/type', title: 'Chat Type' },
      { id: 'participants', path: '/chat/setup/participants', title: 'Add Participants' },
      { id: 'settings', path: '/chat/setup/settings', title: 'Chat Settings' },
      { id: 'create', path: '/chat/setup/create', title: 'Create Chat' }
    ]
  }
};

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currentFlow, setCurrentFlow] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [savedState, setSavedState] = useState({});
  const [isLinearMode, setIsLinearMode] = useState(false);
  const [allowedPaths, setAllowedPaths] = useState(new Set());

  // Initialize navigation state
  useEffect(() => {
    const savedNavState = localStorage.getItem('nexus-navigation-state');
    if (savedNavState) {
      try {
        const state = JSON.parse(savedNavState);
        setSavedState(state.savedState || {});
        setNavigationHistory(state.history || []);
      } catch (error) {
        console.error('Failed to restore navigation state:', error);
      }
    }
  }, []);

  // Save navigation state
  useEffect(() => {
    const state = {
      savedState,
      history: navigationHistory
    };
    localStorage.setItem('nexus-navigation-state', JSON.stringify(state));
  }, [savedState, navigationHistory]);

  // Start a linear navigation flow
  const startFlow = useCallback((flowId, initialData = {}) => {
    const flow = navigationFlows[flowId];
    if (!flow) {
      console.error(`Navigation flow '${flowId}' not found`);
      return false;
    }

    setCurrentFlow(flowId);
    setCurrentStep(0);
    setIsLinearMode(true);
    setSavedState({ ...savedState, [flowId]: initialData });
    
    // Set allowed paths for this flow
    const flowPaths = new Set(flow.steps.map(step => step.path));
    setAllowedPaths(flowPaths);
    
    // Navigate to first step
    navigate(flow.steps[0].path);
    
    return true;
  }, [navigate, savedState]);

  // Move to next step in current flow
  const nextStep = useCallback((data = {}) => {
    if (!currentFlow || !isLinearMode) return false;
    
    const flow = navigationFlows[currentFlow];
    if (!flow || currentStep >= flow.steps.length - 1) return false;

    // Save current step data
    setSavedState(prev => ({
      ...prev,
      [currentFlow]: {
        ...prev[currentFlow],
        [`step_${currentStep}`]: data
      }
    }));

    const nextStepIndex = currentStep + 1;
    setCurrentStep(nextStepIndex);
    navigate(flow.steps[nextStepIndex].path);
    
    return true;
  }, [currentFlow, currentStep, isLinearMode, navigate]);

  // Move to previous step in current flow
  const previousStep = useCallback(() => {
    if (!currentFlow || !isLinearMode || currentStep <= 0) return false;
    
    const flow = navigationFlows[currentFlow];
    if (!flow) return false;

    const prevStepIndex = currentStep - 1;
    setCurrentStep(prevStepIndex);
    navigate(flow.steps[prevStepIndex].path);
    
    return true;
  }, [currentFlow, currentStep, isLinearMode, navigate]);

  // Complete current flow
  const completeFlow = useCallback((finalData = {}) => {
    if (!currentFlow) return false;

    // Save final data
    setSavedState(prev => ({
      ...prev,
      [currentFlow]: {
        ...prev[currentFlow],
        completed: true,
        completedAt: new Date().toISOString(),
        finalData
      }
    }));

    // Add to history
    setNavigationHistory(prev => [
      ...prev,
      {
        flowId: currentFlow,
        completedAt: new Date().toISOString(),
        data: savedState[currentFlow]
      }
    ]);

    // Reset flow state
    setCurrentFlow(null);
    setCurrentStep(0);
    setIsLinearMode(false);
    setAllowedPaths(new Set());
    
    return true;
  }, [currentFlow, savedState]);

  // Cancel current flow
  const cancelFlow = useCallback(() => {
    if (!currentFlow) return false;

    // Clear flow-specific saved state
    setSavedState(prev => {
      const newState = { ...prev };
      delete newState[currentFlow];
      return newState;
    });

    // Reset flow state
    setCurrentFlow(null);
    setCurrentStep(0);
    setIsLinearMode(false);
    setAllowedPaths(new Set());
    
    return true;
  }, [currentFlow]);

  // Jump to specific step (only allowed in certain conditions)
  const jumpToStep = useCallback((stepIndex, reason = 'user') => {
    if (!currentFlow || !isLinearMode) return false;
    
    const flow = navigationFlows[currentFlow];
    if (!flow || stepIndex < 0 || stepIndex >= flow.steps.length) return false;

    // Only allow jumping in specific cases
    const allowedReasons = ['modal', 'popup', 'error', 'admin'];
    if (!allowedReasons.includes(reason)) {
      console.warn('Jump to step not allowed for reason:', reason);
      return false;
    }

    setCurrentStep(stepIndex);
    navigate(flow.steps[stepIndex].path);
    
    return true;
  }, [currentFlow, isLinearMode, navigate]);

  // Save current state for temporary deviation
  const saveCurrentState = useCallback(() => {
    if (!currentFlow) return null;

    const stateId = `temp_${Date.now()}`;
    const state = {
      flow: currentFlow,
      step: currentStep,
      path: location.pathname,
      savedAt: new Date().toISOString()
    };

    setSavedState(prev => ({
      ...prev,
      [`temp_states`]: {
        ...prev.temp_states,
        [stateId]: state
      }
    }));

    return stateId;
  }, [currentFlow, currentStep, location.pathname]);

  // Restore saved state after temporary deviation
  const restoreState = useCallback((stateId) => {
    const tempStates = savedState.temp_states || {};
    const state = tempStates[stateId];
    
    if (!state) return false;

    setCurrentFlow(state.flow);
    setCurrentStep(state.step);
    setIsLinearMode(true);
    navigate(state.path);

    // Clean up temporary state
    setSavedState(prev => {
      const newTempStates = { ...prev.temp_states };
      delete newTempStates[stateId];
      return {
        ...prev,
        temp_states: newTempStates
      };
    });

    return true;
  }, [savedState, navigate]);

  // Check if navigation to a path is allowed
  const isNavigationAllowed = useCallback((path) => {
    if (!isLinearMode) return true;
    return allowedPaths.has(path);
  }, [isLinearMode, allowedPaths]);

  // Get current flow information
  const getCurrentFlowInfo = useCallback(() => {
    if (!currentFlow) return null;

    const flow = navigationFlows[currentFlow];
    if (!flow) return null;

    return {
      flowId: currentFlow,
      flowName: flow.name,
      currentStep,
      totalSteps: flow.steps.length,
      currentStepInfo: flow.steps[currentStep],
      progress: ((currentStep + 1) / flow.steps.length) * 100,
      canGoNext: currentStep < flow.steps.length - 1,
      canGoPrevious: currentStep > 0,
      isLastStep: currentStep === flow.steps.length - 1
    };
  }, [currentFlow, currentStep]);

  const value = {
    // State
    currentFlow,
    currentStep,
    isLinearMode,
    navigationHistory,
    savedState,
    
    // Flow control
    startFlow,
    nextStep,
    previousStep,
    completeFlow,
    cancelFlow,
    jumpToStep,
    
    // State management
    saveCurrentState,
    restoreState,
    
    // Utilities
    isNavigationAllowed,
    getCurrentFlowInfo,
    navigationFlows
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
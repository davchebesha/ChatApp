import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigation } from '../../contexts/NavigationContext';
import { useNotification } from '../../contexts/NotificationContext';

const RouteGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isNavigationAllowed, isLinearMode, getCurrentFlowInfo } = useNavigation();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (isLinearMode && !isNavigationAllowed(location.pathname)) {
      const flowInfo = getCurrentFlowInfo();
      
      if (flowInfo) {
        // Redirect to current step in flow
        const currentStepPath = flowInfo.currentStepInfo.path;
        
        addNotification({
          type: 'warning',
          title: 'Navigation Restricted',
          message: `Please complete the current step: ${flowInfo.currentStepInfo.title}`
        });
        
        navigate(currentStepPath, { replace: true });
      } else {
        // No active flow but linear mode is on - this shouldn't happen
        console.error('Linear mode active but no current flow found');
        addNotification({
          type: 'error',
          title: 'Navigation Error',
          message: 'Navigation flow error. Please try again.'
        });
      }
    }
  }, [location.pathname, isLinearMode, isNavigationAllowed, getCurrentFlowInfo, navigate, addNotification]);

  return <>{children}</>;
};

export default RouteGuard;
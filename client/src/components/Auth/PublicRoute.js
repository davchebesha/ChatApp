import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect to the intended destination or chat
    const from = location.state?.from?.pathname || '/chat';
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;
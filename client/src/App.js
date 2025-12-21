import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NavigationProvider } from './contexts/NavigationContext';

import LandingPage from './components/Landing/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatLayout from './components/Chat/ChatLayout';
import SettingsPage from './components/Settings/SettingsPage';
import RouteGuard from './components/Navigation/RouteGuard';

import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Public route component (redirect to chat if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/chat" /> : children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <NotificationProvider>
          <NavigationProvider>
            <AuthProvider>
              <SocketProvider>
                <ChatProvider>
                  <RouteGuard>
                    <div className="App">
                      <Routes>
                        <Route path="/" element={
                          <PublicRoute>
                            <LandingPage />
                          </PublicRoute>
                        } />
                        <Route path="/login" element={
                          <PublicRoute>
                            <Login />
                          </PublicRoute>
                        } />
                        <Route path="/register" element={
                          <PublicRoute>
                            <Register />
                          </PublicRoute>
                        } />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <SettingsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/chat/*"
                          element={
                            <ProtectedRoute>
                              <ChatLayout />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/*"
                          element={
                            <ProtectedRoute>
                              <ChatLayout />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                      <ToastContainer position="top-right" autoClose={3000} />
                    </div>
                  </RouteGuard>
                </ChatProvider>
              </SocketProvider>
            </AuthProvider>
          </NavigationProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

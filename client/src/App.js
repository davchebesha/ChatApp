import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';
import ChatLayout from './components/Chat/ChatLayout';
import LandingPage from './components/Landing/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import SettingsPage from './components/Settings/SettingsPage';
import AuthTest from './components/Debug/AuthTest';
import MicrophoneTest from './components/Debug/MicrophoneTest';
import './App.css';
import './styles/branding.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="App">
      <BrandingProvider>
        <ThemeProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <SocketProvider>
                <NavigationProvider>
                  <NotificationProvider>
                    <ChatProvider>
                    <Routes>
                      {/* Debug Routes */}
                      <Route path="/debug" element={<AuthTest />} />
                      <Route path="/debug/microphone" element={<MicrophoneTest />} />
                      
                      {/* Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route 
                        path="/login" 
                        element={
                          <PublicRoute>
                            <Login />
                          </PublicRoute>
                        } 
                      />
                      <Route 
                        path="/register" 
                        element={
                          <PublicRoute>
                            <Register />
                          </PublicRoute>
                        } 
                      />
                      
                      {/* Protected Routes */}
                      <Route 
                        path="/chat" 
                        element={
                          <ProtectedRoute>
                            <ChatLayout />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Redirect unknown routes */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </ChatProvider>
                </NotificationProvider>
              </NavigationProvider>
            </SocketProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </BrandingProvider>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;

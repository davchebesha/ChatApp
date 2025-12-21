import React from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiVideo, FiUsers, FiShield, FiZap, FiGlobe } from 'react-icons/fi';
import './Landing.css';

const LandingPage = () => {
  const features = [
    {
      icon: <FiMessageSquare />,
      title: "Real-time Messaging",
      description: "Instant messaging with typing indicators and read receipts"
    },
    {
      icon: <FiVideo />,
      title: "Video & Voice Calls",
      description: "High-quality video and voice calls with screen sharing"
    },
    {
      icon: <FiUsers />,
      title: "Group Chats",
      description: "Create groups and channels for team collaboration"
    },
    {
      icon: <FiShield />,
      title: "Secure & Private",
      description: "End-to-end encryption and advanced security features"
    },
    {
      icon: <FiZap />,
      title: "Lightning Fast",
      description: "Optimized for speed with real-time synchronization"
    },
    {
      icon: <FiGlobe />,
      title: "Cross-Platform",
      description: "Works seamlessly across all your devices"
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <nav className="navbar">
          <div className="nav-brand">
            <img src="/logo.svg" alt="Nexus ChatApp" style={{ width: '32px', height: '32px', marginRight: '10px' }} />
            <h1>Nexus ChatApp</h1>
          </div>
          <div className="nav-links">
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Connect, Communicate, Collaborate</h1>
          <p>
            Experience the future of messaging with Nexus ChatApp. 
            Real-time communication, crystal-clear calls, and seamless collaboration 
            all in one professional platform.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Start Chatting Now
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="chat-preview">
            <div className="chat-bubble left">
              <p>Hey! How's the new project going?</p>
            </div>
            <div className="chat-bubble right">
              <p>Great! The team is really productive with Nexus ChatApp 🚀</p>
            </div>
            <div className="chat-bubble left">
              <p>Awesome! Let's schedule a video call to discuss details.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose Nexus ChatApp?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Communication?</h2>
          <p>Join thousands of teams already using Nexus ChatApp</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Nexus ChatApp</h3>
              <p>Professional messaging platform for modern teams.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Nexus ChatApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
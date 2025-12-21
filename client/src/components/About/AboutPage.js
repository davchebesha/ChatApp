import React from 'react';
import { FiGithub, FiMail, FiGlobe } from 'react-icons/fi';
import './About.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>Chat App</h1>
        <p className="version">Version 1.0.0</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>About This Application</h2>
          <p>
            A full-featured, distributed chat/messaging application built with modern web technologies.
            This application supports real-time messaging, voice/video calls, file sharing, and comprehensive
            user management.
          </p>
        </section>

        <section className="about-section">
          <h2>Features</h2>
          <ul className="features-list">
            <li>Real-time messaging with WebSocket</li>
            <li>Voice and video calling with WebRTC</li>
            <li>Group chats and channels</li>
            <li>File sharing and media support</li>
            <li>Message reactions and replies</li>
            <li>User presence and typing indicators</li>
            <li>Search functionality</li>
            <li>Desktop notifications</li>
            <li>End-to-end encryption ready</li>
            <li>Responsive design for all devices</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <h3>Frontend</h3>
              <ul>
                <li>React 18</li>
                <li>Socket.io Client</li>
                <li>WebRTC (Simple Peer)</li>
                <li>React Router</li>
              </ul>
            </div>
            <div className="tech-item">
              <h3>Backend</h3>
              <ul>
                <li>Node.js</li>
                <li>Express.js</li>
                <li>Socket.io</li>
                <li>MongoDB</li>
              </ul>
            </div>
            <div className="tech-item">
              <h3>Infrastructure</h3>
              <ul>
                <li>Docker</li>
                <li>Nginx</li>
                <li>Redis</li>
                <li>JWT Auth</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Architecture</h2>
          <p>
            This application follows a distributed microservices architecture with:
          </p>
          <ul className="features-list">
            <li>Load balancing for horizontal scaling</li>
            <li>MongoDB replica sets for high availability</li>
            <li>Redis for caching and pub/sub messaging</li>
            <li>WebSocket servers for real-time communication</li>
            <li>WebRTC signaling for peer-to-peer calls</li>
            <li>RESTful API design</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Security & Privacy</h2>
          <ul className="features-list">
            <li>JWT-based authentication</li>
            <li>Password hashing with bcrypt</li>
            <li>HTTPS/TLS encryption</li>
            <li>Input validation and sanitization</li>
            <li>Rate limiting and DDoS protection</li>
            <li>CORS configuration</li>
            <li>XSS and CSRF protection</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Contact & Support</h2>
          <div className="contact-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FiGithub />
              <span>GitHub Repository</span>
            </a>
            <a href="mailto:support@chatapp.com" className="contact-link">
              <FiMail />
              <span>Email Support</span>
            </a>
            <a href="https://chatapp.com" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FiGlobe />
              <span>Website</span>
            </a>
          </div>
        </section>

        <section className="about-section">
          <h2>License</h2>
          <p>
            This application is released under the MIT License. You are free to use, modify,
            and distribute this software in accordance with the license terms.
          </p>
        </section>

        <section className="about-section">
          <h2>Credits</h2>
          <p>
            Built with ❤️ using open-source technologies and libraries.
            Special thanks to all contributors and the open-source community.
          </p>
        </section>
      </div>

      <div className="about-footer">
        <p>&copy; 2024 Chat App. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AboutPage;

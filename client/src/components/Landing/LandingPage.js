import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMessageSquare, 
  FiVideo, 
  FiUsers, 
  FiShield, 
  FiZap, 
  FiGlobe, 
  FiArrowRight, 
  FiCheck,
  FiStar,
  FiPlay,
  FiDownload,
  FiSmartphone,
  FiMonitor,
  FiTablet
} from 'react-icons/fi';
import { useBranding } from '../../contexts/BrandingContext';
import Logo from '../Common/Logo';
import Footer from '../Common/Footer';
import ScrollToTop from '../Common/ScrollToTop';
import './Landing.css';

const LandingPage = () => {
  const { appName, tagline, supportEmail } = useBranding();
  
  const features = [
    {
      icon: <FiMessageSquare />,
      title: "Real-time Messaging",
      description: "Instant messaging with typing indicators, read receipts, and message reactions"
    },
    {
      icon: <FiVideo />,
      title: "HD Video & Voice Calls",
      description: "Crystal-clear video and voice calls with screen sharing and recording"
    },
    {
      icon: <FiUsers />,
      title: "Group Collaboration",
      description: "Create groups and channels for seamless team collaboration and communication"
    },
    {
      icon: <FiShield />,
      title: "Enterprise Security",
      description: "End-to-end encryption, advanced security features, and compliance ready"
    },
    {
      icon: <FiZap />,
      title: "Lightning Fast",
      description: "Optimized for speed with real-time synchronization across all devices"
    },
    {
      icon: <FiGlobe />,
      title: "Cross-Platform",
      description: "Works seamlessly on desktop, mobile, and web with cloud synchronization"
    }
  ];

  const benefits = [
    "Unlimited messages and file sharing",
    "HD video and voice calls",
    "End-to-end encryption",
    "Cross-platform synchronization",
    "24/7 customer support",
    "No ads, ever"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechCorp",
      avatar: "/avatars/sarah.jpg",
      rating: 5,
      text: "NexusChat has transformed how our team communicates. The real-time features and security are outstanding."
    },
    {
      name: "Michael Chen",
      role: "CTO",
      company: "StartupXYZ",
      avatar: "/avatars/michael.jpg",
      rating: 5,
      text: "Best messaging platform we've used. The video quality and group features are exactly what we needed."
    },
    {
      name: "Emily Rodriguez",
      role: "Team Lead",
      company: "DesignStudio",
      avatar: "/avatars/emily.jpg",
      rating: 5,
      text: "Intuitive interface, powerful features, and excellent performance. Highly recommended!"
    }
  ];

  const stats = [
    { number: "10M+", label: "Active Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "150+", label: "Countries" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="landing-page page-container">
      {/* Fixed Header */}
      <header className="landing-header">
        <nav className="navbar">
          <div className="nav-brand">
            <Logo size="md" showText={true} />
          </div>
          <div className="nav-menu">
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn btn-outline">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
          <button className="mobile-menu-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero section-safe">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="container-safe">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Connect, Communicate, 
                <span className="text-gradient"> Collaborate</span>
              </h1>
              <p className="hero-description">
                Experience the future of messaging with {appName}. 
                Real-time communication, crystal-clear calls, and seamless collaboration 
                all in one professional platform.
              </p>
              
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  Start Free Trial
                  <FiArrowRight />
                </Link>
                <button className="btn btn-outline btn-large demo-btn">
                  <FiPlay />
                  Watch Demo
                </button>
              </div>
              
              <div className="quick-access-buttons">
                <Link to="/login" className="quick-access-btn login">
                  <FiUsers />
                  <span>
                    <strong>Already have an account?</strong>
                    <small>Sign in to continue</small>
                  </span>
                </Link>
                <Link to="/register" className="quick-access-btn register">
                  <FiZap />
                  <span>
                    <strong>New to {appName}?</strong>
                    <small>Create your free account</small>
                  </span>
                </Link>
              </div>
              
              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="chat-preview">
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="chat-avatar"></div>
                    <div className="chat-details">
                      <span className="chat-name">Team Project</span>
                      <span className="chat-status">
                        <span className="status-dot online"></span>
                        3 members online
                      </span>
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button className="chat-action-btn">
                      <FiVideo />
                    </button>
                  </div>
                </div>
                
                <div className="chat-messages">
                  <div className="chat-bubble left">
                    <div className="message-content">
                      <p>Hey! How's the new project going?</p>
                      <span className="message-time">2:30 PM</span>
                    </div>
                  </div>
                  <div className="chat-bubble right">
                    <div className="message-content">
                      <p>Great! The team is really productive with {appName} 🚀</p>
                      <span className="message-time">2:31 PM</span>
                    </div>
                  </div>
                  <div className="chat-bubble left">
                    <div className="message-content">
                      <p>Awesome! Let's schedule a video call to discuss details.</p>
                      <span className="message-time">2:32 PM</span>
                    </div>
                  </div>
                </div>
                
                <div className="chat-input">
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>Dawit is typing...</span>
                  </div>
                </div>
              </div>
              
              <div className="floating-elements">
                <div className="floating-card notification">
                  <FiMessageSquare />
                  <span>New message from Sarah</span>
                </div>
                <div className="floating-card call">
                  <FiVideo />
                  <span>Incoming video call</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features section-safe">
        <div className="container-safe">
          <div className="section-header">
            <h2>Why Choose {appName}?</h2>
            <p className="section-description">
              Everything you need for professional team communication in one powerful platform
            </p>
          </div>
          
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

      {/* Benefits Section */}
      <section className="benefits section-safe">
        <div className="container-safe">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Everything You Need, Nothing You Don't</h2>
              <p>
                Built for modern teams who demand reliability, security, and performance.
                No bloatware, no distractions - just pure communication excellence.
              </p>
              
              <div className="benefits-list">
                {benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <FiCheck className="benefit-check" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/register" className="btn btn-primary btn-large">
                Start Your Free Trial
                <FiArrowRight />
              </Link>
            </div>
            
            <div className="benefits-visual">
              <div className="device-showcase">
                <div className="device desktop">
                  <FiMonitor />
                  <span>Desktop</span>
                </div>
                <div className="device mobile">
                  <FiSmartphone />
                  <span>Mobile</span>
                </div>
                <div className="device tablet">
                  <FiTablet />
                  <span>Tablet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials section-safe">
        <div className="container-safe">
          <div className="section-header">
            <h2>Trusted by Teams Worldwide</h2>
            <p className="section-description">
              See what our customers are saying about their experience with {appName}
            </p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="star filled" />
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="author-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.svg';
                    }}
                  />
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta section-safe">
        <div className="container-safe">
          <div className="cta-content">
            <h2>Ready to Transform Your Communication?</h2>
            <p>Join thousands of teams already using {appName} to collaborate more effectively</p>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started Free
                <FiArrowRight />
              </Link>
              <Link to="/contact" className="btn btn-outline btn-large">
                Contact Sales
              </Link>
            </div>
            
            <div className="cta-features">
              <div className="cta-feature">
                <FiDownload />
                <span>Free 30-day trial</span>
              </div>
              <div className="cta-feature">
                <FiShield />
                <span>No credit card required</span>
              </div>
              <div className="cta-feature">
                <FiUsers />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <Footer variant="landing" />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default LandingPage;
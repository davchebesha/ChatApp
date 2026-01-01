import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiLinkedin, 
  FiYoutube, 
  FiTwitter, 
  FiMail, 
  FiGithub,
  FiFacebook,
  FiMessageCircle,
  FiSend
} from 'react-icons/fi';
import { useBranding } from '../../contexts/BrandingContext';
import Logo from './Logo';
import './Footer.css';

const Footer = ({ variant = 'default' }) => {
  const { 
    appName, 
    companyName, 
    supportEmail, 
    website, 
    socialMedia 
  } = useBranding();

  const currentYear = new Date().getFullYear();

  // Social media links with proper icons
  const socialLinks = [
    {
      name: 'Facebook',
      icon: <FiFacebook />,
      url: socialMedia?.facebook || 'https://facebook.com',
      color: '#1877f2'
    },
    {
      name: 'WhatsApp',
      icon: <FiMessageCircle />,
      url: socialMedia?.whatsapp || 'https://wa.me/1234567890',
      color: '#25d366'
    },
    {
      name: 'YouTube',
      icon: <FiYoutube />,
      url: socialMedia?.youtube || 'https://youtube.com',
      color: '#ff0000'
    },
    {
      name: 'Telegram',
      icon: <FiSend />,
      url: socialMedia?.telegram || 'https://t.me/nexuschat',
      color: '#0088cc'
    },
    {
      name: 'LinkedIn',
      icon: <FiLinkedin />,
      url: socialMedia?.linkedin || 'https://linkedin.com',
      color: '#0077b5'
    },
    {
      name: 'Twitter',
      icon: <FiTwitter />,
      url: socialMedia?.twitter || 'https://twitter.com',
      color: '#1da1f2'
    }
  ];

  // Different footer variants for different pages
  const isMinimal = variant === 'minimal';
  const isLanding = variant === 'landing';

  if (isMinimal) {
    return (
      <footer className="nexus-footer nexus-footer-minimal">
        <div className="footer-container">
          <div className="footer-minimal-content">
            <div className="footer-brand">
              <Logo size="sm" showText={true} />
            </div>
            <div className="footer-social-minimal">
              {socialLinks.slice(0, 4).map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="social-link-minimal"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ '--social-color': social.color }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <div className="footer-copyright">
              <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`nexus-footer ${isLanding ? 'nexus-footer-landing' : 'nexus-footer-default'}`}>
      {isLanding && (
        <div className="footer-curve">
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path d="M0,200 C300,50 600,50 1200,200 L1200,200 L0,200 Z" fill="currentColor"></path>
          </svg>
        </div>
      )}
      
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section footer-brand-section">
            <Logo size="md" showText={true} />
            <p className="footer-description">
              Professional messaging platform with real-time communication, 
              crystal-clear calls, and seamless collaboration.
            </p>
            
            {/* Enhanced Social Media Section */}
            <div className="footer-social">
              <h4>Connect with us</h4>
              <div className="social-icons">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className={`social-link ${social.name.toLowerCase()}`}
                    aria-label={`Follow us on ${social.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ '--social-color': social.color }}
                    title={`Follow us on ${social.name}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <p className="social-description">
                Stay updated with the latest features and news
              </p>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/security">Security</Link></li>
              <li><Link to="/integrations">Integrations</Link></li>
              <li><Link to="/api">API Documentation</Link></li>
              <li><Link to="/downloads">Downloads</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/press">Press Kit</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/investors">Investors</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/cookies">Cookie Policy</Link></li>
              <li><Link to="/gdpr">GDPR Compliance</Link></li>
              <li><Link to="/accessibility">Accessibility</Link></li>
              <li><Link to="/licenses">Open Source</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Get Started</h4>
            <ul>
              <li>
                <Link to="/register" className="footer-cta-link register">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer-cta-link login">
                  Sign In
                </Link>
              </li>
              <li><Link to="/demo">Request Demo</Link></li>
              <li><Link to="/trial">Free Trial</Link></li>
              <li><Link to="/onboarding">Quick Start Guide</Link></li>
              <li><Link to="/tutorials">Video Tutorials</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/documentation">Documentation</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/status">System Status</Link></li>
              <li>
                <a href={`mailto:${supportEmail}`}>
                  <FiMail style={{ marginRight: '0.5rem' }} />
                  Contact Support
                </a>
              </li>
              <li><Link to="/feedback">Send Feedback</Link></li>
            </ul>
            
            <div className="footer-language">
              <label htmlFor="language-select">Language:</label>
              <select id="language-select" className="language-select">
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ko">한국어 (Korean)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="ru">Русский (Russian)</option>
                <option value="it">Italiano (Italian)</option>
                <option value="tr">Türkçe (Turkish)</option>
                <option value="sw">Kiswahili (Swahili)</option>
                <option value="yo">Yorùbá (Yoruba)</option>
                <option value="ha">Hausa (Hausa)</option>
                <option value="ig">Igbo (Igbo)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
            <p className="footer-tagline">Connecting the world, one message at a time.</p>
          </div>
          <div className="footer-quick-access">
            <Link to="/login" className="footer-quick-btn login">
              Sign In
            </Link>
            <Link to="/register" className="footer-quick-btn register">
              Get Started Free
            </Link>
          </div>
          <div className="footer-links">
            <Link to="/sitemap">Sitemap</Link>
            <span className="separator">•</span>
            <Link to="/accessibility">Accessibility</Link>
            <span className="separator">•</span>
            <Link to="/security">Security</Link>
            <span className="separator">•</span>
            <a href={website} target="_blank" rel="noopener noreferrer">
              {website?.replace('https://', '')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
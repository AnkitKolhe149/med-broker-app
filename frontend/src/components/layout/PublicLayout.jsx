import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../app/App.css';

export default function PublicLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section" style={{cursor: 'pointer'}} onClick={() => navigate('/')}>
              <div className="logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 5L20 35M5 20L35 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" fill="none"/>
                </svg>
              </div>
              <h1 className="logo-text">MedBroker</h1>
            </div>
            <nav className="header-nav">
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#benefits" className="nav-link">Benefits</a>
              <button onClick={() => navigate('/login')} className="btn-outline">Sign In</button>
              <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{minHeight: '60vh', padding: '3rem 0'}}>
        {children}
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4 className="footer-heading">MedBroker</h4>
              <p className="footer-desc">Your trusted partner in medicine marketplace, connecting healthcare providers with quality products.</p>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="/#features">Features</a></li>
                <li><a href="/#benefits">Benefits</a></li>
                <li><a href="/#about">About Us</a></li>
                <li><button onClick={() => navigate('/login')} style={{background:'none', border:'none', padding:0, color: 'var(--text-secondary)', cursor:'pointer'}}>Sign In</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><button onClick={() => navigate('/support/help-center')} style={{background:'none', border:'none', padding:0, color: 'var(--text-secondary)', cursor:'pointer'}}>Help Center</button></li>
                <li><button onClick={() => navigate('/support/contact-us')} style={{background:'none', border:'none', padding:0, color: 'var(--text-secondary)', cursor:'pointer'}}>Contact Us</button></li>
                <li><button onClick={() => navigate('/support/faq')} style={{background:'none', border:'none', padding:0, color: 'var(--text-secondary)', cursor:'pointer'}}>FAQ</button></li>
                <li><button onClick={() => navigate('/support/terms')} style={{background:'none', border:'none', padding:0, color: 'var(--text-secondary)', cursor:'pointer'}}>Terms of Service</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Contact</h4>
              <ul className="footer-links">
                <li>support@medbroker.com</li>
                <li>+91 1800-XXX-XXXX</li>
                <li>24/7 Customer Support</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} MedBroker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

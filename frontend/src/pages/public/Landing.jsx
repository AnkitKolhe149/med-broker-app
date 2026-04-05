import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../app/App.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 5L20 35M5 20L35 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" fill="none"/>
                </svg>
              </div>
              <h1 className="logo-text">MedBroker</h1>
            </div>
            <nav className="header-nav">
              <a href="#features" className="nav-link">Features</a>
              <a href="#benefits" className="nav-link">Benefits</a>
              <a href="#about" className="nav-link">About</a>
              <button onClick={() => navigate('/login')} className="btn-outline">Sign In</button>
              <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Your Trusted Partner in
                <span className="highlight"> Medicine Marketplace</span>
              </h1>
              <p className="hero-subtitle">
                Connect with verified vendors, access quality medicines, and streamline your healthcare supply chain with MedBroker's advanced B2B/B2C platform.
              </p>
              <div className="hero-buttons">
                <button onClick={() => navigate('/register')} className="btn-hero-primary">
                  Start Your Journey
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 5L15 10L10 15M15 10L5 10"/>
                  </svg>
                </button>
                <button onClick={() => navigate('/login')} className="btn-hero-secondary">
                  Sign In
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Verified Vendors</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Products</div>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="floating-card card-1">
                <div className="card-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                  </svg>
                </div>
                <div className="card-text">
                  <div className="card-title">Verified</div>
                  <div className="card-desc">100% Authentic</div>
                </div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z"/>
                  </svg>
                </div>
                <div className="card-text">
                  <div className="card-title">Fast Delivery</div>
                  <div className="card-desc">24-48 Hours</div>
                </div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div className="card-text">
                  <div className="card-title">Best Prices</div>
                  <div className="card-desc">Competitive Rates</div>
                </div>
              </div>
              <div className="floating-card card-4">
                <div className="card-icon orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm2-1.645A3.502 3.502 0 0 0 12 6.5a3.501 3.501 0 0 0-3.433 2.813l1.962.393A1.5 1.5 0 1 1 12 11.5a1 1 0 0 0-1 1V14h2v-.645z"/>
                  </svg>
                </div>
                <div className="card-text">
                  <div className="card-title">24/7 Support</div>
                  <div className="card-desc">Always Available</div>
                </div>
              </div>
              <div className="floating-card card-5">
                <div className="card-icon teal">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                  </svg>
                </div>
                <div className="card-text">
                  <div className="card-title">Secure Payment</div>
                  <div className="card-desc">100% Protected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose MedBroker?</h2>
            <p className="section-subtitle">Comprehensive features designed for modern healthcare supply chain</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon green-gradient">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                </svg>
              </div>
              <h3 className="feature-title">Verified Vendors</h3>
              <p className="feature-desc">All vendors are thoroughly verified with GSTIN and Drug License validation for your safety.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon blue-gradient">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path d="M2 17L12 22L22 17"/>
                  <path d="M2 12L12 17L22 12"/>
                </svg>
              </div>
              <h3 className="feature-title">Bulk Orders</h3>
              <p className="feature-desc">Special pricing for wholesale buyers with flexible payment terms and discount options.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple-gradient">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
                </svg>
              </div>
              <h3 className="feature-title">Real-time Tracking</h3>
              <p className="feature-desc">Track your orders in real-time from dispatch to delivery with instant notifications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange-gradient">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                </svg>
              </div>
              <h3 className="feature-title">AI Assistant</h3>
              <p className="feature-desc">Get intelligent recommendations and instant support from our AI-powered chatbot.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal-gradient">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className="feature-title">Multi-Role Access</h3>
              <p className="feature-desc">Separate dashboards for customers, vendors, and admins with role-based permissions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon pink-gradient">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 11L12 14L22 4"/>
                </svg>
              </div>
              <h3 className="feature-title">Secure Payments</h3>
              <p className="feature-desc">Multiple payment options with encrypted transactions and automated invoice generation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefit-block customer-block">
              <div className="benefit-header">
                <div className="benefit-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"/>
                  </svg>
                </div>
                <h3>For Customers</h3>
              </div>
              <ul className="benefit-list">
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Access to 50,000+ verified medicines
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Competitive pricing for retail and wholesale
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  24/7 customer support and AI chatbot
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Fast delivery and order tracking
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Digital invoices and payment receipts
                </li>
              </ul>
              <button onClick={() => navigate('/register')} className="benefit-btn customer-btn">
                Register as Customer
              </button>
            </div>

            <div className="benefit-block vendor-block">
              <div className="benefit-header">
                <div className="benefit-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6H17L15 4H9L7 6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"/>
                  </svg>
                </div>
                <h3>For Vendors</h3>
              </div>
              <ul className="benefit-list">
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Reach 10,000+ active customers
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Easy inventory management system
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Automated order processing
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Analytics and sales reports
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 10L9 12L13 8"/>
                  </svg>
                  Secure payment gateway integration
                </li>
              </ul>
              <button onClick={() => navigate('/register')} className="benefit-btn vendor-btn">
                Register as Vendor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-content">
            <div className="trust-text">
              <h2 className="trust-title">Trusted by Healthcare Professionals</h2>
              <p className="trust-desc">
                MedBroker is the preferred platform for pharmacies, hospitals, distributors, and healthcare providers across the country. Our commitment to quality, transparency, and reliability has made us the leader in medicine marketplace solutions.
              </p>
              <div className="trust-features">
                <div className="trust-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                  </svg>
                  <span>100% Verified Products</span>
                </div>
                <div className="trust-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                  </svg>
                  <span>Secure Transactions</span>
                </div>
                <div className="trust-feature">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                  </svg>
                  <span>Licensed Vendors Only</span>
                </div>
              </div>
            </div>
            <div className="trust-stats-grid">
              <div className="trust-stat">
                <div className="trust-stat-number">99.8%</div>
                <div className="trust-stat-label">Customer Satisfaction</div>
              </div>
              <div className="trust-stat">
                <div className="trust-stat-number">24/7</div>
                <div className="trust-stat-label">Support Available</div>
              </div>
              <div className="trust-stat">
                <div className="trust-stat-number">2M+</div>
                <div className="trust-stat-label">Orders Delivered</div>
              </div>
              <div className="trust-stat">
                <div className="trust-stat-number">150+</div>
                <div className="trust-stat-label">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-subtitle">Join thousands of customers and vendors on India's most trusted medicine marketplace</p>
            <button onClick={() => navigate('/register')} className="cta-button">
              Create Your Account
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 5L15 10L10 15M15 10L5 10"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

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
                <li><a href="#features">Features</a></li>
                <li><a href="#benefits">Benefits</a></li>
                <li><a href="#about">About Us</a></li>
                <li><button onClick={() => navigate('/login')}>Sign In</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><a href="/support/help-center" onClick={(e) => { e.preventDefault(); navigate('/support/help-center'); }}>Help Center</a></li>
                <li><a href="/support/contact-us" onClick={(e) => { e.preventDefault(); navigate('/support/contact-us'); }}>Contact Us</a></li>
                <li><a href="/support/faq" onClick={(e) => { e.preventDefault(); navigate('/support/faq'); }}>FAQ</a></li>
                <li><a href="/support/terms" onClick={(e) => { e.preventDefault(); navigate('/support/terms'); }}>Terms of Service</a></li>
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
            <p>&copy; 2026 MedBroker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../app/App.css';
import {
  ArrowRight, BadgeCheck, Zap, Star, Headphones,
  ShieldCheck, Layers, MessageCircle, Users, Wallet,
  Check, Store
} from 'lucide-react';

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
                  <path d="M20 5L20 35M5 20L35 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </div>
              <h1 className="logo-text">MedIQ</h1>
            </div>
            <nav className="header-nav">
              <a href="#features" className="nav-link">Features</a>
              <a href="#benefits" className="nav-link">Benefits</a>
              <button onClick={() => navigate('/about')} className="nav-link">About</button>
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
                Connect with verified vendors, access quality medicines, and streamline your healthcare supply chain with MedIQ's advanced B2B/B2C platform.
              </p>
              <div className="hero-buttons">
                <button onClick={() => navigate('/register')} className="btn-hero-primary">
                  Start Your Journey
                  <ArrowRight size={20} />
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
                  <BadgeCheck size={24} />
                </div>
                <div className="card-text">
                  <div className="card-title">Verified</div>
                  <div className="card-desc">100% Authentic</div>
                </div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon blue">
                  <Zap size={24} />
                </div>
                <div className="card-text">
                  <div className="card-title">Fast Delivery</div>
                  <div className="card-desc">24-48 Hours</div>
                </div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon purple">
                  <Star size={24} />
                </div>
                <div className="card-text">
                  <div className="card-title">Best Prices</div>
                  <div className="card-desc">Competitive Rates</div>
                </div>
              </div>
              <div className="floating-card card-4">
                <div className="card-icon orange">
                  <Headphones size={24} />
                </div>
                <div className="card-text">
                  <div className="card-title">24/7 Support</div>
                  <div className="card-desc">Always Available</div>
                </div>
              </div>
              <div className="floating-card card-5">
                <div className="card-icon teal">
                  <ShieldCheck size={24} />
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
            <h2 className="section-title">Why Choose MedIQ?</h2>
            <p className="section-subtitle">Comprehensive features designed for modern healthcare supply chain</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon green-gradient">
                <BadgeCheck size={32} />
              </div>
              <h3 className="feature-title">Verified Vendors</h3>
              <p className="feature-desc">All vendors are thoroughly verified with GSTIN and Drug License validation for your safety.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon blue-gradient">
                <Layers size={32} />
              </div>
              <h3 className="feature-title">Bulk Orders</h3>
              <p className="feature-desc">Special pricing for wholesale buyers with flexible payment terms and discount options.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple-gradient">
                <Zap size={32} />
              </div>
              <h3 className="feature-title">Real-time Tracking</h3>
              <p className="feature-desc">Track your orders in real-time from dispatch to delivery with instant notifications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange-gradient">
                <MessageCircle size={32} />
              </div>
              <h3 className="feature-title">AI Assistant</h3>
              <p className="feature-desc">Get intelligent recommendations and instant support from our AI-powered chatbot.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal-gradient">
                <Users size={32} />
              </div>
              <h3 className="feature-title">Multi-Role Access</h3>
              <p className="feature-desc">Separate dashboards for customers, vendors, and admins with role-based permissions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon pink-gradient">
                <Wallet size={32} />
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
                  <Users size={48} />
                </div>
                <h3>For Customers</h3>
              </div>
              <ul className="benefit-list">
                <li>
                  <Check size={20} />
                  Access to 50,000+ verified medicines
                </li>
                <li>
                  <Check size={20} />
                  Competitive pricing for retail and wholesale
                </li>
                <li>
                  <Check size={20} />
                  24/7 customer support and AI chatbot
                </li>
                <li>
                  <Check size={20} />
                  Fast delivery and order tracking
                </li>
                <li>
                  <Check size={20} />
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
                  <Store size={48} />
                </div>
                <h3>For Vendors</h3>
              </div>
              <ul className="benefit-list">
                <li>
                  <Check size={20} />
                  Reach 10,000+ active customers
                </li>
                <li>
                  <Check size={20} />
                  Easy inventory management system
                </li>
                <li>
                  <Check size={20} />
                  Automated order processing
                </li>
                <li>
                  <Check size={20} />
                  Analytics and sales reports
                </li>
                <li>
                  <Check size={20} />
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
                MedIQ is the preferred platform for pharmacies, hospitals, distributors, and healthcare providers across the country. Our commitment to quality, transparency, and reliability has made us the leader in medicine marketplace solutions.
              </p>
              <div className="trust-features">
                <div className="trust-feature">
                  <ShieldCheck size={24} />
                  <span>100% Verified Products</span>
                </div>
                <div className="trust-feature">
                  <ShieldCheck size={24} />
                  <span>Secure Transactions</span>
                </div>
                <div className="trust-feature">
                  <ShieldCheck size={24} />
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
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4 className="footer-heading">MedIQ</h4>
              <p className="footer-desc">Your trusted partner in medicine marketplace, connecting healthcare providers with quality products.</p>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#benefits">Benefits</a></li>
                <li><button onClick={() => navigate('/about')}>About Us</button></li>
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
                <li>support@mediq.com</li>
                <li>+91 1800-XXX-XXXX</li>
                <li>24/7 Customer Support</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 MedIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

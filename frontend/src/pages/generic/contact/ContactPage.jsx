import React, { useState } from 'react';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('sent');
      alert('Message received.');
    }, 1500);
  };

  return (
    <div className="page-wrapper">
      {/* --- Navbar --- */}
      <nav className="navbar">
        <div className="container nav-container">
            <div className="brand">
              {/* Simple Text Logo matching MedAI */}
              <span className="logo-text">MedAI</span>
            </div>
            <div className="nav-links">
              <a href="#about" className="nav-link">About Us</a>
              <a href="#mission" className="nav-link">Mission</a>
              <a href="#vision" className="nav-link">Vision</a>
              <a href="#contact" className="nav-link" style={{color: 'var(--primary)', fontWeight: 'bold'}}>Contact</a>
            </div>
        </div>
      </nav>

      {/* --- Header --- */}
      <header className="hero-section">
        <div className="container">
            <h1 className="hero-title">Contact Us</h1>
            <p className="hero-subtitle">We are building an AI-driven pharmaceutical platform. Reach out to us for partnerships and inquiries.</p>
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="main-content">
        <div className="container content-grid">
          
          {/* Left: Contact Form (Clean White) */}
          <section className="card form-card">
            <h2>Send a Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  placeholder="Ex. Amit Saw"
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="amit@medai.com"
                />
              </div>

              <div className="input-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange} 
                  placeholder="Partnership Inquiry"
                />
              </div>

              <div className="input-group">
                <label>Message</label>
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange} 
                  rows="5" 
                  placeholder="How can we collaborate?"
                ></textarea>
              </div>

              <button type="submit" className={`submit-btn ${status}`}>
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>

          {/* Right: Info Card (Mint Green Background) */}
          <section className="card info-card">
            <h2>Get in Touch</h2>
            <div className="info-content">
              <div className="info-item">
                <div className="icon-box">✉️</div>
                <div>
                  <h3>Email</h3>
                  <p>shubham@medai.com</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon-box">📍</div>
                <div>
                  <h3>Headquarters</h3>
                  <p>RCOEM,<br/>Nagpur, India</p>
                </div>
              </div>

              <div className="info-item">
                <div className="icon-box">💼</div>
                <div>
                  <h3>Careers</h3>
                  <p>Join our team of AI experts.</p>
                </div>
              </div>
            </div>

            {/* Google Map (Standard Color) */}
            <div className="map-container" style={{ marginTop: '2rem', height: '200px', width: '100%' }}>
              <iframe 
                title="Google Map"
                width="100%" 
                height="100%" 
                style={{ border: 0, borderRadius: '8px' }} 
                loading="lazy" 
                allowFullScreen
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3720.3908650295393!2d79.05904737623315!3d21.176626382681537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c1a8970c08e9%3A0xfe4a9c97e7e671cb!2sShri%20Ramdeobaba%20College%20of%20Engineering%20and%20Management!5e0!3m2!1sen!2sin!4v1770665972033!5m2!1sen!2sin"
              ></iframe>
            </div>
          </section>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="copyright">
            © 2026 MedAI Inc. All rights reserved.
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
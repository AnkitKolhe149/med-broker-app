import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';

const IconMapPin = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconPhoneCall = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const IconMail = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default function ContactUs() {
  return (
    <PublicLayout>
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>Get in Touch</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Whether you have a question about our platform, pricing, or need assistance connecting with a vendor, our team is ready to answer all your questions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
          
          {/* Left Column - Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="card-soft">
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.5rem' }}>Contact Information</h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--green-100)', padding: '0.8rem', borderRadius: '50%', height: 'fit-content' }}><IconMapPin /></div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Headquarters</h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    MedBroker Technologies Pvt. Ltd.<br/>
                    401, Healthcare Tech Park,<br/>
                    Andheri East, Mumbai 400069<br/>
                    Maharashtra, India
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--green-100)', padding: '0.8rem', borderRadius: '50%', height: 'fit-content' }}><IconPhoneCall /></div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Phone Support</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>Toll Free: 1800-456-7890</p>
                  <p style={{ color: 'var(--text-secondary)' }}>WhatsApp: +91 98765 43210</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--green-100)', padding: '0.8rem', borderRadius: '50%', height: 'fit-content' }}><IconMail /></div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Email</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>support@medbroker.com (General)</p>
                  <p style={{ color: 'var(--text-secondary)' }}>vendors@medbroker.com (Vendor Setup)</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ background: 'var(--green-100)', padding: '0.8rem', borderRadius: '50%', height: 'fit-content' }}><IconClock /></div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Operating Hours</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>Mon - Sat: 9:00 AM - 8:00 PM (IST)</p>
                  <p style={{ color: 'var(--text-secondary)' }}>Sun: Critical Emergency Support Only</p>
                </div>
              </div>
              
            </div>

            {/* Social Proof / Security */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--green-600) 0%, var(--green-800) 100%)', color: 'white', border: 'none' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'white' }}>Enterprise Partnership?</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Are you a hospital chain or a large pharmaceutical distributor? Our enterprise team can help set up custom supply chain integrations.
              </p>
              <button className="button-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', background: 'rgba(255,255,255,0.1)' }}>Schedule a Demo</button>
            </div>
            
          </div>

          {/* Right Column - Contact Form */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Send us a Message</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We typically respond within 2-4 hours during business days.</p>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="label" style={{ fontWeight: '600' }}>First Name</label>
                  <input type="text" className="input" placeholder="e.g. Rahul" />
                </div>
                <div>
                  <label className="label" style={{ fontWeight: '600' }}>Last Name</label>
                  <input type="text" className="input" placeholder="e.g. Sharma" />
                </div>
              </div>
              
              <div>
                <label className="label" style={{ fontWeight: '600' }}>Email Address <span style={{ color: 'red' }}>*</span></label>
                <input type="email" className="input" placeholder="name@company.com" required />
              </div>
              
              <div>
                <label className="label" style={{ fontWeight: '600' }}>How can we help? <span style={{ color: 'red' }}>*</span></label>
                <select className="select" required>
                  <option value="">Select a topic...</option>
                  <option value="customer_support">I need help with an order I placed</option>
                  <option value="vendor_onboarding">I want to become a verified vendor</option>
                  <option value="billing">Question about billing or invoices</option>
                  <option value="technical">Technical issue with the platform</option>
                  <option value="other">Other inquiries</option>
                </select>
              </div>
              
              <div>
                <label className="label" style={{ fontWeight: '600' }}>Message <span style={{ color: 'red' }}>*</span></label>
                <textarea className="textarea" placeholder="Please provide as much detail as possible so we can best assist you..." style={{ minHeight: '150px' }} required></textarea>
              </div>

              {/* Attachments Placeholder */}
              <div style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center', cursor: 'pointer', background: 'var(--surface-dark)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>+ Attach screenshots or documents (optional)</p>
              </div>
              
              <button type="button" className="button button-success" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                Send Message
              </button>
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '1rem' }}>
                By submitting this form, you agree to our <a href="/support/terms" style={{ color: 'var(--primary)' }}>Terms of Service</a> and Privacy Policy.
              </p>
            </form>
          </div>
          
        </div>
      </div>
    </PublicLayout>
  );
}

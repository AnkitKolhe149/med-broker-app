import React, { useState, useEffect } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('acceptance');

  // Simple intersection observer logic for highlighting active section could be added here
  // For now, we'll keep it simple with click-to-scroll
  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'roles', label: '2. User Accounts & Roles' },
    { id: 'medical', label: '3. Medical Disclaimers' },
    { id: 'transactions', label: '4. Transactions & Liability' },
    { id: 'prohibited', label: '5. Prohibited Items' },
    { id: 'privacy', label: '6. Privacy & Data' },
    { id: 'disputes', label: '7. Dispute Resolution' },
  ];

  return (
    <PublicLayout>
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1rem' }}>Terms of Service</h1>
          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>Effective Date:</strong> January 1, 2026</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>Last Updated:</strong> April 5, 2026</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '4rem', alignItems: 'start' }}>
          
          {/* Sticky Sidebar Navigation */}
          <div style={{ position: 'sticky', top: '100px' }} className="hide-on-mobile">
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '1rem' }}>Contents</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.map(item => (
                <li key={item.id}>
                  <button 
                    onClick={() => scrollTo(item.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      padding: '0.5rem 0', 
                      textAlign: 'left', 
                      width: '100%',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: activeSection === item.id ? '600' : '400',
                      color: activeSection === item.id ? 'var(--primary)' : 'var(--text-secondary)',
                      borderLeft: activeSection === item.id ? '2px solid var(--primary)' : '2px solid transparent',
                      paddingLeft: '1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Legal Content */}
          <div className="legal-content">
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2rem' }}>
              Welcome to MedBroker. Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the MedBroker website and mobile application (the "Service") operated by MedBroker Technologies Pvt. Ltd. ("us", "we", or "our").
            </p>
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '3rem' }}>
              Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, vendors, and others who access or use the Service.
            </p>

            <section id="acceptance" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service. If you are accessing the platform on behalf of a business entity (such as a pharmacy or hospital), you represent that you have the authority to bind that entity to these Terms.
              </p>
            </section>

            <section id="roles" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>2. User Accounts & Roles</h2>
              <h3 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.5rem' }}>2.1 Registration</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <h3 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.5rem' }}>2.2 Customer Accounts</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                Buyers are responsible for providing valid prescriptions where required under applicable law (e.g., Schedule H, H1, X drugs in India).
              </p>
              <h3 style={{ fontSize: '1.2rem', margin: '1.5rem 0 0.5rem' }}>2.3 Vendor Accounts</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                Vendors must maintain active licenses (GSTIN, Drug License) at all times while active on the platform. MedBroker reserves the right to suspend vendor accounts if state or federal licenses expire or are revoked.
              </p>
            </section>

            <section id="medical" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>3. Medical Disclaimers</h2>
              <div style={{ background: 'var(--green-50)', padding: '1.5rem', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>
                  MedBroker is a technology platform connecting buyers and sellers. We do not manufacture, prescribe, or physically handle any medicines. The Content on our platform is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

            <section id="transactions" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>4. Transactions & Liability</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                MedBroker acts solely as a facilitator for the transaction between the Buyer and the Vendor. The Contract of Sale is strictly a bipartite contract between the Buyer and Vendor. MedBroker shall not be liable for the quality, safety, or legality of the items advertised or the truth or accuracy of the listings.
              </p>
            </section>

            <section id="prohibited" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>5. Prohibited Items</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                Vendors are strictly prohibited from listing:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.7', paddingLeft: '1.5rem' }}>
                <li>Narcotic drugs lacking appropriate Schedule X specific licensing.</li>
                <li>Counterfeit or suspiciously sourced medications.</li>
                <li>Expired medicines (unless explicitly listed under authorized disposal contracts).</li>
                <li>Any product banned by the FDA or CDSCO.</li>
              </ul>
            </section>
            
            <section id="privacy" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>6. Privacy & Data</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                Your use of the Service is also governed by our Privacy Policy. We take data protection seriously, specifically concerning patient prescriptions and health-related data, which are encrypted and handled in compliance with applicable healthcare data privacy laws.
              </p>
            </section>
            
            <section id="disputes" style={{ scrollMarginTop: '100px', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>7. Dispute Resolution</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
                Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.
              </p>
            </section>

          </div>
        </div>
        
      </div>
    </PublicLayout>
  );
}

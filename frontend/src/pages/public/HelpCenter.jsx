import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';

// Mock icons as SVG strings for better reusability without external dependencies
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconFileText = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const IconTruck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const IconRefresh = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const IconUserCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline>
  </svg>
);

const IconCreditCard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const IconSettings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'getting-started', title: 'Getting Started', desc: 'Guide to set up your account', icon: <IconFileText /> },
    { id: 'orders-tracking', title: 'Orders & Tracking', desc: 'Manage and track your medicine orders', icon: <IconTruck /> },
    { id: 'returns-refunds', title: 'Returns & Refunds', desc: 'Policies for damaged or incorrect items', icon: <IconRefresh /> },
    { id: 'vendor-resources', title: 'Vendor Resources', desc: 'KYC, listing products, and payouts', icon: <IconUserCheck /> },
    { id: 'billing-payments', title: 'Billing & Payments', desc: 'Invoices, methods, and dispute management', icon: <IconCreditCard /> },
    { id: 'account-settings', title: 'Account Settings', desc: 'Manage profile, passwords, and security', icon: <IconSettings /> },
  ];

  const popularArticles = [
    "How to verify my pharmacy license?",
    "What is the return window for prescription medicines?",
    "Tracking an order that is marked 'Delayed'",
    "Bulk ordering process and wholesale discounts",
    "How do I reset my password?",
    "Understanding the vendor commission structure"
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--primary-light)', padding: '4rem 1rem', textAlign: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary-dark)', fontWeight: '700' }}>How can we help?</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Search through our knowledge base or browse categories below to find answers.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: '0.5rem 1rem', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-light)', marginRight: '0.5rem' }}><IconSearch /></span>
            <input 
              type="text" 
              placeholder="Search for articles, guides, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', padding: '0.75rem', fontSize: '1.1rem', outline: 'none', background: 'transparent' }}
            />
            <button className="button button-success" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)' }}>Search</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Categories Grid */}
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Browse by Topic</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {categories.map((cat, idx) => (
            <div key={idx} className="card-soft" 
                 onClick={() => navigate(`/support/help-center/${cat.id}`)}
                 style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', transition: 'all 0.3s' }} 
                 onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(21, 115, 71, 0.14)'; }}>
              <div style={{ background: 'var(--green-100)', padding: '1rem', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {cat.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{cat.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Popular Articles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
            {popularArticles.map((article, idx) => (
              <a key={idx} href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)', transition: 'background 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.background = 'var(--green-50)'}
                 onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ color: 'var(--primary)' }}><IconFileText /></span>
                <span style={{ fontWeight: 500 }}>{article}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem', background: 'linear-gradient(135deg, var(--green-50) 0%, white 100%)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Still need help?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Our dedicated support team is available 24/7 to assist you with any questions or issues you might have.
          </p>
          <a href="/support/contact-us" className="button button-outline">Contact Support Team</a>
        </div>
        
      </div>
    </PublicLayout>
  );
}

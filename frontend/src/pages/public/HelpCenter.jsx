import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';

import {
  Search, FileText, Truck,
  RefreshCw, UserCheck, CreditCard, Settings
} from 'lucide-react';

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'getting-started', title: 'Getting Started', desc: 'Guide to set up your account', icon: <FileText size={20} strokeWidth={1.5} /> },
    { id: 'orders-tracking', title: 'Orders & Tracking', desc: 'Manage and track your medicine orders', icon: <Truck size={20} strokeWidth={1.5} /> },
    { id: 'returns-refunds', title: 'Returns & Refunds', desc: 'Policies for damaged or incorrect items', icon: <RefreshCw size={20} strokeWidth={1.5} /> },
    { id: 'vendor-resources', title: 'Vendor Resources', desc: 'KYC, listing products, and payouts', icon: <UserCheck size={20} strokeWidth={1.5} /> },
    { id: 'billing-payments', title: 'Billing & Payments', desc: 'Invoices, methods, and dispute management', icon: <CreditCard size={20} strokeWidth={1.5} /> },
    { id: 'account-settings', title: 'Account Settings', desc: 'Manage profile, passwords, and security', icon: <Settings size={20} strokeWidth={1.5} /> },
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
            <span style={{ color: 'var(--text-light)', marginRight: '0.5rem' }}><Search size={20} strokeWidth={1.5} /></span>
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
                <span style={{ color: 'var(--primary)' }}><FileText size={20} strokeWidth={1.5} /></span>
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

import React, { useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div style={{ 
      border: '1px solid var(--border)', 
      borderRadius: 'var(--radius)', 
      marginBottom: '1rem', 
      background: isOpen ? 'var(--green-50)' : 'white',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      <button 
        onClick={onClick}
        style={{ 
          width: '100%', 
          padding: '1.25rem 1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {question}
        </span>
        <span style={{ 
          color: 'var(--primary)', 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
          transition: 'transform 0.3s ease',
          display: 'flex'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>
      
      <div style={{ 
        maxHeight: isOpen ? '500px' : '0', 
        opacity: isOpen ? 1 : 0, 
        padding: isOpen ? '0 1.5rem 1.25rem 1.5rem' : '0 1.5rem', 
        transition: 'all 0.3s ease',
        color: 'var(--text-secondary)',
        lineHeight: '1.6'
      }}>
        {answer}
      </div>
    </div>
  );
};

export default function FAQ() {
  const [activeTab, setActiveTab] = useState('general');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { id: 'general', label: 'General Info' },
    { id: 'customers', label: 'For Customers (Buyers)' },
    { id: 'vendors', label: 'For Vendors (Sellers)' },
    { id: 'trust', label: 'Trust & Safety' }
  ];

  const faqs = {
    general: [
      {
        id: 'g1',
        q: "What exactly is MedBroker?",
        a: "MedBroker is India's leading B2B and B2C digital marketplace specifically built for the healthcare supply chain. We connect retail pharmacies, hospitals, and individual buyers directly with verified medical distributors and manufacturers."
      },
      {
        id: 'g2',
        q: "Are the medicines sold on MedBroker authentic?",
        a: "Yes, 100%. MedBroker strictly operates on a closed-loop verification system. Every single vendor on our platform must submit active GSTIN and Drug License documentation before they can list a single product. We guarantee that all products source from authorized channels."
      },
      {
        id: 'g3',
        q: "How does the pricing work?",
        a: "Because our platform connects you directly with distributors and stockists, bypassing multiple middlemen, the prices you see are often significantly lower than standard wholesale/retail rates. MedBroker charges a small transparent commission to the vendor, meaning buyers pay the exact listed price with zero hidden fees."
      }
    ],
    customers: [
      {
        id: 'c1',
        q: "Do I need a prescription to buy medicines?",
        a: "For Schedule H and H1 drugs, a valid doctor's prescription is absolutely mandatory. You must upload a clear image of the prescription during checkout. Our team of registered pharmacists will verify it before the vendor is allowed to dispatch the order."
      },
      {
        id: 'c2',
        q: "How long does delivery take?",
        a: "Delivery timelines depend on the vendor's location relative to yours. Intra-city orders are usually delivered within 24 hours. Inter-city shipments generally take 2-4 business days. You will receive a tracking link the moment your order is dispatched."
      },
      {
        id: 'c3',
        q: "What happens if a medicine arrives damaged or near expiry?",
        a: "You are fully protected. Under our 'Freshness Guarantee', if any medicine arrives physically damaged or with less than 6 months of expiry shelf-life (unless explicitly stated otherwise during purchase), you are entitled to a zero-questions-asked complete refund or replacement within 48 hours of delivery."
      }
    ],
    vendors: [
      {
        id: 'v1',
        q: "What documents do I need to register as a Vendor?",
        a: "You will need: 1) A valid Drug License (Form 20B, 21B or equivalent), 2) GST Registration Certificate, 3) PAN Card of the business entity, 4) A Cancelled Cheque for payout setup. Verification usually takes 24-48 hours."
      },
      {
        id: 'v2',
        q: "When and how do I receive payouts for my sales?",
        a: "Payouts are settled on a T+2 basis (Transaction + 2 working days) after the order is marked as 'Delivered' to the customer. Funds are directly transferred to your registered bank account via NEFT/RTGS with automated settlement reports."
      },
      {
        id: 'v3',
        q: "Can I manage bulk inventory updates?",
        a: "Yes. In the Vendor Dashboard, you can download our standard CSV/Excel template, map your current inventory software data to it, and bulk upload thousands of SKUs in seconds."
      }
    ],
    trust: [
      {
        id: 't1',
        q: "Is my payment information secure?",
        a: "MedBroker uses bank-level 256-bit encryption and partners with leading RBI-approved payment gateways (like Razorpay/Stripe). We never store your raw credit card or bank account details on our servers."
      },
      {
        id: 't2',
        q: "How are disputes resolved?",
        a: "If a dispute arises between a buyer and vendor, our mediation team steps in. Funds are held in escrow until the dispute is resolved based on platform policies, chat logs, and delivery proofs."
      }
    ]
  };

  return (
    <PublicLayout>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--green-100)', color: 'var(--primary-dark)', borderRadius: '99px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem' }}>
            Knowledge Base
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Frequently Asked Questions</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
            Find quick answers to the most common questions about the MedBroker platform, orders, vendor onboarding, and more.
          </p>
        </div>

        {/* Categories Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.8rem 1.5rem',
                borderRadius: '99px',
                border: activeTab === tab.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: activeTab === tab.id ? 'var(--primary)' : 'white',
                color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQs List */}
        <div className="reveal" style={{ minHeight: '400px' }}>
          {faqs[activeTab].map((faq) => (
            <AccordionItem 
              key={faq.id}
              question={faq.q}
              answer={faq.a}
              isOpen={!!openItems[faq.id]}
              onClick={() => toggleItem(faq.id)}
            />
          ))}
        </div>
        
        {/* Helper Footer */}
        <div style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Can't find what you're looking for?</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Our customer support team is ready to help your business grow.</p>
          </div>
          <a href="/support/contact-us" className="button button-success">Talk to Support</a>
        </div>
        
      </div>
    </PublicLayout>
  );
}

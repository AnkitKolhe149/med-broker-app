import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';

const IconArrowLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const helpDocuments = {
  'getting-started': {
    title: 'Getting Started with MedBroker',
    lastUpdated: '10 days ago',
    content: (
      <>
        <h3>Introduction</h3>
        <p>Welcome to MedBroker, the premier B2B and B2C marketplace for pharmaceutical products. This guide will walk you through setting up your account so you can start browsing and purchasing medicines.</p>
        
        <h3>Step 1: Account Registration</h3>
        <p>To begin, click on the <strong>Register</strong> button at the top right of the homepage. You will be prompted to choose whether you are creating a Customer (Buyer) or Vendor (Seller) account. For customers, simply provide your full name, email address, and a secure password.</p>
        
        <h3>Step 2: Profile Verification</h3>
        <p>Before placing any orders, especially for prescription medicines, you must verify your identity. 
        <ul>
          <li>Go to your <strong>Dashboard</strong> {'>'} <strong>Profile Settings</strong>.</li>
          <li>Enter your active mobile number and verify it via OTP.</li>
          <li>Add a default shipping address.</li>
        </ul>
        </p>

        <h3>Step 3: Browsing the Marketplace</h3>
        <p>Use the global search bar to look up specific drug compositions or brand names. Our AI engine will automatically highlight verified sellers offering the best rates near your location.</p>
        
        <div style={{ background: 'var(--green-50)', padding: '1rem', borderLeft: '4px solid var(--primary)', marginTop: '2rem' }}>
          <strong>Pro Tip:</strong> Look for the "Verified Badge" next to a seller's name to guarantee they have an active drug license on file with us.
        </div>
      </>
    )
  },
  'orders-tracking': {
    title: 'Orders & Tracking Guide',
    lastUpdated: '5 days ago',
    content: (
      <>
        <h3>Understanding Your Order Status</h3>
        <p>Once you place an order, it goes through several stages. You can monitor these in real-time under the <strong>My Orders</strong> tab of your dashboard.</p>
        <ul>
          <li><strong>Pending:</strong> Order received, waiting for vendor confirmation or prescription check.</li>
          <li><strong>Processing:</strong> Vendor is packing the items and preparing for dispatch.</li>
          <li><strong>Dispatched:</strong> Order handed over to our logistics partner.</li>
          <li><strong>Delivered:</strong> Package successfully received at your address.</li>
        </ul>

        <h3>How to Track an Order</h3>
        <p>As soon as an order is marked as "Dispatched", a unique 12-digit Tracking ID is generated. You will receive an SMS and email with a live tracking link. You can also click the "Track Order" button directly from your dashboard map interface.</p>

        <h3>Prescription Uploads</h3>
        <p>If your order contains Schedule H/H1 drugs, the order will remain in "Pending" status until our in-house pharmacists review and approve the prescription you uploaded during checkout. If the prescription is invalid, the order will be auto-cancelled within 24 hours.</p>
      </>
    )
  },
  'returns-refunds': {
    title: 'Returns & Refunds Policy',
    lastUpdated: '1 month ago',
    content: (
      <>
        <h3>Our 48-Hour Guarantee</h3>
        <p>We pride ourselves on the quality of our network, but if something goes wrong, we've got you covered. You can initiate a return request within <strong>48 hours</strong> of the delivery timestamp.</p>

        <h3>Valid Reasons for Return</h3>
        <p>You may request a full refund or replacement under the following conditions:</p>
        <ul>
          <li>The delivered medicine is physically damaged (broken seals, crushed boxes).</li>
          <li>The medicine delivered does not match the prescription/order.</li>
          <li>The product has less than 6 months of expiry remaining (unless explicitly noted as short-expiry during sale).</li>
        </ul>

        <h3>How to Initiate a Refund</h3>
        <p>Go to your <strong>My Orders</strong> page, select the specific order, and click "Request Return". You will be asked to upload 2 clear photos of the product and packaging. Once approved by our team (usually within 12 hours), a pickup will be arranged.</p>
        
        <h3>Refund Timelines</h3>
        <p>Refunds are processed to the original payment source over a period of T+3 working days after the returned product reaches the vendor facility.</p>
      </>
    )
  },
  'vendor-resources': {
    title: 'Vendor Onboarding & Resources',
    lastUpdated: '2 weeks ago',
    content: (
      <>
        <h3>Welcome Vendors</h3>
        <p>MedBroker connects your pharmacy or distribution center to thousands of buyers every day. Maintaining compliance is our top priority.</p>

        <h3>Required Documentation for Verification</h3>
        <p>Before your storefront goes live, our trust & safety team must verify:</p>
        <ul>
          <li><strong>Drug License:</strong> Form 20B/21B or regional equivalent. Must be valid for at least the next 3 months.</li>
          <li><strong>GST Certificate:</strong> Name must match the drug license entity.</li>
          <li><strong>Bank Details:</strong> Cancelled cheque for T+2 automated payout settlements.</li>
        </ul>

        <h3>Managing Inventory (Bulk Upload)</h3>
        <p>We do not expect you to manually input 10,000 SKUs. On your Vendor Dashboard, navigate to <strong>Inventory {'>'} Bulk Edit</strong>. You can download our standard CSV macro. Map your ERP stock quantities and prices, and upload the file. Our system processes up to 50,000 rows in under 2 minutes.</p>

        <h3>Commission Structure</h3>
        <p>We charge a flat 3.5% transaction fee on the gross cart value. There are no monthly listing fees or hidden charges.</p>
      </>
    )
  },
  'billing-payments': {
    title: 'Billing & Payments Guide',
    lastUpdated: '1 month ago',
    content: (
      <>
        <h3>Accepted Payment Methods</h3>
        <p>MedBroker uses leading RBI-authorized Payment Gateways ensuring enterprise-grade encryption. We accept:</p>
        <ul>
          <li>Credit/Debit Cards (Visa, Mastercard, RuPay)</li>
          <li>UPI App Transfers (GPay, PhonePe, Paytm)</li>
          <li>Net Banking (from 50+ major Indian banks)</li>
          <li>B2B Wallet / NEFT Transfers (For registered wholesale buyers)</li>
        </ul>

        <h3>Downloading Invoices</h3>
        <p>Since we operate a marketplace model, the invoice you receive is generated directly on behalf of the Vendor carrying their GSTIN. A digital PDF invoice is automatically sent to your email upon delivery. You can also download historical invoices anytime from your <strong>Orders</strong> page.</p>

        <h3>Failed Transactions</h3>
        <p>If amount was debited from your account but the order failed to process, the payment gateway will execute an auto-reversal within 2-3 business days. If the issue persists, please submit a ticket via our Contact Us portal with your transaction reference number.</p>
      </>
    )
  },
  'account-settings': {
    title: 'Managing Account Settings',
    lastUpdated: '2 months ago',
    content: (
      <>
        <h3>Editing Profile Information</h3>
        <p>Navigate to the top right dropdown and click on <strong>Settings</strong>. Here you can update your fundamental profile data such as your alternate phone number, date of birth, and email preferences.</p>

        <h3>Managing Multiple Addresses</h3>
        <p>You can save up to 10 delivery addresses in your address book (e.g., Home, Office, Parents' House). Navigate to <strong>Address Book</strong> in the sidebar. Remember to set a default address to speed up your checkout process.</p>

        <h3>Password & Security</h3>
        <p>We recommend changing your password every 90 days. You can update it under the <strong>Security</strong> tab. If you suspect your account has been compromised, use the "Sign out of all devices" button immediately and reset your password.</p>

        <h3>Notification Preferences</h3>
        <p>Tired of marketing emails but still want order updates on WhatsApp? Go to <strong>Notification Preferences</strong>. You can independently toggle SMS, Email, and Push notifications for Promos vs. Transactional alerts.</p>
      </>
    )
  }
};

export default function HelpArticle() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const article = helpDocuments[topicId];

  if (!article) {
    return (
      <PublicLayout>
        <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <h2>Article Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We couldn't find the guide you were looking for.</p>
          <button onClick={() => navigate('/support/help-center')} className="button button-outline">Return to Help Center</button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
        
        {/* Breadcrumb Navigation */}
        <button 
          onClick={() => navigate('/support/help-center')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '2rem', padding: 0, fontSize: '1rem', fontWeight: '500' }}
          className="hover-underline"
        >
          <IconArrowLeft /> Back to Help Center
        </button>

        {/* Article Content Wrapper */}
        <div className="card" style={{ padding: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: '1.2' }}>{article.title}</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            Last updated: {article.lastUpdated}
          </p>

          {/* Article Body using inline styles simulating markdown parsing */}
          <div className="article-body" style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
            <style>
              {`
                .article-body h3 {
                  color: var(--text-primary);
                  font-size: 1.4rem;
                  margin-top: 2.5rem;
                  margin-bottom: 1rem;
                }
                .article-body p {
                  margin-bottom: 1.2rem;
                }
                .article-body ul {
                  margin-bottom: 1.5rem;
                  padding-left: 1.5rem;
                }
                .article-body li {
                  margin-bottom: 0.5rem;
                }
              `}
            </style>
            
            {article.content}
            
          </div>
        </div>

        {/* Feedback Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Was this article helpful?</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="button-outline" style={{ padding: '0.5rem 1.5rem' }}>Yes</button>
            <button className="button-outline" style={{ padding: '0.5rem 1.5rem' }}>No</button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

import React, { useEffect } from 'react';
import { Target, Eye, ShieldCheck, Heart, Zap, Award, Users, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './About.module.css';

const About = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className={styles.aboutPage}>
            <div className={styles.container} style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--primary)', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: 0
                    }}
                >
                    <ChevronLeft size={20} /> Back to Home
                </button>
            </div>

            {/* Mission & Vision Section */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.missionVision}>
                        <div className={styles.contentText}>
                            <div className={styles.cardTitle}>Our Mission</div>
                            <p className={styles.cardText} style={{ fontSize: '1.1rem', marginBottom: '32px' }}>
                                To democratize access to authentic medicines and healthcare supplies across India, ensuring that quality healthcare is never more than a click away. We strive to eliminate supply chain inefficiencies and combat counterfeit products through rigorous verification.
                            </p>
                            
                            <div className={styles.cardTitle}>Our Vision</div>
                            <p className={styles.cardText} style={{ fontSize: '1.1rem' }}>
                                To become India's most trusted healthcare supply platform, where transparency, speed, and reliability empower millions of healthcare professionals and patients alike.
                            </p>
                        </div>
                        <div className={styles.contentImage}>
                             <div style={{ 
                                background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)', 
                                height: '400px', 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                padding: '40px',
                                gap: '20px'
                             }}>
                                <div style={{ color: 'white' }}>
                                    <svg width="100" height="100" viewBox="0 0 40 40" fill="none">
                                        <path d="M20 5L20 35M5 20L35 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                        <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" fill="none" />
                                    </svg>
                                </div>
                                <h2 style={{ color: 'white', fontSize: '3rem', margin: 0, fontWeight: 700 }}>MedIQ</h2>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.statsSection}>
                <div className={styles.container}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <h2>500+</h2>
                            <p>Verified Vendors</p>
                        </div>
                        <div className={styles.statItem}>
                            <h2>10k+</h2>
                            <p>Active Users</p>
                        </div>
                        <div className={styles.statItem}>
                            <h2>50k+</h2>
                            <p>Products Listed</p>
                        </div>
                        <div className={styles.statItem}>
                            <h2>150+</h2>
                            <p>Cities Covered</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 className={styles.cardTitle} style={{ fontSize: '2.5rem' }}>Our Core Values</h2>
                        <p className={styles.cardText}>The principles that guide every decision we make.</p>
                    </div>
                    
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <div className={styles.cardIcon}>
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className={styles.cardTitle}>Uncompromising Trust</h3>
                            <p className={styles.cardText}>
                                Every vendor on our platform undergoes a rigorous 5-step verification process, including drug license and GST validation.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardIcon}>
                                <Heart size={32} />
                            </div>
                            <h3 className={styles.cardTitle}>Patient First</h3>
                            <p className={styles.cardText}>
                                We believe healthcare is a right. Our platform is designed to prioritize affordability and immediate availability of essential life-saving drugs.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardIcon}>
                                <Zap size={32} />
                            </div>
                            <h3 className={styles.cardTitle}>Innovaion Driven</h3>
                            <p className={styles.cardText}>
                                From AI-powered recommendations to secure real-time tracking, we use technology to solve the most complex healthcare logistics.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className={styles.section} style={{ backgroundColor: '#f9fafb' }}>
                <div className={styles.container}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                         <h2 className={styles.cardTitle} style={{ fontSize: '2.5rem' }}>Why Healthcare Partners Choose MedIQ</h2>
                    </div>
                    
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {[
                            '100% Authentic Products Sourcing',
                            'Automated GST-Compliant Invoicing',
                            'Real-time Inventory Management for Vendors',
                            'Next-day Delivery in Major Metro Cities',
                            'Dedicated 24/7 Professional Support',
                            'Secure Encrypted Payment Gateway'
                        ].map((item, index) => (
                            <div key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '16px', 
                                padding: '16px', 
                                borderBottom: '1px solid #e5e7eb' 
                            }}>
                                <CheckCircle2 size={24} color="#10b981" />
                                <span style={{ fontSize: '1.1rem', color: '#374151', fontWeight: 500 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;

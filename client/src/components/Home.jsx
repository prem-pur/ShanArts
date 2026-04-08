import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="landing-logo">SHAN ART ADVERTISING</div>
                <div className="landing-nav-links">
                    <button className="landing-nav-btn" onClick={() => navigate('/customer-dashboard')}>Login</button>
                    <button className="landing-nav-btn" onClick={() => navigate('/staff-login')}>Staff Portal</button>
                </div>
            </nav>

            <section className="landing-hero" style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1562654501-a0ccc0af3fb1?q=80&w=2070&auto=format&fit=crop')`,
                backgroundColor: '#0d0d0e',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">Elevate Your Brand with Precision Printing</h1>
                    <p className="hero-subtitle">
                        From high-impact digital prints to state-of-the-art signage, we bring your vision to life with uncompromising quality and futuristic design.
                    </p>
                    <div className="hero-btns">
                        <button
                            className="btn-premium primary"
                            onClick={() => navigate('/customer-dashboard')}
                        >
                            Create a Design
                        </button>
                        <button
                            className="btn-premium secondary"
                            onClick={() => navigate('/customer-dashboard')}
                        >
                            Customer Login
                        </button>
                    </div>
                </div>
            </section>

            <section id="services" className="landing-section">
                <div className="section-head">
                    <h2 className="section-title">Our Premium Services</h2>
                    <p className="section-desc">We combine cutting-edge technology with artistic excellence to deliver range of specialized printing services.</p>
                </div>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="service-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <h3 className="service-name">Digital Printing</h3>
                        <p className="service-desc">Ultra-high resolution prints with vibrant color accuracy for all your marketing collaterals and corporate identity.</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        </div>
                        <h3 className="service-name">Signage & Displays</h3>
                        <p className="service-desc">Impactful indoor and outdoor signage solutions that make your business stand out from the crowd.</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.5-1 1-4c2 1 3 2 4 4z"></path><path d="M12 15v5s1-.5 4-1c-1-2-2-3-4-4z"></path></svg>
                        </div>
                        <h3 className="service-name">Brand Identity</h3>
                        <p className="service-desc">Holistic design and branding services to establish a strong, professional presence for your organization.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-brand">
                    <div className="footer-logo">SHAN ART</div>
                    <p className="footer-desc">Crafting excellence in every print. Your partner for modern advertising and state-of-the-art branding solutions.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Services</h4>
                        <ul>
                            <li><button className="footer-link-btn">Print Media</button></li>
                            <li><button className="footer-link-btn">Digital Signage</button></li>
                            <li><button className="footer-link-btn">Brand Design</button></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Company</h4>
                        <ul>
                            <li><button className="footer-link-btn">About Us</button></li>
                            <li><button className="footer-link-btn">Portfolio</button></li>
                            <li><button className="footer-link-btn">Contact</button></li>
                        </ul>
                    </div>
                    <div className="footer-col" style={{ maxWidth: '200px' }}>
                        <h4>Contact</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Anuradhapura, Sri Lanka<br />
                            +94 77 723 4505
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="landing-logo-box">
                        <img src="/logo.png" alt="logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    SHAN ART&nbsp;ADVERTISING
                </div>
                <div className="landing-nav-links">
                    <button className="landing-nav-btn" onClick={() => scrollToSection('about')}>About</button>
                    <button className="landing-nav-btn" onClick={() => navigate('/staff-login')}>Staff Portal</button>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="hero-content">
                    <h1 className="hero-title animate-in">
                        Elevate Your Brand<br/>
                        with <span className="text-highlight">Precision</span>
                    </h1>
                    <p className="hero-subtitle animate-in-delay">
                        From high-impact digital prints to state-of-the-art signage,<br/>
                        we bring your vision to life with uncompromising quality and<br/>
                        futuristic design.
                    </p>
                    <div className="hero-btns animate-in-delay">
                        <button
                            className="btn-premium primary"
                            onClick={() => navigate('/customer-dashboard')}
                        >
                            Start Designing
                        </button>
                        <button
                            className="btn-premium secondary"
                            onClick={() => navigate('/customer-dashboard')}
                        >
                            Client Login
                        </button>
                    </div>
                </div>

                <div className="hero-ambient-glow">
                    <div className="glow-orb orb-1"></div>
                    <div className="glow-orb orb-2"></div>
                    <div className="glow-orb orb-3"></div>
                </div>



                <div className="glow-particles">
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                    <div className="particle"></div>
                </div>
            </section>

            <section className="landing-section about-section" id="about">
                <div className="section-head">
                    <h2 className="section-title">About Our Studio</h2>
                    <p className="section-desc">Providing premium quality advertising and design solutions since 2012. We are dedicated to bringing your brand's vision to life with precision and creativity.</p>
                </div>
                
                <div className="about-content">
                    <div className="about-info-grid">
                        <div className="about-info-card">
                            <div className="about-info-icon">
                                <MapPin size={24} />
                            </div>
                            <h3>Our Location</h3>
                            <p>8CF3+2G8, Anuradhapura</p>
                            <a 
                                href="https://www.google.com/maps/search/?api=1&query=8CF3+2G8,Anuradhapura" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="map-link"
                            >
                                View on Google Maps
                            </a>
                        </div>
                        
                        <div className="about-info-card">
                            <div className="about-info-icon">
                                <Phone size={24} />
                            </div>
                            <h3>Connect With Us</h3>
                            <div className="contact-item">
                                <a href="tel:0777234505" className="contact-value">077 723 4505</a>
                            </div>
                            <div className="contact-item">
                                <a href="mailto:shanart2012@gmail.com" className="contact-value">shanart2012@gmail.com</a>
                            </div>
                        </div>

                        <div className="about-info-card">
                            <div className="about-info-icon">
                                <Clock size={24} />
                            </div>
                            <h3>Business Hours</h3>
                            <p>Mon - Fri: 8:30 AM - 6:00 PM</p>
                            <p>Sat: 9:00 AM - 2:00 PM</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-brand">
                    <div className="footer-logo">SHAN ART ADVERTISING</div>
                    <p className="footer-desc">Your partner in premium brand elevation and precision advertising solutions.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Company</h4>
                        <ul>
                            <li><button className="footer-link-btn" onClick={() => scrollToSection('about')}>About Us</button></li>
                            <li><button className="footer-link-btn">Services</button></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Portals</h4>
                        <ul>
                            <li><button className="footer-link-btn" onClick={() => navigate('/customer-dashboard')}>Client Login</button></li>
                            <li><button className="footer-link-btn" onClick={() => navigate('/staff-login')}>Staff Portal</button></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

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
                    <button className="landing-nav-btn" onClick={() => navigate('/staff-login')}>Staff Portal</button>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Elevate Your Brand<br/>
                        with <span className="text-highlight">Precision</span>
                    </h1>
                    <p className="hero-subtitle">
                        From high-impact digital prints to state-of-the-art signage,<br/>
                        we bring your vision to life with uncompromising quality and<br/>
                        futuristic design.
                    </p>
                    <div className="hero-btns">
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
            </section>
        </div>
    );
};

export default Home;

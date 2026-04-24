import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Clock, Printer, Package, BarChart2, Users,
  FileText, Layers, ChevronRight, Zap, Shield, Star, ArrowRight,
  TrendingUp, CheckCircle, Bell, Settings, LogIn, Play, X, MessageCircle
} from 'lucide-react';
import AiCopywritingAssistant from './AiCopywritingAssistant';
import PrintKnowledgeChatbot from './PrintKnowledgeChatbot';

/* ─── Keyframe Animations (injected once) ─────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #000000; overflow-x: hidden; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes float    { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-14px) } }
  @keyframes pulse2   { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes shimmer  { 0% { background-position:-400px 0 } 100% { background-position:400px 0 } }
  @keyframes gradient { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
  @keyframes slideRight { from { transform:translateX(-100%) } to { transform:translateX(0) } }
  @keyframes countUp  { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }
  @keyframes borderGlow {
    0%,100% { border-color: rgba(255,51,51,0.3); box-shadow: 0 0 20px rgba(255,51,51,0.1); }
    50% { border-color: rgba(204,0,0,0.6); box-shadow: 0 0 40px rgba(204,0,0,0.25); }
  }
  @keyframes marquee  { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  @keyframes ripple   { to { transform:scale(4); opacity:0 } }

  .animate-1 { animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-2 { animation: fadeUp 0.8s 0.12s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-3 { animation: fadeUp 0.8s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-4 { animation: fadeUp 0.8s 0.36s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-5 { animation: fadeUp 0.8s 0.48s cubic-bezier(0.22,1,0.36,1) both; }

  .float-slow { animation: float 6s ease-in-out infinite; }
  .float-mid  { animation: float 4.5s ease-in-out infinite; }
  .live-dot   { animation: pulse2 2s ease-in-out infinite; }

  .btn-primary-h:hover  { transform:translateY(-2px); box-shadow:0 0 60px rgba(255,51,51,0.6) !important; }
  .btn-secondary-h:hover{ background:rgba(255,255,255,0.1) !important; border-color:rgba(255,255,255,0.25) !important; }
  .nav-btn-h:hover      { background:rgba(255,255,255,0.07) !important; color:#ffffff !important; }
  .nav-pri-h:hover      { background:rgba(255,51,51,0.3) !important; }
  .feature-card-h:hover { background:#141414 !important; transform:translateY(-2px); }
  .feature-card-h       { transition: background 0.2s, transform 0.25s !important; }
  .about-card-h:hover   { border-color:rgba(255,51,51,0.4) !important; transform:translateY(-3px); }
  .about-card-h         { transition: border-color 0.25s, transform 0.25s !important; }
  .footer-link-h         { color: var(--text-primary, #ffffff) !important; }
  .footer-link-h:hover  { color: #ff3333 !important; }
  .service-img:hover    { transform:scale(1.04); }
  .service-img          { transition:transform 0.4s ease !important; }

  .gradient-text {
    background: linear-gradient(135deg, #ff3333 0%, #cc0000 40%, #ff6666 80%, #990000 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient 4s ease infinite;
  }

  .glow-btn {
    position: relative;
    overflow: hidden;
  }
  .glow-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  .card-border-anim { animation: borderGlow 3s ease-in-out infinite; }

  .marquee-track { animation: marquee 20s linear infinite; }

  .scroll-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .scroll-reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0A0C10; }
  ::-webkit-scrollbar-thumb { background: #2A2E3E; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #4A5070; }
`;

/* ─── Hero particle field ─────────────────────────────────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = 500;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,51,51,${p.a})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '500px',
      pointerEvents: 'none', opacity: 0.4,
    }} />
  );
};

/* ─── Scroll reveal hook ──────────────────────────────────────────── */
const useScrollReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

/* ─── Data ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: <FileText size={22} />,
    bg: 'rgba(255,255,255,0.08)', color: '#999999',
    title: 'Order Management',
    desc: 'Track every print job from submission to delivery. Real-time status updates, priority queuing, and automated notifications keep everyone in sync.',
    tag: 'Core Module',
    img: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&q=80',
  },
  {
    icon: <Package size={22} />,
    bg: 'rgba(255,255,255,0.08)', color: '#999999',
    title: 'Inventory Control',
    desc: 'Monitor paper stock, ink levels, and materials with smart alerts. Never run out mid-job with automated reorder thresholds.',
    tag: 'Stock Module',
    img: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=400&q=80',
  },
  {
    icon: <Users size={22} />,
    bg: 'rgba(255,255,255,0.08)', color: '#999999',
    title: 'Client Portal',
    desc: 'Customers upload files, approve proofs, and track orders themselves — reducing back-and-forth by 60%.',
    tag: 'Client-facing',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',
  },
  {
    icon: <BarChart2 size={22} />,
    bg: 'rgba(255,255,255,0.08)', color: '#999999',
    title: 'Revenue Analytics',
    desc: 'Live dashboards showing job profitability, staff utilization, and monthly growth with exportable reports.',
    tag: 'Analytics',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
  },
  {
    icon: <Zap size={22} />,
    bg: 'rgba(255,255,255,0.08)', color: '#999999',
    title: 'AI Copywriting',
    desc: 'Generate professional marketing copy for banners, flyers, and signage in seconds — powered by advanced AI.',
    tag: 'AI-powered',
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
  },
  {
    icon: <Shield size={22} />,
    bg: 'rgba(255,255,255,0.08)', color: '#999999',
    title: 'Access Control',
    desc: 'Role-based permissions — designers, operators, and managers each see only what they need. Full audit trail included.',
    tag: 'Security',
    img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&q=80',
  },
];

const jobs = [
  { id: '#J-0451', name: 'Banner 6×3 ft — City Pharmacy', qty: '3 pcs', status: 'Printing', color: "red" },
  { id: '#J-0452', name: 'Business Cards — Nimal & Co.', qty: '500 pcs', status: 'Ready', color: 'red' },
  { id: '#J-0453', name: 'Flex Board — Siyane Hardware', qty: '1 pc', status: 'Pending', color: 'grey' },
  { id: '#J-0454', name: 'Brochures A5 — Star Academy', qty: '200 pcs', status: 'Ready', color: 'red' },
  { id: '#J-0455', name: 'Stickers Roll — Food Corner', qty: '50 m', status: 'Printing', color: "red" },
];

const services = [
  { title: 'Large Format Printing', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', tag: 'Banners & Flex' },
  { title: 'Business Stationery', img: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&q=80', tag: 'Cards & Letterheads' },
  { title: 'Signage & Branding', img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80', tag: 'Shop Signs & Boards' },
  { title: 'Promotional Materials', img: 'https://images.unsplash.com/photo-1586892478025-2b5472316f22?w=600&q=80', tag: 'Flyers & Brochures' },
];

const clientLogos = ['City Pharmacy', 'Nimal & Co.', 'Star Academy', 'Siyane Hardware', 'Food Corner', 'Lanka Tiles', 'Blue Ocean Tours', 'SL Constructions'];

const LS_PRINT_CHATBOT_LAUNCH = 'shanarts_print_chatbot_launch_v1';

const statusStyle = (color) => ({
  padding: '3px 11px',
  borderRadius: '100px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  background: color === 'red' ? 'rgba(255,51,51,0.12)' : color === 'grey' ? 'rgba(153,153,153,0.12)' : 'rgba(255,51,51,0.12)',
  color: color === 'red' ? '#ff3333' : color === 'grey' ? '#999999' : '#ff3333',
});

/* ─── Main Component ──────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState({ orders: 0, clients: 0, years: 0, uptime: 0 });
  const [activeFeature, setActiveFeature] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [launchModal, setLaunchModal] = useState(false);

  useScrollReveal();

  /** Scroll to the Print Knowledge section and open the floating chat (public). */
  const openPrintChat = useCallback(() => {
    const el = document.getElementById('print-knowledge');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.dispatchEvent(new CustomEvent('open-print-chat'));
  }, []);

  useEffect(() => {
    if (localStorage.getItem(LS_PRINT_CHATBOT_LAUNCH) === '1') return;
    const t = setTimeout(() => setLaunchModal(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const dismissLaunchModal = useCallback((remember) => {
    if (remember) {
      try {
        localStorage.setItem(LS_PRINT_CHATBOT_LAUNCH, '1');
      } catch {
        // ignore
      }
    }
    setLaunchModal(false);
  }, []);

  useEffect(() => {
    const targets = { orders: 1240, clients: 320, years: 12, uptime: 99 };
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setCount({
        orders: Math.round(targets.orders * ease),
        clients: Math.round(targets.clients * ease),
        years: Math.round(targets.years * ease),
        uptime: Math.round(targets.uptime * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, 1400 / steps);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#000000', color: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: '68px',
        background: navScrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'all 0.35s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden',
            border: '2px solid rgba(255,51,51,0.4)',
            background: 'linear-gradient(135deg, #ff3333 0%, #990000 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/logo.png"
              alt="Shan Art Logo"
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
            />
            <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Printer size={18} color="#fff" />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: '0.06em', color: '#ffffff' }}>SHAN ART</div>
            <div style={{ fontSize: '11px', color: '#666666', letterSpacing: '0.08em', fontWeight: 500 }}>ADVERTISING</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {['Features', 'Services', 'About'].map(label => (
            <button key={label} className="nav-btn-h" onClick={() => scrollTo(label.toLowerCase())}
              style={{ background: 'transparent', border: 'none', color: '#999999', fontSize: '14px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
          <button className="nav-btn-h" onClick={() => scrollTo('ai-copywriting')}
            style={{ background: 'transparent', border: 'none', color: '#999999', fontSize: '14px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            AI Tools
          </button>
          <button
            type="button"
            onClick={openPrintChat}
            style={{
              background: 'transparent', border: 'none', color: '#ff6666', fontSize: '14px', fontWeight: 600, padding: '8px 16px',
              borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            <MessageCircle size={15} style={{ opacity: 0.9 }} />
            Chatbot
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />
          <button className="nav-pri-h" onClick={() => navigate('/staff-login')}
            style={{ background: 'rgba(255,51,51,0.18)', border: '1px solid rgba(255,51,51,0.38)', color: '#ff6666', fontSize: '13px', fontWeight: 600, padding: '8px 18px', borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' }}>
            <LogIn size={14} />Staff Login
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 2rem 60px', position: 'relative', textAlign: 'center', overflow: 'hidden' }}>
        {/* Background effects */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,51,51,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,51,51,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', WebkitMask: 'radial-gradient(ellipse 90% 70% at 50% 40%, black 30%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(255,51,51,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '15%', width: '200px', height: '200px', background: 'radial-gradient(ellipse, rgba(255,51,51,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: '180px', height: '180px', background: 'radial-gradient(ellipse, rgba(255,51,51,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <ParticleCanvas />

        {/* Floating decorative elements */}
        <div className="float-slow" style={{ position: 'absolute', top: '18%', left: '8%', width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,51,51,0.12)', border: '1px solid rgba(255,51,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3333' }}>
          <Printer size={22} />
        </div>
        <div className="float-mid" style={{ position: 'absolute', top: '25%', right: '9%', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff3333' }}>
          <CheckCircle size={20} />
        </div>
        <div className="float-slow" style={{ position: 'absolute', bottom: '30%', left: '12%', width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(153,153,153,0.1)', border: '1px solid rgba(153,153,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999999' }}>
          <Zap size={18} />
        </div>

        <div className="animate-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.28)', color: '#ff6666', fontSize: '12px', fontWeight: 600, padding: '6px 16px', borderRadius: '100px', marginBottom: '32px', letterSpacing: '0.05em' }}>
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3333', display: 'inline-block' }} />
          PRINT SHOP MANAGEMENT SYSTEM — v2.0
        </div>

        {/* Logo in hero */}
        <div className="animate-1" style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '22px', overflow: 'hidden', border: '2px solid rgba(255,51,51,0.35)', background: 'linear-gradient(135deg, #111111 0%, #222222 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(255,51,51,0.25)' }}>
            <img src="/logo.png" alt="Shan Art" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
            <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Printer size={36} color="#ff3333" />
            </div>
          </div>
        </div>

        <h1 className="animate-2" style={{ fontSize: 'clamp(2.6rem, 6.5vw, 4.6rem)', fontWeight: 800, lineHeight: 1.08, marginBottom: '28px', letterSpacing: '-0.03em', maxWidth: '900px', fontFamily: "'Space Grotesk', sans-serif" }}>
          Run Your Print Shop<br />
          <span className="gradient-text">Smarter, Not Harder</span>
        </h1>

        <p className="animate-3" style={{ fontSize: '18px', lineHeight: 1.75, color: '#999999', maxWidth: '540px', marginBottom: '44px', fontWeight: 400 }}>
          Orders, inventory, clients, and analytics — all in one precision-built platform for modern printing businesses in Sri Lanka.
        </p>

        <div className="animate-3" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
          <button className="btn-primary-h glow-btn" onClick={() => navigate('/customer-dashboard')}
            style={{ background: 'linear-gradient(135deg, #ff3333, #990000)', color: '#fff', border: 'none', padding: '15px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', transition: 'all 0.25s', fontFamily: 'inherit', boxShadow: '0 0 40px rgba(255,51,51,0.4)', letterSpacing: '0.01em' }}>
            Open Client Dashboard <ArrowRight size={16} />
          </button>
          <button className="btn-secondary-h" onClick={() => navigate('/staff-login')}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#999999', border: '1px solid rgba(255,255,255,0.12)', padding: '15px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', transition: 'all 0.25s', fontFamily: 'inherit' }}>
            <Settings size={15} /> Staff Portal
          </button>
        </div>

        {/* Stats strip */}
        <div className="animate-5 card-border-anim" style={{ display: 'flex', border: '1px solid rgba(255,51,51,0.3)', borderRadius: '18px', overflow: 'hidden', maxWidth: '700px', width: '100%', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          {[
            { num: `${count.orders.toLocaleString()}+`, label: 'Jobs Processed', icon: <Printer size={20} /> },
            { num: `${count.clients}+`, label: 'Active Clients', icon: <Users size={20} /> },
            { num: `${count.years} Yrs`, label: 'In Business', icon: <Star size={20} /> },
            { num: `${count.uptime}%`, label: 'Uptime SLA', icon: <Zap size={20} /> },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '22px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px', color: '#ff3333', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', marginBottom: '4px' }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: '#666666', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CLIENT LOGO MARQUEE ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 0', overflow: 'hidden', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          <div className="marquee-track" style={{ display: 'flex', gap: '60px', whiteSpace: 'nowrap', paddingRight: '60px', alignItems: 'center' }}>
            {[...clientLogos, ...clientLogos].map((name, i) => (
              <span key={i} style={{ fontSize: '13px', color: '#666666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {name}
                <span style={{ marginLeft: '60px', opacity: 0.3 }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICES / GALLERY ── */}
      <section id="services" style={{ padding: '100px 2rem', maxWidth: '1150px', margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)', color: '#ff3333', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Star size={11} /> Our Services
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px' }}>Premium print & advertising</h2>
          <p style={{ fontSize: '16px', color: '#666666', lineHeight: 1.7, maxWidth: '480px' }}>From business cards to massive banners — we handle every format with precision and speed.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {services.map((s, i) => (
            <div key={i} className="scroll-reveal" style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: '#0D0F14', position: 'relative', cursor: 'pointer', animationDelay: `${i * 0.1}s` }}>
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <img className="service-img" src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,8,16,0.8) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,51,51,0.85)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', backdropFilter: 'blur(6px)' }}>{s.tag}</div>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" style={{ padding: '0 2rem 100px', maxWidth: '1150px', margin: '0 auto' }}>
        <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)', color: '#ff3333', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Layers size={11} /> Platform Features
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '14px' }}>Everything your print shop needs</h2>
          <p style={{ fontSize: '16px', color: '#666666', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto' }}>Built specifically for advertising & print businesses — from job intake to delivery.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card-h scroll-reveal" onMouseEnter={() => setActiveFeature(i)} onMouseLeave={() => setActiveFeature(null)}
              style={{ background: '#0C0E14', padding: '34px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              {/* Feature image strip */}
              <div style={{ height: '130px', borderRadius: '12px', overflow: 'hidden', marginBottom: '22px', position: 'relative' }}>
                <img src={f.img} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) saturate(0.8)', transition: 'filter 0.3s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(6,8,16,0.5) 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '40px', height: '40px', borderRadius: '10px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.icon}
                </div>
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '11px', fontWeight: 600, color: f.color, background: 'rgba(0,0,0,0.6)', padding: '3px 9px', borderRadius: '5px', backdropFilter: 'blur(6px)' }}>{f.tag}</div>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '9px', fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</div>
              <div style={{ fontSize: '14px', color: '#666666', lineHeight: 1.68 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE DASHBOARD PREVIEW ── */}
      <section style={{ padding: '0 2rem 100px', maxWidth: '1150px', margin: '0 auto' }}>
        <div className="scroll-reveal">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)', color: '#ff3333', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <BarChart2 size={11} /> Live Overview
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px' }}>Your operations at a glance</h2>
          <p style={{ fontSize: '16px', color: '#666666', lineHeight: 1.7, maxWidth: '480px', marginBottom: '40px' }}>Real-time job board and metrics — updated as your team works.</p>
        </div>

        <div className="scroll-reveal" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '22px', padding: '28px', overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
          {/* Dashboard header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="live-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff3333', boxShadow: '0 0 8px #ff3333' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>
                Dashboard — Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#666666', background: 'rgba(255,51,51,0.08)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,51,51,0.15)' }}>Live preview</span>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { val: '23', label: "Today's Jobs", change: '+4 from yesterday', color: '#ff3333' },
              { val: 'Rs 84,200', label: 'Revenue Today', change: '+12% this week', color: '#ff3333' },
              { val: '7', label: 'Jobs In Queue', change: '3 urgent', color: '#999999' },
              { val: '98%', label: 'On-Time Rate', change: 'This month', color: '#ffffff' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px 16px', borderTop: `2px solid ${m.color}33` }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', marginBottom: '5px' }}>{m.val}</div>
                <div style={{ fontSize: '12px', color: '#666666', letterSpacing: '0.03em', marginBottom: '8px' }}>{m.label}</div>
                <div style={{ fontSize: '11px', color: '#ff3333', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <TrendingUp size={10} />{m.change}
                </div>
              </div>
            ))}
          </div>

          {/* Job rows */}
          <div>
            <div style={{ fontSize: '11px', color: '#666666', marginBottom: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Recent Jobs</div>
            {jobs.map((j, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: i < jobs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap: '14px', fontSize: '13px' }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#ff3333', fontSize: '12px', fontWeight: 600, minWidth: '70px' }}>{j.id}</span>
                <span style={{ flex: 1, color: '#999999' }}>{j.name}</span>
                <span style={{ color: '#666666', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>{j.qty}</span>
                <span style={statusStyle(j.color)}>{j.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section id="ai-copywriting" style={{ padding: '0 2rem 100px', maxWidth: '1150px', margin: '0 auto' }}>
        <div className="scroll-reveal">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,51,51,0.12)', border: '1px solid rgba(255,51,51,0.25)', color: '#ff3333', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Zap size={11} /> AI-Powered
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px' }}>AI copywriting assistant</h2>
          <p style={{ fontSize: '16px', color: '#666666', lineHeight: 1.7, maxWidth: '460px', marginBottom: '44px' }}>Generate compelling ad copy for your clients in seconds — banners, flyers, social media.</p>
        </div>
        <div className="scroll-reveal">
          <AiCopywritingAssistant />
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div style={{ margin: '0 2rem 100px', background: 'linear-gradient(135deg, rgba(255,51,51,0.16) 0%, rgba(204,0,0,0.1) 100%)', border: '1px solid rgba(255,51,51,0.28)', borderRadius: '28px', padding: '72px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 90% at 50% 50%, rgba(153,0,0,0.07) 0%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Decorative corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '60px', height: '60px', borderTop: '2px solid rgba(255,51,51,0.3)', borderLeft: '2px solid rgba(255,51,51,0.3)', borderRadius: '28px 0 0 0' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60px', height: '60px', borderBottom: '2px solid rgba(255,51,51,0.3)', borderRight: '2px solid rgba(255,51,51,0.3)', borderRadius: '0 0 28px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', overflow: 'hidden', border: '2px solid rgba(255,51,51,0.4)', boxShadow: '0 0 40px rgba(255,51,51,0.3)', background: '#111111' }}>
            <img src="/logo.png" alt="Shan Art" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><Printer size={26} color="#ff3333" /></div>
          </div>
        </div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#ffffff', marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>Ready to streamline your print shop?</h2>
        <p style={{ fontSize: '16px', color: '#666666', marginBottom: '36px', maxWidth: '460px', margin: '0 auto 36px', lineHeight: 1.7 }}>
          Log in to manage orders, check inventory, and serve clients faster — all in one place.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary-h glow-btn" onClick={() => navigate('/customer-dashboard')}
            style={{ background: 'linear-gradient(135deg, #ff3333, #990000)', color: '#fff', border: 'none', padding: '15px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', transition: 'all 0.25s', fontFamily: 'inherit', boxShadow: '0 0 40px rgba(255,51,51,0.4)' }}>
            Client Login <ArrowRight size={16} />
          </button>
          <button className="btn-secondary-h" onClick={() => navigate('/staff-login')}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#999999', border: '1px solid rgba(255,255,255,0.12)', padding: '15px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', transition: 'all 0.25s', fontFamily: 'inherit' }}>
            Staff Portal
          </button>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: '0 2rem 100px', maxWidth: '1150px', margin: '0 auto' }}>
        <div className="scroll-reveal">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)', color: '#ff3333', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Star size={11} /> About Us
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px' }}>Shan Art Advertising</h2>
          <p style={{ fontSize: '16px', color: '#666666', lineHeight: 1.7, maxWidth: '480px', marginBottom: '0' }}>Premium printing and advertising solutions since 2012, serving Anuradhapura and beyond.</p>
        </div>

        {/* About visual banner */}
        <div className="scroll-reveal" style={{ marginTop: '40px', marginBottom: '28px', borderRadius: '20px', overflow: 'hidden', position: 'relative', height: '220px' }}>
          <img src="https://images.unsplash.com/photo-1524234107056-1c1f48f64ab8?w=1200&q=80" alt="Print shop" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(0.6) contrast(1.1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)' }} />
          <div style={{ position: 'absolute', left: '40px', top: '50%', transform: 'translateY(-50%)' }}>
            <div style={{ fontSize: '13px', color: '#ff3333', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Est. 2012</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Anuradhapura's</div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }} className="gradient-text">Print Experts</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[
            { icon: <MapPin size={18} />, title: 'Our Location', content: <><p style={{ color: '#999999', fontSize: '14px', lineHeight: 1.7 }}>8CF3+2G8, Anuradhapura</p><a className="about-card-h" href="https://www.google.com/maps/search/?api=1&query=8CF3+2G8,Anuradhapura" target="_blank" rel="noopener noreferrer" style={{ color: '#ff3333', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>View on Maps <ChevronRight size={12} /></a></> },
            { icon: <Phone size={18} />, title: 'Contact Us', content: <><a href="tel:0777234505" style={{ color: '#ff3333', fontSize: '14px', textDecoration: 'none', display: 'block' }}>077 723 4505</a><a href="mailto:shanart2012@gmail.com" style={{ color: '#999999', fontSize: '13px', textDecoration: 'none', display: 'block', marginTop: '6px' }}>shanart2012@gmail.com</a></> },
            { icon: <Clock size={18} />, title: 'Business Hours', content: <><p style={{ color: '#999999', fontSize: '14px', lineHeight: 1.7 }}>Mon – Fri: 8:30 AM – 6:00 PM</p><p style={{ color: '#666666', fontSize: '13px', marginTop: '6px' }}>Saturday: 9:00 AM – 2:00 PM</p></> },
            { icon: <CheckCircle size={18} />, title: 'Why Choose Us', content: <p style={{ color: '#999999', fontSize: '14px', lineHeight: 1.7 }}>12+ years of precision printing, 320+ satisfied clients, and a team that treats every job like their own.</p> },
          ].map((card, i) => (
            <div key={i} className="about-card-h scroll-reveal" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,51,51,0.12)', border: '1px solid rgba(255,51,51,0.2)', color: '#ff3333', marginBottom: '16px' }}>{card.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif" }}>{card.title}</div>
              {card.content}
            </div>
          ))}
        </div>
      </section>

      {/* ── CHATBOT (anchor for nav; floating UI is portaled to body) ── */}
      <section id="print-knowledge" style={{ padding: '0 2rem 100px', maxWidth: '1150px', margin: '0 auto' }}>
        <div className="scroll-reveal">
          <button
            type="button"
            onClick={openPrintChat}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)',
              color: '#ff3333', fontSize: '11px', fontWeight: 800, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px',
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,51,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,51,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Bell size={11} /> Support
          </button>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '12px' }}>Print knowledge assistant</h2>
          <p style={{ fontSize: '16px', color: '#666666', lineHeight: 1.7, maxWidth: '460px', marginBottom: '44px' }}>Ask anything about print specs, materials, or turnaround times.</p>
        </div>
        <div className="scroll-reveal"><PrintKnowledgeChatbot /></div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '56px 2.5rem 36px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid rgba(255,51,51,0.3)', background: '#111111' }}>
                <img src="/logo.png" alt="Shan Art" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><Printer size={16} color="#ff3333" /></div>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', color: '#ffffff', letterSpacing: '0.06em' }}>SHAN ART ADVERTISING</div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #999999)', lineHeight: 1.8 }}>Your partner in premium brand elevation and precision advertising — Anuradhapura, Sri Lanka.</p>
          </div>

          {[
            { title: 'Platform', links: [
              { label: 'Features', action: () => scrollTo('features') },
              { label: 'AI Tools', action: () => scrollTo('ai-copywriting') },
              { label: 'Chatbot', action: openPrintChat },
              { label: 'Services', action: () => scrollTo('services') },
            ] },
            { title: 'Portals', links: [{ label: 'Client Login', action: () => navigate('/customer-dashboard') }, { label: 'Staff Portal', action: () => navigate('/staff-login') }] },
            { title: 'Company', links: [{ label: 'About Us', action: () => scrollTo('about') }, { label: '077 723 4505', action: () => window.location.href = 'tel:0777234505' }] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #8b95a8)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map((link, j) => (
                  <li key={j} style={{ marginBottom: '11px' }}>
                    <button className="footer-link-h" type="button" onClick={link.action}
                      style={{ background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.2s', fontWeight: 500, textAlign: 'left' }}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>

      {/* New: Print Knowledge chatbot launch (matches dark + red/black theme) */}
      {launchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(6, 8, 16, 0.82)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.35s ease',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pk-launch-title"
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '22px',
              border: '1px solid rgba(255,51,51,0.35)',
              background: 'linear-gradient(165deg, #1a0000 0%, #000000 100%)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(204,0,0,0.12) inset',
              padding: '28px 26px 24px',
            }}
          >
            <button
              type="button"
              onClick={() => dismissLaunchModal(true)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '14px', right: '14px', width: '36px', height: '36px',
                border: 'none', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: '#999999',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
              }}
            >
              <X size={18} />
            </button>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px',
                background: 'rgba(255,51,51,0.12)', border: '1px solid rgba(255,51,51,0.3)',
                color: '#ff6666', fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '100px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              <Bell size={12} />
              New
            </div>
            <h2 id="pk-launch-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', paddingRight: '32px' }}>
              We&rsquo;ve launched our Print Knowledge Assistant
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#666666', marginBottom: '22px' }}>
              Ask about bleed, CMYK, paper weights, resolution, lamination, and more — right from the floating chat. No login required.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  openPrintChat();
                  dismissLaunchModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '14px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '14px', fontFamily: 'inherit', color: '#fff',
                  background: 'linear-gradient(135deg, #ff3333, #990000)',
                  boxShadow: '0 8px 32px rgba(255, 51, 51, 0.35)',
                }}
              >
                <MessageCircle size={18} />
                Open chat
              </button>
              <button
                type="button"
                onClick={() => dismissLaunchModal(true)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#999999', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Got it, thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
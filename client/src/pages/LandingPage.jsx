import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AnimatedBackground />
      
      {/* Navbar */}
      <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 32, height: 32, 
            background: 'rgba(255,255,255,0.2)', 
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>TaskFlow</span>
        </div>
        <div>
          <Link to="/login" className="btn btn-secondary" style={{ marginRight: 16, background: 'rgba(255,255,255,0.1)' }}>Log in</Link>
          <Link to="/register" className="btn btn-primary">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center', zIndex: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 24, letterSpacing: '0.05em' }}>
          EARLY ACCESS
        </div>
        
        <h1 style={{ fontSize: 64, fontWeight: 800, color: 'white', marginBottom: 24, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 800 }}>
          Manage your projects with absolute clarity.
        </h1>
        
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 48, maxWidth: 600, lineHeight: 1.6 }}>
          We're getting close to launch. Sign up to get early access to TaskFlow and start building your team's ultimate productivity hub.
        </p>

        {/* Waitlist Form Mock */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 80, width: '100%', maxWidth: 440 }}>
          <input 
            type="email" 
            placeholder="Your email address" 
            className="form-input"
            style={{ flex: 1, background: 'rgba(255,255,255,0.15)', height: 52 }}
          />
          <Link to="/register" className="btn btn-primary" style={{ height: 52 }}>
            Join Waitlist
          </Link>
        </div>

        {/* Product Mockup (Glass Card) */}
        <div className="card" style={{ width: '100%', maxWidth: 900, height: 500, padding: 32, display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ width: 120, height: 16, background: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: 80, height: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 200, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
                <div style={{ width: '60%', height: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 16 }} />
                <div style={{ width: '80%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: '40%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(transparent, rgba(255,255,255,0.1))' }} />
        </div>
      </main>
    </div>
  );
}

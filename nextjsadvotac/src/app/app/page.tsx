'use client';

import { useState, useEffect, useMemo } from 'react';
import './auth.css';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [rotatingTextIndex, setRotatingTextIndex] = useState(0);
  
  const rotatingTexts = useMemo(() => ['Research faster', 'Draft smarter', 'Cite accurately', 'Win cases'], []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setToast({ type: 'info', message: 'Redirecting to Google...' });
    window.location.href = '/api/auth/signin/google';
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-background"></div>
      
      <div className="auth-layout">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon-large">
                <img src="/advotac_logo.png" alt="Advotac Logo" />
              </div>
            </div>
            
            <h1 className="brand-headline">
              Sign in. <span className="rotating-text" key={rotatingTextIndex}>{rotatingTexts[rotatingTextIndex]}</span>
            </h1>
            <p className="brand-description">
              AI Legal Assistant for India. Research, draft, cite.
            </p>

            <ul className="brand-benefits">
              <li className="brand-benefit">
                <svg className="benefit-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accurate Indian statutes and judgments
              </li>
              <li className="brand-benefit">
                <svg className="benefit-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Citation-aware drafting
              </li>
              <li className="brand-benefit">
                <svg className="benefit-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Trusted by students, solo lawyers, teams
              </li>
            </ul>

            <p className="brand-footnote">Free for students to try</p>
          </div>

          <div className="brand-illustration">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20 L160 60 L160 140 L100 180 L40 140 L40 60 Z" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M80 80 L120 80 M100 60 L100 120" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
            </svg>
          </div>
        </div>

        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo-mobile">
                <div className="logo-icon-small">
                  <img src="/advotac_logo.png" alt="Advotac Logo" />
                </div>
                <span className="logo-text-small">Advotac</span>
              </div>
              <h2 className="auth-title">
                Welcome to Advotac
              </h2>
              <p className="auth-subtitle">
                Sign in with your Google account to get started
              </p>
            </div>

            <div className="oauth-section" style={{ marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="oauth-button"
                style={{ 
                  height: '3.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  backgroundColor: isLoading ? '#f1f5f9' : 'white'
                }}
              >
                <svg className="oauth-icon" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>

              <p style={{
                textAlign: 'center',
                fontSize: '0.875rem',
                color: '#64748b',
                marginTop: '1.5rem',
                lineHeight: '1.6'
              }}>
                By signing in, you agree to our <a href="/terms" style={{ color: '#007A78', textDecoration: 'underline' }}>Terms of Service</a> and <a href="/privacy" style={{ color: '#007A78', textDecoration: 'underline' }}>Privacy Policy</a>
              </p>
            </div>

            <div className="trust-strip">
              <div className="trust-badge">
                <svg className="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Data encrypted in transit and at rest
              </div>
              <div className="trust-badge">
                <svg className="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                ISO-aligned practices
              </div>
              <div className="trust-badge">
                <svg className="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                Made for Indian law
              </div>
            </div>

            <div className="auth-footer">
              <a href="/privacy" className="footer-link">Privacy Policy</a>
              <span className="footer-separator"></span>
              <a href="/terms" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          {toast.message}
          <button onClick={() => setToast(null)} className="toast-close" aria-label="Dismiss notification">
            
          </button>
        </div>
      )}
    </div>
  );
}

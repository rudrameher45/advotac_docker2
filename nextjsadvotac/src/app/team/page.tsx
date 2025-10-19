'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import './team.css';

export default function TeamPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    setIsVisible(true);

    // Set current year for copyright
    const yearElement = document.getElementById('year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear().toString();
    }

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.team-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="team-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/advotac_logo.png" alt="Advotac Logo" />
          </div>
          <ul className="nav-menu">
            <li><Link href="/" className="nav-link">Home</Link></li>
            <li><Link href="/about" className="nav-link">About</Link></li>
            <li><Link href="/team" className="nav-link active">Our Team</Link></li>
            <li><Link href="/solutions" className="nav-link">Solutions</Link></li>
            <li><Link href="/contact" className="nav-link">Contact Us</Link></li>
            <li><Link href="/privacy" className="nav-link">Privacy Policy</Link></li>
            <Link href="/auth" className="nav-cta">Get Started</Link>
          </ul>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>
      {/* Animated Background */}
      <div className="animated-background" aria-hidden="true"></div>

      {/* Hero Header */}
      <section className="hero-header">
        <div className="hero-content">
          <h1 className={`hero-title ${isVisible ? 'fade-in-up' : ''}`}>
            Meet the Minds Behind Advotac.
          </h1>
          <p className={`hero-subtitle ${isVisible ? 'fade-in-up delay-1' : ''}`}>
            A fusion of legal expertise and cutting-edge AI innovation. Our team is dedicated to transforming 
            the legal landscape through intelligent technology, making justice more accessible and efficient for everyone.
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="team-grid">
          {/* Male Member Card */}
          <div className="team-card reveal-element" style={{ animationDelay: '0ms' }}>
            <div className="card-inner">
              <div className="avatar-container">
                <svg className="avatar" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#007A78', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#009E9B', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="skinGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#FFCC99', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#FFB366', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Background Circle */}
                  <circle cx="100" cy="100" r="95" fill="url(#bgGrad1)" />
                  
                  {/* Decorative Elements */}
                  <circle cx="160" cy="60" r="20" fill="#FFFFFF" opacity="0.1" />
                  <circle cx="40" cy="140" r="25" fill="#FFFFFF" opacity="0.08" />
                  
                  {/* Body - Professional Suit */}
                  <ellipse cx="100" cy="160" rx="45" ry="55" fill="#1E293B" />
                  
                  {/* Shirt & Tie */}
                  <path d="M 85 125 L 80 135 L 90 145 L 95 135 Z" fill="#FFFFFF" />
                  <path d="M 115 125 L 120 135 L 110 145 L 105 135 Z" fill="#FFFFFF" />
                  <polygon points="100,130 95,150 100,155 105,150" fill="#F39200" />
                  <rect x="95" y="125" width="10" height="8" fill="#FFFFFF" />
                  
                  {/* Laptop Icon */}
                  <rect x="130" y="155" width="40" height="30" rx="3" fill="#334155" opacity="0.6" />
                  <rect x="132" y="157" width="36" height="22" fill="#007A78" opacity="0.3" />
                  <line x1="137" y1="161" x2="163" y2="161" stroke="#00C9C5" strokeWidth="2" opacity="0.4" />
                  
                  {/* Head */}
                  <circle cx="100" cy="90" r="32" fill="url(#skinGrad1)" />
                  
                  {/* Modern Hair */}
                  <ellipse cx="100" cy="70" rx="35" ry="30" fill="#0F172A" />
                  <path d="M 65 85 Q 65 60 100 55 Q 135 60 135 85 L 130 82 Q 125 65 100 63 Q 75 65 70 82 Z" fill="#1E293B" />
                  
                  {/* Glasses - Modern Style */}
                  <rect x="78" y="85" width="16" height="12" rx="2" fill="none" stroke="#334155" strokeWidth="2.5" />
                  <rect x="106" y="85" width="16" height="12" rx="2" fill="none" stroke="#334155" strokeWidth="2.5" />
                  <line x1="94" y1="91" x2="106" y2="91" stroke="#334155" strokeWidth="2.5" />
                  <line x1="78" y1="91" x2="72" y2="91" stroke="#334155" strokeWidth="2" />
                  <line x1="122" y1="91" x2="128" y2="91" stroke="#334155" strokeWidth="2" />
                  
                  {/* Eyes */}
                  <circle cx="86" cy="91" r="2.5" fill="#1E293B" />
                  <circle cx="114" cy="91" r="2.5" fill="#1E293B" />
                  <circle cx="87" cy="90" r="1" fill="#FFFFFF" />
                  <circle cx="115" cy="90" r="1" fill="#FFFFFF" />
                  
                  {/* Smile */}
                  <path d="M 88 105 Q 100 112 112 105" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              <div className="member-info">
                <h2 className="member-name">Rudra Meher</h2>
                <p className="member-role">Co-Founder & AI Research Lead</p>
                
                <div className="bio-container">
                  <svg className="quote-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 7C10 4.79086 8.20914 3 6 3C3.79086 3 2 4.79086 2 7C2 9.20914 3.79086 11 6 11C6.55228 11 7 11.4477 7 12V13C7 14.6569 5.65685 16 4 16H3C2.44772 16 2 16.4477 2 17C2 17.5523 2.44772 18 3 18H4C6.76142 18 9 15.7614 9 13V12C9 10.3431 10.3431 9 12 9C10.8954 9 10 8.10457 10 7ZM22 7C22 4.79086 20.2091 3 18 3C15.7909 3 14 4.79086 14 7C14 9.20914 15.7909 11 18 11C18.5523 11 19 11.4477 19 12V13C19 14.6569 17.6569 16 16 16H15C14.4477 16 14 16.4477 14 17C14 17.5523 14.4477 18 15 18H16C18.7614 18 21 15.7614 21 13V12C21 10.3431 22.3431 9 24 9C22.8954 9 22 8.10457 22 7Z" fill="#F39200"/>
                  </svg>
                  <p className="member-bio">
                    Blending law and AI to make justice accessible. Passionate about scalable RAG systems 
                    and building future-ready legal intelligence.
                  </p>
                </div>

                <div className="social-links">
                  <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="mailto:rudra@advotac.com" className="social-icon" aria-label="Email">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Female Member Card */}
          <div className="team-card reveal-element" style={{ animationDelay: '100ms' }}>
            <div className="card-inner">
              <div className="avatar-container">
                <svg className="avatar" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#FFE5CC', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#F39200', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="skinGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#FFD4A3', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#FFBB77', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Background Circle */}
                  <circle cx="100" cy="100" r="95" fill="url(#bgGrad2)" />
                  
                  {/* Decorative Elements */}
                  <circle cx="150" cy="50" r="22" fill="#FFFFFF" opacity="0.12" />
                  <circle cx="45" cy="150" r="28" fill="#FFFFFF" opacity="0.1" />
                  
                  {/* Body - Professional Blazer */}
                  <ellipse cx="100" cy="160" rx="45" ry="55" fill="#007A78" />
                  
                  {/* Blouse/Shirt */}
                  <path d="M 85 125 L 78 135 L 88 145 L 93 135 Z" fill="#F8FAFC" />
                  <path d="M 115 125 L 122 135 L 112 145 L 107 135 Z" fill="#F8FAFC" />
                  <rect x="93" y="125" width="14" height="20" fill="#F8FAFC" />
                  
                  {/* Necklace/Accessory */}
                  <ellipse cx="100" cy="125" rx="18" ry="3" fill="#FFD700" opacity="0.7" />
                  
                  {/* Tablet with Design */}
                  <rect x="125" y="152" width="38" height="45" rx="4" fill="#E2E8F0" />
                  <rect x="128" y="155" width="32" height="35" fill="#FFFFFF" />
                  <line x1="133" y1="162" x2="155" y2="162" stroke="#007A78" strokeWidth="2.5" />
                  <line x1="133" y1="168" x2="155" y2="168" stroke="#F39200" strokeWidth="2" />
                  <line x1="133" y1="173" x2="148" y2="173" stroke="#CBD5E1" strokeWidth="2" />
                  <circle cx="145" cy="182" r="3" fill="#007A78" />
                  
                  {/* Head */}
                  <circle cx="100" cy="90" r="32" fill="url(#skinGrad2)" />
                  
                  {/* Modern Hair - Longer Style */}
                  <ellipse cx="100" cy="65" rx="38" ry="32" fill="#2D1B00" />
                  <path d="M 62 88 Q 60 65 100 58 Q 140 65 138 88 Q 135 75 120 70 Q 110 68 100 68 Q 90 68 80 70 Q 65 75 62 88 Z" fill="#3D2A00" />
                  
                  {/* Hair Waves */}
                  <path d="M 65 82 Q 70 78 75 82" fill="none" stroke="#4D3A00" strokeWidth="2" opacity="0.3" />
                  <path d="M 125 82 Q 120 78 115 82" fill="none" stroke="#4D3A00" strokeWidth="2" opacity="0.3" />
                  
                  {/* Eyebrows */}
                  <path d="M 82 82 Q 88 80 94 82" fill="none" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 106 82 Q 112 80 118 82" fill="none" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Eyes - Expressive */}
                  <ellipse cx="88" cy="92" rx="4" ry="5" fill="#1E293B" />
                  <ellipse cx="112" cy="92" rx="4" ry="5" fill="#1E293B" />
                  <circle cx="89" cy="91" r="1.5" fill="#FFFFFF" />
                  <circle cx="113" cy="91" r="1.5" fill="#FFFFFF" />
                  
                  {/* Eyelashes */}
                  <path d="M 84 89 L 83 87" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 88 88 L 88 86" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 108 89 L 109 87" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 112 88 L 112 86" stroke="#1E293B" strokeWidth="1" strokeLinecap="round" />
                  
                  {/* Nose */}
                  <path d="M 100 95 L 98 100" fill="none" stroke="#FFBB77" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  
                  {/* Smile */}
                  <path d="M 87 106 Q 100 114 113 106" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Earrings */}
                  <circle cx="68" cy="95" r="4" fill="#F39200" opacity="0.9" />
                  <circle cx="132" cy="95" r="4" fill="#F39200" opacity="0.9" />
                  <circle cx="68" cy="95" r="2" fill="#FFD700" />
                  <circle cx="132" cy="95" r="2" fill="#FFD700" />
                </svg>
              </div>

              <div className="member-info">
                <h2 className="member-name">Shivangi Dwivedi</h2>
                <p className="member-role">Co-Founder & Product/Design Head</p>
                
                <div className="bio-container">
                  <svg className="quote-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 7C10 4.79086 8.20914 3 6 3C3.79086 3 2 4.79086 2 7C2 9.20914 3.79086 11 6 11C6.55228 11 7 11.4477 7 12V13C7 14.6569 5.65685 16 4 16H3C2.44772 16 2 16.4477 2 17C2 17.5523 2.44772 18 3 18H4C6.76142 18 9 15.7614 9 13V12C9 10.3431 10.3431 9 12 9C10.8954 9 10 8.10457 10 7ZM22 7C22 4.79086 20.2091 3 18 3C15.7909 3 14 4.79086 14 7C14 9.20914 15.7909 11 18 11C18.5523 11 19 11.4477 19 12V13C19 14.6569 17.6569 16 16 16H15C14.4477 16 14 16.4477 14 17C14 17.5523 14.4477 18 15 18H16C18.7614 18 21 15.7614 21 13V12C21 10.3431 22.3431 9 24 9C22.8954 9 22 8.10457 22 7Z" fill="#F39200"/>
                  </svg>
                  <p className="member-bio">
                    Translating complex ideas into elegant, human-centered designs. Focused on usability, 
                    empathy, and innovation to create seamless user experiences.
                  </p>
                </div>

                <div className="social-links">
                  <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="mailto:shivangi@advotac.com" className="social-icon" aria-label="Email">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h3 className="cta-title">Join Us in Building the Future of Legal AI</h3>
          <button className="cta-button" onClick={() => window.location.href = '/auth'}>
            <span className="button-text">Get Started Today</span>
            <span className="ripple"></span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="team-footer">
        <div className="footer-content">
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
          
          <p className="copy">
            © <span id="year"></span> Advotac Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '../styles.css';
import './about.css';

export default function AboutPage() {
  const [typedText, setTypedText] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [counters, setCounters] = useState({ sections: 0, timeSaved: 0, traceability: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);

  const fullText = 'Empowering Legal Minds with AI Intelligence';
  
  const quotes = [
    { text: "We started Advotac to solve the challenge we faced every day - finding accurate legal precedents quickly.", author: "Founder, Advotac" },
    { text: "Indian law practitioners deserve tools as sophisticated as their international counterparts.", author: "Co-Founder, Advotac" },
    { text: "Our mission is to make every lawyer, from students to senior advocates, more efficient.", author: "CTO, Advotac" }
  ];

  // Typing animation
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, []);

  // Quote carousel
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(quoteInterval);
  }, [quotes.length]);

  // Counter animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounters();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCounters = () => {
    const duration = 1200;
    const targets = { sections: 50000, timeSaved: 85, traceability: 99 };
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic easing

      setCounters({
        sections: Math.floor(targets.sections * easeProgress),
        timeSaved: Math.floor(targets.timeSaved * easeProgress),
        traceability: Math.floor(targets.traceability * easeProgress),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/advotac_logo.png" alt="Advotac Logo" />
          </div>
          <ul className="nav-menu">
            <li><Link href="/" className="nav-link">Home</Link></li>
            <li><Link href="/about" className="nav-link active">About</Link></li>
            <li><Link href="/team" className="nav-link">Our Team</Link></li>
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

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <div className="about-hero-noise"></div>
          <div className="about-hero-animation">
            <svg viewBox="0 0 400 300" className="floating-scales">
              <g className="scale-orbit">
                <path d="M200,150 L180,170 M200,150 L220,170" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
                <circle cx="180" cy="180" r="8" fill="rgba(255,255,255,0.2)"/>
                <circle cx="220" cy="180" r="8" fill="rgba(255,255,255,0.2)"/>
                <rect x="195" y="145" width="10" height="5" fill="rgba(255,255,255,0.3)"/>
              </g>
            </svg>
          </div>
        </div>
        <div className="about-hero-content">
          <h1 className="about-hero-title">
            {typedText}
            <span className="typing-cursor">|</span>
          </h1>
          <p className="about-hero-subtitle">
            Advotac is India&apos;s first AI-powered legal research assistant designed specifically for 
            Indian law practitioners, students, and legal professionals. We combine cutting-edge 
            AI technology with comprehensive legal databases to revolutionize how legal research is done.
          </p>
          <div className="about-hero-buttons">
            <Link href="/auth" className="btn-primary-hero">Start Your Journey</Link>
            <Link href="#mission" className="btn-ghost-hero">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-marquee">
          <div className="trust-logos">
            <div className="trust-logo">National Law School</div>
            <div className="trust-logo">NALSAR</div>
            <div className="trust-logo">NLSIU</div>
            <div className="trust-logo">Bombay High Court</div>
            <div className="trust-logo">Delhi High Court</div>
            <div className="trust-logo">Supreme Court Bar</div>
            <div className="trust-logo">Leading Chambers</div>
            <div className="trust-logo">Corporate Legal Depts</div>
          </div>
          <div className="trust-logos" aria-hidden="true">
            <div className="trust-logo">National Law School</div>
            <div className="trust-logo">NALSAR</div>
            <div className="trust-logo">NLSIU</div>
            <div className="trust-logo">Bombay High Court</div>
            <div className="trust-logo">Delhi High Court</div>
            <div className="trust-logo">Supreme Court Bar</div>
            <div className="trust-logo">Leading Chambers</div>
            <div className="trust-logo">Corporate Legal Depts</div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Cards */}
      <section className="mission-vision" id="mission">
        <div className="container-about">
          <div className="mv-grid">
            <div className="mv-card mission-card">
              <div className="mv-accent mission-accent"></div>
              <div className="mv-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#007A78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="#007A78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#007A78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Our Mission</h3>
              <p>
                To democratize legal research and empower every legal professional in India with 
                AI-powered tools that make research faster, citations accurate, and legal work more efficient.
              </p>
            </div>

            <div className="mv-card vision-card">
              <div className="mv-accent vision-accent"></div>
              <div className="mv-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#F39200" strokeWidth="2"/>
                  <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="#F39200" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Our Vision</h3>
              <p>
                To become the primary AI companion for every legal professional in India, setting 
                global standards for legal AI while staying rooted in Indian jurisprudence and values.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Split */}
      <section className="problem-solution">
        <div className="container-about">
          <div className="ps-grid">
            <div className="ps-problem">
              <h2>The Challenge</h2>
              <ul className="ps-list">
                <li>
                  <span className="highlight-chip">Hours wasted</span> searching through scattered legal databases
                </li>
                <li>
                  <span className="highlight-chip">Missing citations</span> that could strengthen arguments
                </li>
                <li>
                  <span className="highlight-chip">Outdated research</span> methods in a digital age
                </li>
                <li>
                  <span className="highlight-chip">High costs</span> of premium legal research tools
                </li>
              </ul>
            </div>
            <div className="ps-divider"></div>
            <div className="ps-solution">
              <h2>Our Solution</h2>
              <ul className="ps-list solution-list">
                <li>
                  <svg viewBox="0 0 20 20" className="check-icon">
                    <circle cx="10" cy="10" r="9" fill="#007A78" opacity="0.1"/>
                    <path d="M6 10L9 13L14 7" stroke="#007A78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <strong>AI-Powered Search</strong>
                    <p className="solution-caption">Citation-aware, covering Indian Acts + Supreme Court & High Court Judgments</p>
                  </div>
                </li>
                <li>
                  <svg viewBox="0 0 20 20" className="check-icon">
                    <circle cx="10" cy="10" r="9" fill="#007A78" opacity="0.1"/>
                    <path d="M6 10L9 13L14 7" stroke="#007A78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <strong>Smart Document Drafting</strong>
                    <p className="solution-caption">Generate accurate legal documents with relevant precedents</p>
                  </div>
                </li>
                <li>
                  <svg viewBox="0 0 20 20" className="check-icon">
                    <circle cx="10" cy="10" r="9" fill="#007A78" opacity="0.1"/>
                    <path d="M6 10L9 13L14 7" stroke="#007A78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <strong>Instant Q&A Assistant</strong>
                    <p className="solution-caption">Get immediate answers to complex legal questions with source citations</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Compliance */}
      <section className="tech-compliance">
        <div className="container-about">
          <h2 className="section-title">Technology & Compliance</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <h4>RAG Architecture</h4>
              <p>Retrieval-Augmented Generation for accurate, contextual responses</p>
              <div className="badge-tech">RAG</div>
            </div>
            <div className="tech-card">
              <h4>Hybrid Search</h4>
              <p>Combining semantic and keyword search for precision</p>
              <div className="badge-tech">Hybrid Search</div>
            </div>
            <div className="tech-card">
              <h4>Citation Tracking</h4>
              <p>Every answer traced back to authoritative sources</p>
              <div className="badge-tech">Citation Trails</div>
            </div>
            <div className="tech-card compliance-card">
              <h4>Data Compliance</h4>
              <p>India-hosted data centers, GDPR-ready, SOC 2 compliant. Your data never leaves Indian jurisdiction.</p>
              <div className="badge-tech">Data Residency</div>
            </div>
          </div>
          
          <div className="tech-diagram">
            <svg viewBox="0 0 800 200" className="flow-diagram">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#007A78" />
                </marker>
              </defs>
              <g className="flow-step">
                <rect x="10" y="70" width="120" height="60" rx="12" fill="#E6FFFD" stroke="#007A78" strokeWidth="2"/>
                <text x="70" y="105" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="600">Documents</text>
              </g>
              <path d="M130,100 L180,100" stroke="#007A78" strokeWidth="2" markerEnd="url(#arrowhead)" className="flow-path"/>
              <g className="flow-step">
                <rect x="180" y="70" width="120" height="60" rx="12" fill="#E6FFFD" stroke="#007A78" strokeWidth="2"/>
                <text x="240" y="105" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="600">Chunking</text>
              </g>
              <path d="M300,100 L350,100" stroke="#007A78" strokeWidth="2" markerEnd="url(#arrowhead)" className="flow-path"/>
              <g className="flow-step">
                <rect x="350" y="70" width="120" height="60" rx="12" fill="#E6FFFD" stroke="#007A78" strokeWidth="2"/>
                <text x="410" y="105" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="600">Embeddings</text>
              </g>
              <path d="M470,100 L520,100" stroke="#007A78" strokeWidth="2" markerEnd="url(#arrowhead)" className="flow-path"/>
              <g className="flow-step">
                <rect x="520" y="70" width="120" height="60" rx="12" fill="#E6FFFD" stroke="#007A78" strokeWidth="2"/>
                <text x="580" y="105" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="600">Reranker</text>
              </g>
              <path d="M640,100 L670,100" stroke="#007A78" strokeWidth="2" markerEnd="url(#arrowhead)" className="flow-path"/>
              <g className="flow-step">
                <rect x="670" y="70" width="120" height="60" rx="12" fill="#FFE5CC" stroke="#F39200" strokeWidth="2"/>
                <text x="730" y="105" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="600">LLM</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Founding Story */}
      <section className="founding-story">
        <div className="container-about">
          <div className="story-content">
            <h2>Our Story</h2>
            <p className="story-intro">
              Advotac was born from a simple observation: legal professionals in India spend countless 
              hours on research that technology could accelerate. Our founding team, combining legal 
              expertise with AI innovation, set out to build the tool they wished existed.
            </p>
            
            <div className="quote-carousel">
              <div className="quote-track" style={{ transform: `translateX(-${currentQuote * 100}%)` }}>
                {quotes.map((quote, index) => (
                  <div key={index} className="quote-slide">
                    <blockquote>{quote.text}</blockquote>
                    <cite>— {quote.author}</cite>
                  </div>
                ))}
              </div>
              <div className="quote-dots">
                {quotes.map((_, index) => (
                  <button
                    key={index}
                    className={`quote-dot ${currentQuote === index ? 'active' : ''}`}
                    onClick={() => setCurrentQuote(index)}
                    aria-label={`Go to quote ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="impact-metrics" ref={counterRef}>
        <div className="container-about">
          <h2 className="section-title">Our Impact</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{counters.sections.toLocaleString()}+</div>
              <div className="metric-label">Legal Sections Indexed</div>
              <svg className="metric-sparkline" viewBox="0 0 100 30">
                <polyline points="0,25 20,20 40,15 60,10 80,8 100,5" fill="none" stroke="#007A78" strokeWidth="2"/>
                <circle cx="100" cy="5" r="3" fill="#F39200"/>
              </svg>
            </div>
            <div className="metric-card">
              <div className="metric-value">{counters.timeSaved}%</div>
              <div className="metric-label">Avg. Time Saved on Research</div>
              <svg className="metric-sparkline" viewBox="0 0 100 30">
                <polyline points="0,20 20,18 40,14 60,12 80,8 100,5" fill="none" stroke="#007A78" strokeWidth="2"/>
                <circle cx="100" cy="5" r="3" fill="#F39200"/>
              </svg>
            </div>
            <div className="metric-card">
              <div className="metric-value">{counters.traceability}%</div>
              <div className="metric-label">Answer Traceability Score</div>
              <svg className="metric-sparkline" viewBox="0 0 100 30">
                <polyline points="0,28 20,25 40,20 60,15 80,10 100,5" fill="none" stroke="#007A78" strokeWidth="2"/>
                <circle cx="100" cy="5" r="3" fill="#F39200"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Ethics & Privacy Accordion */}
      <section className="ethics-privacy">
        <div className="container-about">
          <h2 className="section-title">Ethics & Privacy</h2>
          <div className="accordion">
            {[
              { 
                icon: '🔒', 
                title: 'Data Security', 
                content: 'Your data is encrypted end-to-end using industry-standard AES-256 encryption. We employ multi-factor authentication and regular security audits to protect your information.' 
              },
              { 
                icon: '📎', 
                title: 'Privacy First', 
                content: 'We never sell your data. Your queries and documents remain confidential and are used solely to provide you with better service. We comply with all Indian data protection regulations.' 
              },
              { 
                icon: '💾', 
                title: 'Data Residency', 
                content: 'All data is stored in India-based data centers, ensuring compliance with local regulations. Your sensitive legal information never crosses international borders.' 
              },
              { 
                icon: '🛡️', 
                title: 'AI Ethics', 
                content: 'Our AI is designed to assist, not replace, legal judgment. We maintain transparency in how our AI works and continuously monitor for bias and accuracy.' 
              },
              { 
                icon: '⚖️', 
                title: 'Professional Standards', 
                content: 'Advotac adheres to the highest professional standards. We work with legal experts to ensure our platform supports ethical legal practice.' 
              },
            ].map((item, index) => (
              <div key={index} className={`accordion-item ${activeAccordion === index ? 'active' : ''}`}>
                <button
                  className="accordion-header"
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={activeAccordion === index}
                >
                  <span className="accordion-icon">{item.icon}</span>
                  <span className="accordion-title">{item.title}</span>
                  <svg
                    className="accordion-chevron"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="accordion-content">
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="cta-band">
        <div className="container-about">
          <h2>Ready to Transform Your Legal Practice?</h2>
          <p>Join thousands of legal professionals who trust Advotac</p>
          <Link href="/auth" className="btn-cta-glow">Get Started Today</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="container-about">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>About</h4>
              <ul>
                <li><Link href="/about">Our Story</Link></li>
                <li><Link href="/about#mission">Mission & Vision</Link></li>
                <li><Link href="#">Careers</Link></li>
                <li><Link href="#">Press Kit</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><Link href="/#features">Features</Link></li>
                <li><Link href="#">Pricing</Link></li>
                <li><Link href="#">API</Link></li>
                <li><Link href="#">Integrations</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="#">Terms of Service</Link></li>
                <li><Link href="#">Security</Link></li>
                <li><Link href="#">Responsible AI</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <ul>
                <li><Link href="#">Support</Link></li>
                <li><Link href="#">Contact Us</Link></li>
                <li><Link href="#">Feedback</Link></li>
                <li><Link href="#">Community</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Social</h4>
              <div className="social-icons">
                <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
              </div>
            </div>
          </div>
          
          <div className="footer-divider"></div>
          
          <div className="footer-bottom">
            <div className="footer-links">
              <Link href="#">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="#">Security</Link>
              <Link href="#">Responsible AI</Link>
            </div>
            <div className="footer-copyright">
              Copyright © <span id="year">{new Date().getFullYear()}</span> Advotac Technologies. All rights reserved. 
              Built in India for Indian law. &quot;Advotac&quot; and the Advotac logo are trademarks of Advotac Technologies Private Ltd.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
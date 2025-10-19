'use client';
import Link from 'next/link';
import './styles.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isTyped, setIsTyped] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    // Add typewriter effect completion after animation
    const timer = setTimeout(() => {
      setIsTyped(true);
    }, 3500); // 3s typewriter + 0.5s delay

    return () => clearTimeout(timer);
  }, []);

  const toggleUseCase = (caseId: string) => {
    // Toggle use case visibility
    const element = document.getElementById(`${caseId}-case`);
    if (element) {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <div className="home-page-wrapper">
    {/* <!-- Navigation --> */}
    <nav className="navbar">
        <div className="nav-container">
            <div className="nav-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/advotac_logo.png" alt="" />
                {/* <span>Advotac</span> */}
            </div>
            <ul className="nav-menu">
                <li><Link href="/" className="nav-link active">Home</Link></li>
                <li><Link href="/about" className="nav-link">About</Link></li>
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


        <section className="hero">
        <div className="hero-container">
            <div className="hero-content">
                <h1 className="hero-title">
                    <span className={`typewriter-text ${isTyped ? 'typed' : ''}`}>
                        Revolutionize Your Legal Practice with 
                    </span>
                    <br />
                    <span className="gradient-text">AI Intelligence</span>
                </h1>
                <p className="hero-subtitle">
                    Empower your legal work with cutting-edge AI technology. Research faster, draft smarter, and get instant answers to complex legal questions.
                </p>
                <div className="hero-features">
                    <div className="feature-item">
                        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>AI Legal Research</span>
                    </div>
                    <div className="feature-item">
                        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Smart Drafting</span>
                    </div>
                    <div className="feature-item">
                        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 12H16M8 16H16M8 8H16M6 20H18C19.1 20 20 19.1 20 18V6C20 4.9 19.1 4 18 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Q&A Assistant</span>
                    </div>
                </div>
                <div className="hero-buttons">
                    <a href="#features" className="btn-secondary">Learn More</a>
                </div>
            </div>
            <div className="hero-visual">
                <div className="hero-card floating">
                    <div className="card-header">
                        <div className="card-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    <div className="card-content">
                        <h3>Legal Research Query</h3>
                        <p>&quot;What are the recent amendments to the Indian Contract Act regarding digital signatures?&quot;</p>
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* <!-- Features Section --> */}
    <section id="features" className="features">
        <div className="container">
            <div className="section-header">
                <h2>Powerful AI Features for Legal Professionals</h2>
                <p>Transform your legal practice with our comprehensive suite of AI-powered tools</p>
            </div>
            <div className="features-grid">
                <div className="feature-card" data-aos="fade-up">
                    <div className="feature-icon-wrapper">
                        <svg className="feature-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 16V8C21 6.89 20.11 6 19 6H5C3.89 6 3 6.89 3 8V16C3 17.11 3.89 18 5 18H19C20.11 18 21 17.11 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 10H17M7 14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>AI Legal Research</h3>
                    <p>Access comprehensive legal databases and get instant, accurate research results with our advanced AI algorithms.</p>
                </div>
                <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
                    <div className="feature-icon-wrapper">
                        <svg className="feature-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Smart Document Drafting</h3>
                    <p>Create professional legal documents with AI assistance. Generate contracts, agreements, and legal briefs efficiently.</p>
                </div>
                <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
                    <div className="feature-icon-wrapper">
                        <svg className="feature-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Question & Answer</h3>
                    <p>Get instant answers to complex legal questions. Our AI understands context and provides accurate, relevant responses.</p>
                </div>
            </div>
            <div className="section-cta">
                <a href="get-started.html" className="btn-primary">Start Free Trial</a>
                <a href="#pricing" className="btn-secondary">View Pricing</a>
            </div>
        </div>
    </section>

    {/* <!-- User Personas Section --> */}
    <section className="personas">
        <div className="container">
            <div className="section-header">
                <h2>Designed for Every Legal Professional</h2>
                <p>Tailored solutions for different legal practice needs</p>
            </div>
            <div className="personas-grid">
                <div className="persona-card" onClick={() => toggleUseCase('law-firms')}>
                    <div className="persona-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Law Firms</h3>
                    <p>Scale your practice with AI-powered research and document automation</p>
                    <div className="use-case" id="law-firms-case">
                        <ul>
                            <li>Multi-lawyer collaboration tools</li>
                            <li>Case management integration</li>
                            <li>Bulk document processing</li>
                            <li>Client portal access</li>
                            <li>Advanced analytics and reporting</li>
                        </ul>
                    </div>
                </div>

 
                <div className="persona-card" onClick={() => toggleUseCase('corporate-legal')}>
                    <div className="persona-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 21H21M5 21V7L13 2L21 7V21M9 9H15M9 13H15M9 17H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Corporate Legal</h3>
                    <p>Streamline in-house legal operations with enterprise-grade AI tools</p>
                    <div className="use-case" id="corporate-legal-case">
                        <ul>
                            <li>Contract analysis and review</li>
                            <li>Compliance monitoring</li>
                            <li>Risk assessment tools</li>
                            <li>Enterprise security standards</li>
                            <li>Custom workflow integration</li>
                        </ul>
                    </div>
                </div>

                <div className="persona-card" onClick={() => toggleUseCase('law-students')}>
                    <div className="persona-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 10V6C22 4.89 21.11 4 20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 14H12C10.89 14 10 14.89 10 16V18C10 19.11 10.89 20 12 20H22V14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 14V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6 8H18M6 12H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Law Students</h3>
                    <p>Accelerate your legal education with AI-powered study tools</p>
                    <div className="use-case" id="law-students-case">
                        <ul>
                            <li>Case law research assistance</li>
                            <li>Legal writing improvement</li>
                            <li>Exam preparation tools</li>
                            <li>Interactive legal tutorials</li>
                            <li>Career guidance resources</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="section-cta">
            </div>
        </div>
    </section>

    {/* <!-- Pricing Section --> */}
    <section className="pricing">
        <div className="container">
            <div className="section-header">
                <h2>Choose Your Perfect Plan</h2>
                <p>Flexible pricing options for every legal professional</p>
            </div>
            <div className="pricing-grid">
                <div className="pricing-card student-special">
                    <div className="student-badge">🎓 Student Special</div>
                    <div className="pricing-header">
                        <h3>Student</h3>
                        <div className="price">
                            <span className="currency">₹</span>
                            <span className="amount">199</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <ul className="pricing-features">
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Basic legal research
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Document templates
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Q&A assistance (50 queries/month)
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Study materials access
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Email support
                        </li>
                    </ul>
                    <a href="get-started.html" className="pricing-btn">Get Started</a>
                  
                    
                </div>

                <div className="pricing-card featured">
                    <div className="pricing-badge">Most Popular</div>
                    <div className="pricing-header">
                        <h3>Lawyer / Advocate</h3>
                        <div className="price">
                            <span className="currency">₹</span>
                            <span className="amount">499</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <ul className="pricing-features">
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Advanced legal research
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Smart document drafting
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Unlimited Q&A queries
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Case management tools
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Priority support
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            API access
                        </li>
                    </ul>
                    <a href="get-started.html" className="pricing-btn">Get Started</a>
                </div>

                <div className="pricing-card">
                    <div className="pricing-header">
                        <h3>Premium</h3>
                        <div className="price">
                            <span className="currency">₹</span>
                            <span className="amount">1,499</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <ul className="pricing-features">
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Everything in Lawyer plan
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Multi-user collaboration
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Advanced analytics
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Custom integrations
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            White-label solutions
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            24/7 phone support
                        </li>
                        <li>
                            <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Dedicated account manager
                        </li>
                    </ul>
                    <a href="get-started.html" className="pricing-btn">Get Started</a>
                </div>
            </div>
        </div>
    </section>

    {/* <!-- Cloud Partners Section --> */}
    <section className="cloud-partners">
        <div className="container">
            <div className="section-header">
                <h2>Powered by Industry-Leading Cloud Infrastructure</h2>
                <p>Built on secure, scalable, and reliable cloud platforms</p>
            </div>
            <div className="partners-content">
                <div className="partners-grid">
                    {/* AWS Card */}
                    <div className="partner-card-compact" data-aos="fade-up">
                        <div className="partner-logo-wrapper-compact">
                            <svg className="partner-logo aws-logo" viewBox="0 0 304 182" xmlns="http://www.w3.org/2000/svg">
                                <g fill="currentColor" fillRule="evenodd">
                                    <path d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6s14.2-7.8 24.5-7.8c3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.8 0-3-.3-3.8-1-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9 1 .8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9.8-.6 2.2-1 4-1h8c1.9 0 3.2.3 4 1 .8.6 1.5 2 1.9 3.9l15.8 67.1 17.3-67.1c.6-2 1.3-3.3 2-3.9.8-.6 2.1-1 3.9-1h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.3c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1 1-3.8 1h-8.6c-1.9 0-3.2-.3-4-1-.8-.7-1.5-2-1.9-4L156 23l-15.4 64.4c-.5 2-1.1 3.3-1.9 4-.8.7-2.2 1-4 1h-8.6zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2L246 52c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.9 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1z"/>
                                    <path d="M273.5 143.7c-32.9 24.3-80.7 37.2-121.8 37.2-57.6 0-109.5-21.3-148.7-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.6 94.7 39.5 148.8 39.5 36.5 0 76.6-7.6 113.5-23.2 5.5-2.5 10.2 3.6 4.8 7.6z"/>
                                    <path d="M287.2 128.1c-4.2-5.4-27.8-2.6-38.5-1.3-3.2.4-3.7-2.4-.8-4.5 18.8-13.2 49.7-9.4 53.3-5 3.6 4.5-1 35.4-18.6 50.2-2.7 2.3-5.3 1.1-4.1-1.9 4-9.9 12.9-32.2 8.7-37.5z"/>
                                </g>
                            </svg>
                        </div>
                        <div className="partner-info-compact">
                            <h3>Amazon Web Services</h3>
                            <p>Enterprise-grade cloud security and scalability</p>
                        </div>
                    </div>

                    {/* Azure Card */}
                    <div className="partner-card-compact" data-aos="fade-up" data-aos-delay="100">
                        <div className="partner-logo-wrapper-compact">
                            <svg className="partner-logo azure-logo" viewBox="0 0 19 15" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.8 0L0 13.1L5.3 15L13 2.2L7.8 0ZM11.7 3.9L6.8 13.7H19L11.7 3.9Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div className="partner-info-compact">
                            <h3>Microsoft Azure</h3>
                            <p>Intelligent cloud platform with AI capabilities</p>
                        </div>
                    </div>
                </div>
                
                <div className="partners-trust">
                    <p className="trust-text">
                        <svg className="shield-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Your data is protected with bank-level security on enterprise cloud infrastructure
                    </p>
                </div>
            </div>
        </div>
    </section>

        {/* <!-- Trust & Credibility Section --> */}
    <section className="trust-section">
        <div className="container">
            <div className="trust-stats">
                <div className="stat-item">
                    <div className="stat-number">5000+</div>
                    <div className="stat-label">Legal Professionals</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">10,000+</div>
                    <div className="stat-label">Law Students</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">50,000+</div>
                    <div className="stat-label">Documents Drafted</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">99.9%</div>
                    <div className="stat-label">Uptime Guaranteed</div>
                </div>
            </div>

            {/* Security Badge */}
            <div className="security-badge">
                <svg className="security-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div className="security-text">
                    <h4>Bank-Level Security</h4>
                    <p>Your data is encrypted & protected with industry-leading security standards</p>
                </div>
            </div>
        </div>
    </section>

    {/* <!-- Testimonials Section --> */}
    <section className="testimonials">
        <div className="container">
            <div className="section-header">
                <h2>What Legal Professionals Say About Us</h2>
                <p>Trusted by thousands of lawyers, advocates, and law students across India</p>
            </div>
            <div className="testimonials-grid">
                <div className="testimonial-card">
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-text">
                        &quot;Advotac has transformed my legal research process. What used to take hours now takes minutes. The AI-powered search is incredibly accurate.&quot;
                    </p>
                    <div className="testimonial-author">
                        <div className="author-avatar">A</div>
                        <div className="author-info">
                            <h4>Adv. Priya Sharma</h4>
                            <p>Senior Advocate, Delhi High Court</p>
                        </div>
                    </div>
                </div>

                <div className="testimonial-card">
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-text">
                        &quot;As a law student, this platform has been invaluable. The Q&A feature helps me understand complex legal concepts instantly.&quot;
                    </p>
                    <div className="testimonial-author">
                        <div className="author-avatar">R</div>
                        <div className="author-info">
                            <h4>Rahul Mehta</h4>
                            <p>3rd Year Law Student, NLSIU</p>
                        </div>
                    </div>
                </div>

                <div className="testimonial-card">
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-text">
                        &quot;The document drafting feature saves us countless hours. It&apos;s like having an AI assistant that never sleeps.&quot;
                    </p>
                    <div className="testimonial-author">
                        <div className="author-avatar">V</div>
                        <div className="author-info">
                            <h4>Vikram Singh</h4>
                            <p>Partner, Singh & Associates</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* <!-- AI Demo Section --> */}
    <section className="ai-demo">
        <div className="container">
            <div className="demo-content">
                <div className="demo-info">
                    <h2>Experience AI-Powered Legal Assistance</h2>
                    <p>Try our AI assistant with a sample legal question and see the instant, accurate responses.</p>
                    <ul className="demo-features">
                        <li>
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Instant responses to legal queries
                        </li>
                        <li>
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Context-aware legal research
                        </li>
                        <li>
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Citations from Indian laws
                        </li>
                    </ul>
                </div>
                <div className="demo-box">
                    <div className="demo-header">
                        <div className="demo-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span className="demo-title">AI Legal Assistant</span>
                    </div>
                    <div className="demo-chat">
                        <div className="demo-message user-message">
                            <p>What are the grounds for divorce under Hindu Marriage Act?</p>
                        </div>
                        <div className="demo-message ai-message">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <p>Under the Hindu Marriage Act, 1955, Section 13 provides grounds for divorce including adultery, cruelty, desertion for 2+ years, conversion to another religion, mental disorder, and more...</p>
                        </div>
                    </div>
                    <div className="demo-input">
                        <input type="text" placeholder="Try asking a legal question..." disabled />
                        <button className="demo-send-btn" disabled>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className="demo-cta">
                <a href="get-started.html" className="btn-primary">Start Your Free Trial</a>
            </div>
        </div>
    </section>

    {/* <!-- Newsletter Section --> */}
    <section className="newsletter">
        <div className="container">
            <div className="newsletter-content">
                <div className="newsletter-text">
                    <h2>Stay Updated with Legal Tech Insights</h2>
                    <p>Get the latest updates on AI in legal practice, new features, and exclusive offers</p>
                </div>
                <div className="newsletter-form">
                    <form className="subscribe-form">
                        <input type="email" placeholder="Enter your email address" required />
                        <button type="submit" className="btn-primary">Subscribe</button>
                    </form>
                    <p className="newsletter-privacy">We respect your privacy. Unsubscribe anytime.</p>
                </div>
            </div>
        </div>
    </section>

    {/* <!-- Contact Section --> */}
    <section className="contact">
        <div className="container">
            <div className="contact-content">
                <div className="contact-info">
                    <h2>Get in Touch</h2>
                    <p>Ready to transform your legal practice? Contact us today for a personalized demonstration.</p>
                    <div className="contact-details">
                        <div className="contact-item">
                            <i className="fas fa-envelope"></i>
                            <span>hello@advotac.com</span>
                        </div>
                        <div className="contact-item">
                            <i className="fas fa-phone"></i>
                            <span>+91 98765 43210</span>
                        </div>
                        <div className="contact-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>Delhi, India</span>
                        </div>
                    </div>
                </div>
                <div className="contact-form">
                    <form>
                        <div className="form-group">
                            <input type="text" placeholder="Full Name" required />
                        </div>
                        <div className="form-group">
                            <input type="email" placeholder="Email Address" required />
                        </div>
                        <div className="form-group">
                            <input type="tel" placeholder="Phone Number" required />
                        </div>
                        <div className="form-group">
                            <select required>
                                <option value="">Select Your Role</option>
                                <option value="student">Law Student</option>
                                <option value="advocate">Lawyer/Advocate</option>
                                <option value="firm">Law Firm</option>
                                <option value="corporate">Corporate Legal</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <textarea placeholder="Message (Optional)" rows={4}></textarea>
                        </div>
                        <button type="submit" className="btn-primary">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    </section>
    </div>
  );
}

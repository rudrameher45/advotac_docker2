'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import './auth.css';

type TabType = 'signin' | 'signup';
type RoleType = 'Student' | 'Advocate' | 'In-house' | '';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [role, setRole] = useState<RoleType>('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [rotatingTextIndex, setRotatingTextIndex] = useState(0);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rotatingTexts = useMemo(() => ['Research faster', 'Draft smarter', 'Cite accurately', 'Win cases'], []);

  // Check if user is already authenticated - redirect to dashboard
  useEffect(() => {
    console.log('🔄 [AUTH] Auth page component mounted');
    console.log('🔄 [AUTH] Current URL:', window.location.href);
    console.log('🔍 [AUTH] Checking for existing authentication...');
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    console.log('🔍 [AUTH] localStorage check:', {
      hasToken: !!token,
      hasUserData: !!userData
    });
    
    if (token) {
      console.log('✅ [AUTH] User already authenticated, token found:', token.substring(0, 20) + '...');
      console.log('🚀 [AUTH] Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } else {
      console.log('ℹ️ [AUTH] No existing authentication found, showing login page');
    }
  }, []);

  // Deep linking support
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'signin' || hash === 'signup') {
      setActiveTab(hash);
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash === 'signin' || newHash === 'signup') {
        setActiveTab(newHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Rotating text effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Password strength calculator
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (activeTab === 'signup') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const getPasswordStrengthText = () => {
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[passwordStrength] || 'Very weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['bg-gray-300', 'bg-red-500', 'bg-amber-500', 'bg-green-400', 'bg-green-500'];
    return colors[passwordStrength] || 'bg-gray-300';
  };

  const handleTabChange = (tab: TabType) => {
    // Update state immediately for responsive UI
    setActiveTab(tab);
    // Also update hash for deep linking
    if (window.location.hash !== `#${tab}`) {
      window.location.hash = tab;
    }
    setErrors({});
    trackEvent('tab_change', { tab });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email like name@example.com';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (activeTab === 'signup' && password.length < 8) {
      newErrors.password = 'Use at least 8 characters with a number and symbol';
    }

    if (activeTab === 'signup') {
      if (!name) newErrors.name = 'Full name is required';
      if (!phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhone(phone)) {
        newErrors.phone = 'Enter a valid 10-digit Indian phone number';
      }
      if (!state) newErrors.state = 'State is required';
      if (!role) newErrors.role = 'Please select your role';
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowOTP(true);
      setOtpTimer(30);
      setToast({ type: 'info', message: 'OTP sent to your email' });
      trackEvent(activeTab === 'signin' ? 'signin_submit' : 'signup_submit', { email, role });
    }, 1500);
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleResendOTP = () => {
    if (otpTimer > 0) return;
    setOtpTimer(30);
    setToast({ type: 'success', message: 'New OTP sent' });
    trackEvent('otp_resend');
  };

  const handleOAuthClick = async (provider: string) => {
    console.log('🔐 [AUTH] OAuth button clicked, provider:', provider);
    trackEvent('oauth_click', { provider });
    setToast({ type: 'info', message: `Connecting to ${provider}...` });
    
    try {
      // Redirect to FastAPI Google OAuth endpoint (localhost)
      const fastApiUrl = 'https://api.advotac.com/';
      const callbackUrl = encodeURIComponent('https://advotac.com//auth/callback');
      const redirectUrl = `${fastApiUrl}/auth/google?callback_url=${callbackUrl}`;
      
      console.log('🚀 [AUTH] Redirecting to FastAPI OAuth endpoint...');
      console.log('🚀 [AUTH] FastAPI URL:', fastApiUrl);
      console.log('🚀 [AUTH] Callback URL (encoded):', callbackUrl);
      console.log('🚀 [AUTH] Full redirect URL:', redirectUrl);
      
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('❌ [AUTH] OAuth error:', error);
      console.error('❌ [AUTH] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setToast({ type: 'error', message: 'Failed to connect to Google. Please try again.' });
    }
  };

  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    // Analytics implementation
    console.log('Event:', event, data);
  };

  if (showOTP) {
    return (
      <div className="auth-wrapper">
        <div className="auth-background"></div>
        <div className="auth-layout">
          <div className="auth-content">
            <div className="otp-container">
              <div className="otp-header">
                <h2 className="otp-title">Verify Your Email</h2>
                <p className="otp-subtitle">
                  We&apos;ve sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div className="otp-inputs" onPaste={handleOTPPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="otp-input"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleResendOTP}
                disabled={otpTimer > 0}
                className="otp-resend"
              >
                {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
              </button>

              <div className="otp-security-hint">
                <svg className="otp-security-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Never share OTP. Advotac staff will never ask for it.
              </div>

              <button onClick={() => setShowOTP(false)} className="otp-back">
                ← Back to {activeTab === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
            <button onClick={() => setToast(null)} className="toast-close">×</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-background"></div>
      
      <div className="auth-layout">
        {/* Left Brand Panel */}
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon-large">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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

        {/* Right Auth Card */}
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo-mobile">
                <div className="logo-icon-small">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/advotac_logo.png" alt="Advotac Logo" />
                </div>
                <span className="logo-text-small">Advotac</span>
              </div>
              <h2 className="auth-title">
                {activeTab === 'signin' ? 'Welcome back, Counsel' : 'Create your Advotac account'}
              </h2>
              <p className="auth-subtitle">
                {activeTab === 'signin' 
                  ? 'AI Legal Assistant for India. Research, draft, cite.' 
                  : 'Start free. No card needed.'}
              </p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'signin'}
                className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
                onClick={() => handleTabChange('signin')}
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'signup'}
                className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => handleTabChange('signup')}
              >
                Create account
              </button>
            </div>

            {/* OAuth Buttons */}
            <div className="oauth-section">
              <button
                type="button"
                onClick={() => handleOAuthClick('Google')}
                className="oauth-button"
              >
                <svg className="oauth-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Auth Form - Hidden for now, only Google OAuth visible */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate style={{ display: 'none' }}>
              {activeTab === 'signup' && (
                <>
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Enter your full name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="error-text" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="state" className="form-label">
                      State
                    </label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`form-select ${errors.state ? 'input-error' : ''}`}
                      style={{ color: state ? '#0F172A' : '#94a3b8' }}
                      aria-invalid={!!errors.state}
                      aria-describedby={errors.state ? 'state-error' : undefined}
                      required
                    >
                      <option value="" disabled>Select your state</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
                    </select>
                    {errors.state && (
                      <p id="state-error" className="error-text" role="alert">
                        {errors.state}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`form-input input-with-icon ${errors.email ? 'input-error' : ''}`}
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="error-text" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {activeTab === 'signup' && (
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`form-input input-with-icon ${errors.phone ? 'input-error' : ''}`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                  </div>
                  {errors.phone && (
                    <p id="phone-error" className="error-text" role="alert">
                      {errors.phone}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'signup' && (
                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Role
                    <span className="label-helper">We adapt results to your role</span>
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleType)}
                    className={`form-select ${errors.role ? 'input-error' : ''}`}
                    style={{ color: role ? '#0F172A' : '#94a3b8' }}
                    aria-invalid={!!errors.role}
                    aria-describedby={errors.role ? 'role-error' : undefined}
                    required
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="Student">Student</option>
                    <option value="Advocate">Advocate</option>
                    <option value="In-house">In-house Counsel</option>
                  </select>
                  {errors.role && (
                    <p id="role-error" className="error-text" role="alert">
                      {errors.role}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'signup' && role && (
                <div className="form-group">
                  <label htmlFor="organization" className="form-label">
                    {role === 'Student' ? 'College/University (Optional)' : 'Organization (Optional)'}
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="form-input"
                    placeholder={role === 'Student' ? 'e.g., National Law School' : 'e.g., ABC Law Firm'}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`form-input input-with-icon ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="error-text" role="alert">
                    {errors.password}
                  </p>
                )}
                
                {activeTab === 'signup' && password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      ></div>
                    </div>
                    <p className="strength-text">{getPasswordStrengthText()}</p>
                  </div>
                )}
              </div>

              {activeTab === 'signup' && (
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`form-input input-with-icon ${errors.confirmPassword ? 'input-error' : ''}`}
                      placeholder="Re-enter your password"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="input-toggle"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="error-text" role="alert">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'signin' && (
                <div className="form-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">Remember me</span>
                  </label>
                  
                  <a href="#forgot" className="link-text" onClick={() => trackEvent('forgot_password')}>
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  activeTab === 'signin' ? 'Sign in' : 'Create account'
                )}
              </button>
            </form>

            {/* Trust Strip */}
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

            {/* Footer Links */}
            <div className="auth-footer">
              <a href="/privacy" className="footer-link">Privacy Policy</a>
              <span className="footer-separator">•</span>
              <a href="/terms" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          {toast.message}
          <button onClick={() => setToast(null)} className="toast-close" aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

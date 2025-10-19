'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import './google-auth.css';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔄 Starting Google sign in...');
      
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side - Branding */}
      <div className="auth-left">
        <div className="brand-content">
          <h1 className="brand-title">
            <span className="brand-logo">⚖️</span>
            Advotac
          </h1>
          <p className="brand-subtitle">Your AI-Powered Legal Assistant</p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">🔍</span>
              <span>Research faster</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✍️</span>
              <span>Draft smarter</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📚</span>
              <span>Cite accurately</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🏆</span>
              <span>Win cases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Google Login */}
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-header">
            <h2>Welcome to Advotac</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="google-button"
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="auth-footer">
            <p>
              By continuing, you agree to our{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </p>
          </div>

          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <p className="loading-text">Setting up your account...</p>
                <p className="loading-subtext">This will only take a moment</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

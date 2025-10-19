'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 [CALLBACK] Starting authentication callback handler...');
        console.log('🔄 [CALLBACK] Current URL:', window.location.href);
        
        // Get token from URL parameters
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const userEmail = searchParams.get('email');
        const userName = searchParams.get('name');
        const userImage = searchParams.get('image');

        console.log('📋 [CALLBACK] URL Parameters received:', {
          hasToken: !!token,
          hasError: !!error,
          email: userEmail,
          name: userName,
          hasImage: !!userImage
        });

        if (error) {
          console.error('❌ [CALLBACK] Error from OAuth provider:', error);
          setError(error);
          setTimeout(() => {
            console.log('🔄 [CALLBACK] Redirecting to /auth due to error...');
            router.push('/auth');
          }, 3000);
          return;
        }

        if (!token) {
          console.error('❌ [CALLBACK] No token received from OAuth provider');
          setError('No authentication token received');
          setTimeout(() => {
            console.log('🔄 [CALLBACK] Redirecting to /auth due to missing token...');
            router.push('/auth');
          }, 3000);
          return;
        }

        console.log('✅ [CALLBACK] Token received successfully');
        console.log('💾 [CALLBACK] Preparing to store user data in localStorage...');

        // Store user data and token in localStorage
        const userData = {
          token,
          email: userEmail,
          name: userName,
          image: userImage,
          timestamp: Date.now(),
        };

        console.log('💾 [CALLBACK] Storing authToken in localStorage...');
        localStorage.setItem('authToken', token);
        
        console.log('💾 [CALLBACK] Storing userData in localStorage:', {
          email: userData.email,
          name: userData.name,
          hasImage: !!userData.image,
          timestamp: userData.timestamp
        });
        localStorage.setItem('userData', JSON.stringify(userData));

        // Verify storage
        const storedToken = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');
        console.log('✅ [CALLBACK] Verification - Token stored:', !!storedToken);
        console.log('✅ [CALLBACK] Verification - UserData stored:', !!storedUserData);

        // Use window.location for full page reload to ensure localStorage is persisted
        // This prevents race conditions with client-side routing
        console.log('🚀 [CALLBACK] Authentication successful, redirecting to dashboard...');
        console.log('🚀 [CALLBACK] Using window.location.href for full page reload');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100); // Small delay to ensure localStorage is written
      } catch (err) {
        console.error('❌ [CALLBACK] Exception caught in callback handler:', err);
        console.error('❌ [CALLBACK] Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError('Failed to process authentication');
        setTimeout(() => {
          console.log('🔄 [CALLBACK] Redirecting to /auth due to exception...');
          router.push('/auth');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
      {error ? (
        <>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h1 style={{ fontSize: '24px', marginTop: '20px', marginBottom: '10px' }}>
            Authentication Failed
          </h1>
          <p style={{ opacity: 0.9, textAlign: 'center', maxWidth: '400px' }}>
            {error}
          </p>
          <p style={{ marginTop: '10px', opacity: 0.7 }}>
            Redirecting back to sign in...
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style dangerouslySetInnerHTML={{
            __html: '@keyframes spin { to { transform: rotate(360deg); } }'
          }} />
          <h1 style={{ fontSize: '24px', marginTop: '20px', marginBottom: '10px' }}>
            Completing Sign In
          </h1>
          <p style={{ opacity: 0.9 }}>
            Please wait while we set up your account...
          </p>
        </>
      )}
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style dangerouslySetInnerHTML={{
          __html: '@keyframes spin { to { transform: rotate(360deg); } }'
        }} />
        <h1 style={{ fontSize: '24px', marginTop: '20px' }}>Loading...</h1>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

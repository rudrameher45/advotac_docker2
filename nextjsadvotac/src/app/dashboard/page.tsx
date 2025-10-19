'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './dashboard.css';

interface UserData {
  id: string; // Google's user ID (used as primary key in database)
  name: string;
  email: string;
  image?: string;
}

interface UserInfo {
  id?: number;
  user_id: string; // Received from backend responses, NOT sent in create requests
  full_name?: string;
  profile_pic?: string;
  email?: string;
  state?: string;
  iam_a?: string;
  user_status?: string;
  created_at?: string;
}

interface CreditBalanceResponse {
  credits: number;
  last_update_time: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const USER_ROLES = [
  { value: 'advocate', label: 'Advocate' },
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'intern', label: 'Intern' },
  { value: 'organisation', label: 'Organisation' }
];

const FASTAPI_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ?? 'https://api.advotac.com';

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);

  // Profile setup form state
  const [selectedState, setSelectedState] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    console.log('🔄 [DASHBOARD] Checking authentication...');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const token = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (!token) {
      console.error('❌ [DASHBOARD] No token found');
      window.location.replace('/auth');
      return;
    }

    setAuthToken(token);

    try {
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setUserData({
          id: parsed.id || parsed.email, // Use Google ID if available, fallback to email for backward compatibility
          name: parsed.name,
          email: parsed.email,
          image: parsed.image
        });
      }

      // Check if user has completed profile setup
      console.log('📡 [DASHBOARD] Checking user profile...');
  const response = await fetch(`${FASTAPI_BASE_URL}/user-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const info = await response.json();
        console.log('✅ [DASHBOARD] User profile found:', info);
        setUserInfo(info);
        setShowProfileSetup(false);
      } else if (response.status === 404) {
        console.log('ℹ️ [DASHBOARD] No profile found, showing setup form');
        setShowProfileSetup(true);
      } else if (response.status === 401 || response.status === 403) {
        console.error('❌ [DASHBOARD] Unauthorized');
        localStorage.clear();
        window.location.replace('/auth');
        return;
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadCreditBalance = async (token: string, userId: string, userEmail?: string) => {
    setCreditLoading(true);
    setCreditError(null);
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append('user_id', userId);
      }
      if (userEmail) {
        params.append('user_email', userEmail);
      }

      const response = await fetch(`${FASTAPI_BASE_URL}/api/assistant/credits?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        setCreditBalance(0);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load credits (status ${response.status})`);
      }

      const data: CreditBalanceResponse = await response.json();
      setCreditBalance(data.credits);
    } catch (err) {
      console.error('❌ [DASHBOARD] Failed to fetch credit balance:', err);
      setCreditError('Failed to load credits');
      setCreditBalance(null);
    } finally {
      setCreditLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken || !userData?.id) {
      return;
    }

    const fetchCredits = async () => {
      await loadCreditBalance(authToken, userData.id, userData.email);
    };

    void fetchCredits();
  }, [authToken, userData?.id, userData?.email]);

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedState || !selectedRole) {
      setError('Please select both state and role');
      return;
    }

    setSetupLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        localStorage.clear();
        window.location.replace('/auth');
        return;
      }

      // No need to check userData.id - the backend uses the authenticated user's ID from the JWT token
      
      const profileData = {
        // user_id is NOT sent - backend automatically uses the authenticated user's ID from JWT token
        state: selectedState,
        iam_a: selectedRole,
        full_name: userData?.name,
        profile_pic: userData?.image,
        email: userData?.email,
        user_status: 'active' // Default status is 'active' for all new users
      };

      console.log('📤 [DASHBOARD] Submitting profile setup:', profileData);
      console.log('🔑 [DASHBOARD] Token exists:', !!token);

  const response = await fetch(`${FASTAPI_BASE_URL}/user-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      console.log('📡 [DASHBOARD] Response status:', response.status);

      if (response.ok) {
        const info = await response.json();
        console.log('✅ [DASHBOARD] Profile created successfully:', info);
        setUserInfo(info);
        setShowProfileSetup(false);
      } else {
        const errorText = await response.text();
        console.error('❌ [DASHBOARD] Response error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Failed to create profile');
        } catch (parseError) {
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error creating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`); // Show alert for immediate feedback
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSignOut = () => {
    console.log('🚪 [DASHBOARD] Signing out...');
    localStorage.clear();
    window.location.replace('/auth');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <div className="dashboard-wrapper">
        <div className="profile-setup-container">
          <div className="setup-header">
            <h1>Complete Your Profile</h1>
            <p>Tell us a bit more about yourself to get started</p>
          </div>

          {userData && (
            <div className="user-preview">
              {userData.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userData.image} alt={userData.name} className="user-avatar" />
              )}
              <div className="user-details">
                <h3>{userData.name}</h3>
                <p>{userData.email}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSetup} className="setup-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="state">Select Your State *</label>
              <select
                id="state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Choose a state...</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="role">I am a *</label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Choose your role...</option>
                {USER_ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={setupLoading} className="submit-button">
              {setupLoading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Dashboard UI (matching the design)
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/advotac_logo.png" alt="Advotac Logo" className="logo-image" />
            <div>
              <h2>Advotac</h2>
              <p>Legal AI Workspace</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Overview
          </a>

          <a href="/assistant" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
            Assistant
          </a>

          <a href="/research" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            Research
          </a>

          <a href="/drafting" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            Drafting
          </a>

          <a href="/workflow" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            Workflow
          </a>

          <a href="/history" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            History
          </a>
        </nav>

        <div className="sidebar-footer">
          <a href="/settings" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            Settings
          </a>

          <button onClick={handleSignOut} className="nav-item logout-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1>Dashboard</h1>
            <div className="credit-balance-header">
              Credit Balance:&nbsp;
              {creditLoading ? '...' : (creditBalance !== null ? creditBalance : '—')}
              {creditError && (
                <span style={{ marginLeft: '0.5rem', color: '#f87171', fontSize: '0.85rem' }}>
                  (refresh to retry)
                </span>
              )}
            </div>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
              <input type="text" placeholder="Search matters, drafts..." />
            </div>
            <button className="icon-button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            </button>
            <button 
              className="icon-button profile-button" 
              onClick={() => window.location.href = '/settings'}
              title="Go to Settings"
            >
              {userData?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userData.image} alt={userData.name} className="user-avatar-small" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Assistant Card */}
          <div className="feature-card" onClick={() => router.push('/assistant')} style={{ cursor: 'pointer' }}>
            <div className="card-icon assistant">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <circle cx="9" cy="10" r="1" fill="currentColor"/>
                <circle cx="12" cy="10" r="1" fill="currentColor"/>
                <circle cx="15" cy="10" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Assistant</h3>
              <p>Chat, cite, and act with guardrails</p>
            </div>
            <button className="card-menu" onClick={(e) => e.stopPropagation()}>⋯</button>
          </div>

          {/* Research Card */}
          <div className="feature-card" onClick={() => router.push('/research')} style={{ cursor: 'pointer' }}>
            <div className="card-icon research">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <path d="M8 7h8"/>
                <path d="M8 11h8"/>
                <path d="M8 15h6"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Research</h3>
              <p>Statutes, case law, cross refs</p>
            </div>
            <button className="card-menu" onClick={(e) => e.stopPropagation()}>⋯</button>
          </div>

          {/* Drafting Card */}
          <div className="feature-card" onClick={() => router.push('/drafting')} style={{ cursor: 'pointer' }}>
            <div className="card-icon drafting">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Drafting</h3>
              <p>Contracts, petitions, notices</p>
            </div>
            <button className="card-menu" onClick={(e) => e.stopPropagation()}>⋯</button>
          </div>

          {/* Workflow Card */}
          <div className="feature-card" onClick={() => router.push('/workflow')} style={{ cursor: 'pointer' }}>
            <div className="card-icon workflow">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M6.5 10v4M17.5 10v4"/>
              </svg>
            </div>
            <div className="card-content">
              <h3>Workflow</h3>
              <p>Automate intake to filing</p>
            </div>
            <button className="card-menu" onClick={(e) => e.stopPropagation()}>⋯</button>
          </div>
        </div>

      </main>
    </div>
  );
}

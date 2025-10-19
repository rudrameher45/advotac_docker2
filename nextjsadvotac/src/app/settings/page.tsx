'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './settings.css';

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface UserInfo {
  id?: number;
  user_id: string;
  full_name?: string;
  profile_pic?: string;
  email?: string;
  state?: string;
  iam_a?: string;
  user_status?: string;
  created_at?: string;
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

export default function Settings() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    console.log('🔄 [SETTINGS] Loading user profile...');
    
    const token = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (!token) {
      console.error('❌ [SETTINGS] No token found');
      window.location.replace('/auth');
      return;
    }

    try {
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        setUserData({
          id: parsed.id || parsed.email,
          name: parsed.name,
          email: parsed.email,
          image: parsed.image
        });
      }

      // Load user info
      const response = await fetch('http://localhost:8000/user-info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const info = await response.json();
        console.log('✅ [SETTINGS] User profile loaded:', info);
        setUserInfo(info);
        
        // Populate form fields
        setFullName(info.full_name || '');
        setSelectedState(info.state || '');
        setSelectedRole(info.iam_a || '');
      } else if (response.status === 404) {
        console.log('ℹ️ [SETTINGS] No profile found');
        setError('Profile not found. Please complete setup first.');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else if (response.status === 401 || response.status === 403) {
        console.error('❌ [SETTINGS] Unauthorized');
        localStorage.clear();
        window.location.replace('/auth');
        return;
      }
    } catch (error) {
      console.error('❌ [SETTINGS] Error:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !selectedState || !selectedRole) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token || !userInfo?.id) {
        setError('Authentication error. Please login again.');
        return;
      }

      const updateData = {
        full_name: fullName,
        state: selectedState,
        iam_a: selectedRole,
        profile_pic: userData?.image
      };

      console.log('📤 [SETTINGS] Updating profile:', updateData);

      const response = await fetch('http://localhost:8000/user-info', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedInfo = await response.json();
        console.log('✅ [SETTINGS] Profile updated successfully');
        setUserInfo(updatedInfo);
        setSuccess('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorText = await response.text();
        console.error('❌ [SETTINGS] Update failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Failed to update profile');
        } catch (parseError) {
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ [SETTINGS] Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    console.log('🚪 [SETTINGS] Signing out...');
    localStorage.clear();
    window.location.replace('/auth');
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
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
          <a href="/dashboard" className="nav-item">
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
          <a href="/settings" className="nav-item active">
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
      <main className="settings-content">
        <header className="settings-header">
          <div className="header-title">
            <h1>Profile Settings</h1>
            <p>Manage your account information and preferences</p>
          </div>
          <div className="header-actions">
            <button className="icon-button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            </button>
            <button 
              className="icon-button profile-button" 
              onClick={() => router.push('/settings')}
              title="Profile Settings"
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

        <div className="settings-card">
          {/* User Avatar Section */}
          <div className="profile-avatar-section">
            {userData?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userData.image} alt={userData.name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
            <div className="avatar-info">
              <h3>{userData?.name}</h3>
              <p className="email-readonly">{userData?.email}</p>
              <span className="status-badge">{userInfo?.user_status}</span>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSaveProfile} className="edit-form">
            {error && (
              <div className="alert alert-error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {success}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={userData?.email || ''}
                  disabled
                  className="form-input disabled"
                  title="Email cannot be changed"
                />
                <span className="field-hint">Email cannot be changed</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Select your state...</option>
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
                  <option value="">Select your role...</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Account Status</label>
              <input
                type="text"
                id="status"
                value={userInfo?.user_status || 'active'}
                disabled
                className="form-input disabled"
                title="Status is managed by administrators"
              />
              <span className="field-hint">Status is managed by administrators</span>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="info-section">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">User ID</span>
              <span className="info-value">{userInfo?.user_id?.substring(0, 20)}...</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

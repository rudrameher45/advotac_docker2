'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './dashboard.css';

interface UserData {
  name: string;
  email: string;
  image?: string;
  plan_type?: string;
  plan_name?: string;
  credits_remaining?: number;
  credits_total?: number;
  subscription_status?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      // Check if user is authenticated via FastAPI token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user data from FastAPI backend
        const response = await fetch('http://localhost:8000/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Token is invalid or expired, redirect to auth
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            router.push('/auth');
            return;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();
        
        setUserData({
          name: data.name || data.full_name || 'User',
          email: data.email || '',
          image: data.image || data.profile_picture || data.picture,
          plan_name: data.plan_name || data.plan || 'Free Plan',
          credits_remaining: data.credits_remaining || data.credits || 50,
          credits_total: data.credits_total || data.total_credits || 50,
          subscription_status: data.subscription_status || data.status || 'active',
        });
        
        // Update localStorage with fresh data
        const updatedUserData = {
          name: data.name || data.full_name,
          email: data.email,
          image: data.image || data.profile_picture || data.picture,
          timestamp: Date.now(),
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data. Please try refreshing the page.');
        
        // Fall back to localStorage data if API fails
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData({
              name: parsedData.name || 'User',
              email: parsedData.email || '',
              image: parsedData.image,
              plan_name: 'Free Plan',
              credits_remaining: 50,
              credits_total: 50,
              subscription_status: 'active',
            });
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            router.push('/auth');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleSignOut = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1>Welcome to Dashboard</h1>
        
        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
          }}>
            {error}
          </div>
        )}
        
        <div className="user-info">
          {userData?.image && (
            <img 
              src={userData.image} 
              alt={userData.name || 'User'} 
              className="user-avatar"
            />
          )}
          
          <div className="user-details">
            <h2>{userData?.name}</h2>
            <p className="user-email">{userData?.email}</p>
          </div>
        </div>

        {/* Subscription & Credits Section */}
        <div className="subscription-info">
          <h3>Subscription & Credits</h3>
          <div className="subscription-grid">
            <div className="subscription-item">
              <span className="sub-label">Plan:</span>
              <span className="sub-value plan-badge">
                {userData?.plan_name || 'Free Plan'}
              </span>
            </div>
            <div className="subscription-item">
              <span className="sub-label">Status:</span>
              <span className={`sub-value status-badge ${userData?.subscription_status || 'active'}`}>
                {userData?.subscription_status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <div className="subscription-item">
              <span className="sub-label">Credits:</span>
              <span className="sub-value credits-count">
                {userData?.credits_remaining || 0} / {userData?.credits_total || 50}
              </span>
            </div>
          </div>
          
          <div className="credits-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${((userData?.credits_remaining || 0) / (userData?.credits_total || 50)) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="user-data">
          <h3>User Information:</h3>
          <div className="data-grid">
            <div className="data-item">
              <span className="data-label">Name:</span>
              <span className="data-value">{userData?.name || 'N/A'}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Email:</span>
              <span className="data-value">{userData?.email || 'N/A'}</span>
            </div>
            <div className="data-item">
              <span className="data-label">User ID:</span>
              <span className="data-value">{'N/A'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSignOut} 
          className="signout-button"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ==================================================
// READY-TO-USE REACT COMPONENTS FOR YOUR FRONTEND
// Copy and paste these into your React app
// ==================================================

// ==================================================
// 1. API Configuration
// ==================================================
// File: src/config/api.js
export const API_CONFIG = {
  BASE_URL: 'https://fastapi-eight-zeta.vercel.app',
  ENDPOINTS: {
    HEALTH: '/health',
    AUTH_GOOGLE: '/auth/google',
    ME: '/me',
    USERS: '/users',
    AUTH_LOGS: '/auth-logs',
  },
  TOKEN_KEY: 'authToken',
  USER_KEY: 'user'
};

// ==================================================
// 2. API Service Helper
// ==================================================
// File: src/services/api.js
import { API_CONFIG } from '../config/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const apiService = {
  // Check API health
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ME}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get all users failed:', error);
      throw error;
    }
  },

  // Get authentication logs
  getAuthLogs: async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_LOGS}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch auth logs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get auth logs failed:', error);
      throw error;
    }
  }
};

// ==================================================
// 3. Auth Context Provider
// ==================================================
// File: src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    
    if (token) {
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        logout();
      }
    }
    
    setLoading(false);
  };

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_GOOGLE}`;
  };

  const handleAuthCallback = async (token, userData) => {
    localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.USER_KEY);
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    handleAuthCallback,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==================================================
// 4. Login Page Component
// ==================================================
// File: src/pages/Login.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-lg mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h1 className="text-3xl font-semibold mb-2">Welcome to Advotac Legal</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-black font-medium hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-black font-medium hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

// ==================================================
// 5. Dashboard Component
// ==================================================
// File: src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-xl">⚖️</span>
              </div>
              <span className="text-xl font-semibold">Advotac Legal</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Users</div>
            <div className="text-3xl font-semibold">{users.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Your Account</div>
            <div className="text-3xl font-semibold">Active</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Last Login</div>
            <div className="text-sm font-medium">
              {new Date(user?.last_login).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                            {u.name[0]}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {u.verified_email ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(u.last_login).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

// ==================================================
// 6. Protected Route Component
// ==================================================
// File: src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

// ==================================================
// 7. Main App Router
// ==================================================
// File: src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

// ==================================================
// 8. Installation Instructions
// ==================================================

/*
INSTALLATION STEPS:

1. Install required dependencies:
   npm install react-router-dom

2. Create the file structure:
   src/
   ├── config/
   │   └── api.js
   ├── services/
   │   └── api.js
   ├── context/
   │   └── AuthContext.jsx
   ├── pages/
   │   ├── Login.jsx
   │   └── Dashboard.jsx
   ├── components/
   │   └── ProtectedRoute.jsx
   └── App.jsx

3. Copy the code from each section above into the corresponding files

4. Update your index.js:
   import App from './App';
   import './index.css'; // Make sure Tailwind CSS is set up

5. Run your app:
   npm start

6. Test the authentication flow:
   - Visit http://localhost:3000
   - Click "Continue with Google"
   - Sign in with Google
   - Get redirected back to dashboard

DONE! Your frontend is now integrated with the FastAPI backend.
*/

// ==================================================
// 9. Tailwind CSS Configuration (Optional)
// ==================================================

/*
If you haven't set up Tailwind CSS yet:

1. Install Tailwind:
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p

2. Update tailwind.config.js:
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }

3. Add to src/index.css:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
*/

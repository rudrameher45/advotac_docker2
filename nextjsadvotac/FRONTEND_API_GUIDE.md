# 📚 FastAPI OAuth - Complete API Documentation for Frontend

## 🔗 Base URLs

### **Production API**
```
https://fastapi-eight-zeta.vercel.app
```

### **Frontend App (Allowed)**
```
https://advotac02.vercel.app
```

---

## 🔐 Authentication Flow

### **Overview**
This API uses Google OAuth 2.0 for authentication and JWT tokens for authorization.

### **Flow Diagram**
```
Frontend → /auth/google → Google Login → /auth/google/callback → JWT Token → Frontend
```

---

## 📋 API Endpoints

### **1. Health Check**
Check if the API and database are operational.

**Endpoint:** `GET /health`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/health
```

**Auth Required:** No

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "connection_time_ms": 599.09,
  "timestamp": "2025-10-11T12:00:00",
  "environment": "vercel"
}
```

**Frontend Usage:**
```javascript
// Check API health
const checkHealth = async () => {
  const response = await fetch('https://fastapi-eight-zeta.vercel.app/health');
  const data = await response.json();
  console.log('API Status:', data.status);
};
```

---

### **2. Initiate Google OAuth Login**
Start the OAuth flow by redirecting user to Google sign-in.

**Endpoint:** `GET /auth/google`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/auth/google
```

**Auth Required:** No

**Response:** Redirects to Google OAuth page

**Frontend Usage:**

#### **Option A: Full Page Redirect**
```javascript
// Redirect entire page to Google login
const loginWithGoogle = () => {
  window.location.href = 'https://fastapi-eight-zeta.vercel.app/auth/google';
};
```

#### **Option B: Popup Window**
```javascript
// Open Google login in popup
const loginWithGooglePopup = () => {
  const width = 500;
  const height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  
  const popup = window.open(
    'https://fastapi-eight-zeta.vercel.app/auth/google',
    'Google Login',
    `width=${width},height=${height},left=${left},top=${top}`
  );
  
  // Listen for token from popup
  window.addEventListener('message', (event) => {
    if (event.origin === 'https://fastapi-eight-zeta.vercel.app') {
      const { token, user } = event.data;
      console.log('Received token:', token);
      console.log('User:', user);
      
      // Store token
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Close popup
      popup.close();
      
      // Redirect or update UI
      window.location.href = '/dashboard';
    }
  });
};
```

---

### **3. OAuth Callback**
This endpoint handles the callback from Google after user authentication.

**Endpoint:** `GET /auth/google/callback`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/auth/google/callback
```

**Auth Required:** No (but requires OAuth code from Google)

**Query Parameters:**
- `code` (required): Authorization code from Google
- `state` (optional): State parameter for CSRF protection

**Response:** HTML page with user info and JWT token

**Frontend Usage:**
You don't call this endpoint directly. Google redirects here automatically.
The success page will `postMessage` the token to your frontend if opened as popup.

---

### **4. Get Current User**
Retrieve information about the currently authenticated user.

**Endpoint:** `GET /me`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/me
```

**Auth Required:** Yes (JWT Token)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": "google_user_id_123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "verified_email": true,
  "created_at": "2025-10-11T10:00:00",
  "last_login": "2025-10-11T12:00:00"
}
```

**Frontend Usage:**
```javascript
// Get current user info
const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('https://fastapi-eight-zeta.vercel.app/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const user = await response.json();
    console.log('Current user:', user);
    return user;
  } else {
    console.error('Not authenticated');
    // Redirect to login
    window.location.href = '/login';
  }
};
```

---

### **5. Get All Users**
Retrieve a list of all registered users (protected endpoint).

**Endpoint:** `GET /users`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/users
```

**Auth Required:** Yes (JWT Token)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "users": [
    {
      "id": "google_user_id_123",
      "email": "user1@example.com",
      "name": "User One",
      "picture": "https://lh3.googleusercontent.com/...",
      "verified_email": true,
      "created_at": "2025-10-11T10:00:00",
      "last_login": "2025-10-11T12:00:00"
    },
    {
      "id": "google_user_id_456",
      "email": "user2@example.com",
      "name": "User Two",
      "picture": "https://lh3.googleusercontent.com/...",
      "verified_email": true,
      "created_at": "2025-10-10T08:00:00",
      "last_login": "2025-10-11T11:00:00"
    }
  ],
  "current_user": "user1@example.com",
  "total_users": 2
}
```

**Frontend Usage:**
```javascript
// Get all users
const getAllUsers = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('https://fastapi-eight-zeta.vercel.app/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('Total users:', data.total_users);
  console.log('Users:', data.users);
  return data;
};
```

---

### **6. Get Authentication Logs**
Retrieve authentication event logs (protected endpoint).

**Endpoint:** `GET /auth-logs`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/auth-logs
```

**Auth Required:** Yes (JWT Token)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "user_id": "google_user_id_123",
      "email": "user@example.com",
      "action": "login",
      "status": "success",
      "ip_address": "203.0.113.1",
      "user_agent": "Mozilla/5.0...",
      "error_message": null,
      "timestamp": "2025-10-11T12:00:00"
    }
  ],
  "current_user": "user@example.com",
  "total_logs": 1
}
```

**Frontend Usage:**
```javascript
// Get authentication logs
const getAuthLogs = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('https://fastapi-eight-zeta.vercel.app/auth-logs', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('Auth logs:', data.logs);
  return data;
};
```

---

### **7. API Documentation (Interactive)**
Interactive Swagger UI documentation.

**Endpoint:** `GET /docs`

**URL:** 
```
https://fastapi-eight-zeta.vercel.app/docs
```

**Auth Required:** No

**Description:** Browser-based interactive API documentation where you can test endpoints.

---

## 🔑 JWT Token

### **Token Format**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNjk3MDM2NDAwfQ.signature
```

### **Token Expiry**
- **Duration:** 30 minutes
- **Included in:** Response after successful OAuth

### **Token Storage**
```javascript
// Store token securely
localStorage.setItem('authToken', token);

// Retrieve token
const token = localStorage.getItem('authToken');

// Remove token (logout)
localStorage.removeItem('authToken');
```

### **Token Usage**
```javascript
// Include in all authenticated requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 🚀 Frontend Integration Examples

### **React.js Example**

#### **1. Login Component**
```jsx
import React from 'react';

const Login = () => {
  const handleLogin = () => {
    window.location.href = 'https://fastapi-eight-zeta.vercel.app/auth/google';
  };

  return (
    <div className="login-container">
      <h1>Welcome to Advotac Legal</h1>
      <button onClick={handleLogin}>
        Continue with Google
      </button>
    </div>
  );
};

export default Login;
```

#### **2. Auth Context**
```jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken) => {
    try {
      const response = await fetch('https://fastapi-eight-zeta.vercel.app/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (authToken, userData) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### **3. Protected Route**
```jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
```

#### **4. API Service**
```javascript
// api.js
const API_BASE_URL = 'https://fastapi-eight-zeta.vercel.app';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const api = {
  // Health check
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  // Get all users
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Get auth logs
  getAuthLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/auth-logs`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
```

---

### **Next.js Example**

#### **1. Login Page**
```jsx
// pages/login.jsx
export default function Login() {
  const handleLogin = () => {
    window.location.href = 'https://fastapi-eight-zeta.vercel.app/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-3xl font-bold text-center">
          Welcome to Advotac Legal
        </h2>
        <button
          onClick={handleLogin}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
```

#### **2. API Route Handler**
```javascript
// pages/api/auth/callback.js
export default async function handler(req, res) {
  const { token, user } = req.body;
  
  // Set HTTP-only cookie
  res.setHeader('Set-Cookie', `authToken=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800`);
  
  res.status(200).json({ success: true, user });
}
```

#### **3. Middleware**
```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('authToken');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

---

### **Vue.js Example**

#### **1. Login Component**
```vue
<template>
  <div class="login-container">
    <h1>Welcome to Advotac Legal</h1>
    <button @click="handleLogin" class="google-btn">
      Continue with Google
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    handleLogin() {
      window.location.href = 'https://fastapi-eight-zeta.vercel.app/auth/google';
    }
  }
};
</script>
```

#### **2. Vuex Store**
```javascript
// store/auth.js
export default {
  state: {
    user: null,
    token: null,
    isAuthenticated: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = true;
    },
    SET_TOKEN(state, token) {
      state.token = token;
    },
    LOGOUT(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  },
  actions: {
    async fetchUser({ commit, state }) {
      const response = await fetch('https://fastapi-eight-zeta.vercel.app/me', {
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });
      
      if (response.ok) {
        const user = await response.json();
        commit('SET_USER', user);
      }
    },
    login({ commit }, { token, user }) {
      localStorage.setItem('authToken', token);
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
    },
    logout({ commit }) {
      localStorage.removeItem('authToken');
      commit('LOGOUT');
    }
  }
};
```

---

## 🔄 Complete Authentication Flow Code

### **Full Implementation (React)**
```jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const API_URL = 'https://fastapi-eight-zeta.vercel.app';

// Login Page
function LoginPage() {
  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="login-page">
      <h1>Welcome to Advotac Legal</h1>
      <button onClick={handleLogin}>Continue with Google</button>
    </div>
  );
}

// Dashboard Page
function DashboardPage({ user }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.users);
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user.name}!</h1>
      <h2>All Users ({users.length})</h2>
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.name} - {u.email}</li>
        ))}
      </ul>
    </div>
  );
}

// Main App
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }

    // Listen for OAuth callback
    window.addEventListener('message', handleOAuthCallback);
    return () => window.removeEventListener('message', handleOAuthCallback);
  }, []);

  const handleOAuthCallback = (event) => {
    if (event.origin === API_URL) {
      const { token, user } = event.data;
      localStorage.setItem('authToken', token);
      setUser(user);
    }
  };

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🛡️ Error Handling

### **HTTP Status Codes**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (invalid or expired token)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (database down)

### **Error Response Format**
```json
{
  "detail": "Error message here"
}
```

### **Frontend Error Handling**
```javascript
const makeAuthenticatedRequest = async (endpoint) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## 📊 Rate Limiting

Currently no rate limiting is implemented, but best practices:
- Don't make requests more than once per second
- Cache user data when possible
- Use token expiry time (30 minutes)

---

## 🔒 Security Best Practices

### **1. Token Storage**
```javascript
// ✅ Good: Use localStorage for web apps
localStorage.setItem('authToken', token);

// ❌ Avoid: Don't store in cookies without HttpOnly flag
// ❌ Avoid: Don't store in sessionStorage (lost on tab close)
```

### **2. Token Transmission**
```javascript
// ✅ Always use HTTPS
// ✅ Always include in Authorization header
headers: {
  'Authorization': `Bearer ${token}`
}
```

### **3. Token Validation**
```javascript
// Check token expiry on app load
const isTokenExpired = () => {
  const tokenTime = localStorage.getItem('tokenTime');
  if (!tokenTime) return true;
  
  const expiryTime = parseInt(tokenTime) + (30 * 60 * 1000); // 30 minutes
  return Date.now() > expiryTime;
};
```

---

## 📱 CORS Configuration

Your frontend app is already whitelisted:
- ✅ `https://advotac02.vercel.app`
- ✅ `https://*.vercel.app` (all preview deployments)
- ✅ `http://localhost:3000` (local development)
- ✅ `http://localhost:3001` (alternative port)

No additional configuration needed!

---

## 🧪 Testing the API

### **Using cURL**
```bash
# Health check
curl https://fastapi-eight-zeta.vercel.app/health

# Get current user (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://fastapi-eight-zeta.vercel.app/me

# Get all users
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://fastapi-eight-zeta.vercel.app/users
```

### **Using Postman**
1. Import collection from `/docs` (OpenAPI)
2. Set Authorization → Bearer Token
3. Add your JWT token
4. Test all endpoints

---

## 📞 Support

**API Issues:** Check `/health` endpoint first
**Authentication Issues:** Verify token is not expired
**CORS Issues:** Make sure your domain is whitelisted

**API Base URL:** `https://fastapi-eight-zeta.vercel.app`
**Frontend URL:** `https://advotac02.vercel.app`
**Documentation:** `https://fastapi-eight-zeta.vercel.app/docs`

---

## 🎉 Quick Start Checklist

- [ ] Add API URL to your frontend config
- [ ] Implement login button with redirect to `/auth/google`
- [ ] Handle OAuth callback (listen for postMessage or query params)
- [ ] Store JWT token in localStorage
- [ ] Create auth header helper function
- [ ] Implement protected routes
- [ ] Add token expiry check
- [ ] Handle 401 errors (redirect to login)
- [ ] Test with your Vercel frontend

---

**Last Updated:** October 11, 2025
**API Version:** 1.0.0
**Frontend:** https://advotac02.vercel.app
**Backend:** https://fastapi-eight-zeta.vercel.app

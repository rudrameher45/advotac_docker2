# API Documentation - FastAPI Google OAuth System

## Overview
This is a RESTful API for Google OAuth authentication with user management. The API is designed to be consumed by external applications (web, mobile, etc.).

**Base URL (Local):** `http://localhost:8000`  
**Base URL (Production):** `https://your-app.vercel.app`

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [API Endpoints](#api-endpoints)
3. [Response Formats](#response-formats)
4. [Error Handling](#error-handling)
5. [Usage Examples](#usage-examples)

---

## Authentication Flow

### Step 1: Get Google Auth URL
```http
GET /auth/google
```
Redirects user to Google OAuth consent screen.

### Step 2: Google Callback
```http
GET /auth/google/callback?code=GOOGLE_CODE
```
Google redirects back with authorization code. Returns JWT token.

### Step 3: Use JWT Token
Include JWT token in all protected endpoints:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## API Endpoints

### 🔓 Public Endpoints (No Authentication Required)

#### 1. Health Check
**GET** `/health`

Check if API and database are working.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "connection_time_ms": 45.23,
  "timestamp": "2025-10-12T10:30:00.000Z",
  "environment": "local"
}
```

---

#### 2. Start Google OAuth
**GET** `/auth/google`

Redirects to Google login page.

**Query Parameters:** None  
**Response:** HTTP 302 Redirect to Google

---

#### 3. Google OAuth Callback
**GET** `/auth/google/callback`

Google redirects here after authentication.

**Query Parameters:**
- `code` (required): Authorization code from Google
- `state` (optional): State parameter for CSRF protection

**Response:** HTML page with JWT token or JSON (based on Accept header)

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "verified_email": true,
    "created_at": "2025-10-12T10:00:00.000Z",
    "last_login": "2025-10-12T10:30:00.000Z"
  }
}
```

---

### 🔒 Protected Endpoints (Authentication Required)

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

#### 4. Get Current User
**GET** `/me`

Get authenticated user's information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": "1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "verified_email": true,
  "created_at": "2025-10-12T10:00:00.000Z",
  "last_login": "2025-10-12T10:30:00.000Z"
}
```

---

#### 5. Get All Users
**GET** `/users`

Get list of all registered users.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "users": [
    {
      "id": "1234567890",
      "email": "user1@example.com",
      "name": "User One",
      "picture": "https://...",
      "verified_email": true
    },
    {
      "id": "0987654321",
      "email": "user2@example.com",
      "name": "User Two",
      "picture": "https://...",
      "verified_email": true
    }
  ],
  "current_user": "user1@example.com",
  "total_users": 2
}
```

---

#### 6. Create User Info
**POST** `/user-info`

Create additional user profile information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "1234567890",
  "full_name": "John Doe",
  "profile_pic": "https://...",
  "email": "john@example.com",
  "phone": "9876543210",
  "phone_verified": false,
  "state": "Maharashtra",
  "iam_a": "lawyer",
  "user_status": "active"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": "1234567890",
  "full_name": "John Doe",
  "profile_pic": "https://...",
  "email": "john@example.com",
  "phone": "9876543210",
  "phone_verified": false,
  "state": "Maharashtra",
  "iam_a": "lawyer",
  "user_status": "active",
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:00:00.000Z"
}
```

---

#### 7. Get Current User Info
**GET** `/user-info`

Get additional profile information for authenticated user.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": 1,
  "user_id": "1234567890",
  "full_name": "John Doe",
  "profile_pic": "https://...",
  "email": "john@example.com",
  "phone": "9876543210",
  "phone_verified": false,
  "state": "Maharashtra",
  "iam_a": "lawyer",
  "user_status": "active",
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:00:00.000Z"
}
```

---

#### 8. Get User Info by ID
**GET** `/user-info/{user_id}`

Get user profile information by user ID.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Path Parameters:**
- `user_id` (required): Google user ID

**Response:**
```json
{
  "id": 1,
  "user_id": "1234567890",
  "full_name": "John Doe",
  "profile_pic": "https://...",
  "email": "john@example.com",
  "phone": "9876543210",
  "phone_verified": false,
  "state": "Maharashtra",
  "iam_a": "lawyer",
  "user_status": "active",
  "created_at": "2025-10-12T10:00:00.000Z",
  "updated_at": "2025-10-12T10:00:00.000Z"
}
```

---

#### 9. Update User Info
**PUT** `/user-info`

Update authenticated user's profile information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "full_name": "John Updated Doe",
  "phone": "9876543211",
  "phone_verified": true,
  "state": "Delhi",
  "iam_a": "advocate",
  "user_status": "active"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": "1234567890",
  "full_name": "John Updated Doe",
  "phone": "9876543211",
  "phone_verified": true,
  "state": "Delhi",
  "iam_a": "advocate",
  "user_status": "active",
  "updated_at": "2025-10-12T11:00:00.000Z"
}
```

---

#### 10. Delete User Info
**DELETE** `/user-info`

Delete authenticated user's profile information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "User info deleted successfully"
}
```

---

#### 11. List All User Info
**GET** `/user-info-list`

Get all user profile information (admin endpoint).

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `skip` (optional, default: 0): Number of records to skip
- `limit` (optional, default: 100): Maximum records to return

**Response:**
```json
{
  "user_infos": [
    {
      "id": 1,
      "user_id": "1234567890",
      "full_name": "User One",
      "email": "user1@example.com",
      "state": "Maharashtra",
      "iam_a": "lawyer"
    },
    {
      "id": 2,
      "user_id": "0987654321",
      "full_name": "User Two",
      "email": "user2@example.com",
      "state": "Delhi",
      "iam_a": "student"
    }
  ],
  "total": 2,
  "skip": 0,
  "limit": 100
}
```

---

#### 12. Get Authentication Logs
**GET** `/auth-logs`

Get authentication event logs.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "email": "user@example.com",
      "action": "login",
      "status": "success",
      "ip_address": "192.168.1.1",
      "timestamp": "2025-10-12T10:30:00.000Z"
    },
    {
      "id": 2,
      "email": "user@example.com",
      "action": "logout",
      "status": "success",
      "ip_address": "192.168.1.1",
      "timestamp": "2025-10-12T11:00:00.000Z"
    }
  ],
  "total": 2
}
```

---

#### 13. Logout
**POST** `/logout`

Logout current user (logs the event).

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "User user@example.com logged out successfully"
}
```

---

## Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "detail": "Error message here"
}
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Database unavailable |

### Error Response Examples

**401 Unauthorized:**
```json
{
  "detail": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "detail": "User info not found"
}
```

**400 Bad Request:**
```json
{
  "detail": "Phone number must be exactly 10 digits"
}
```

---

## Usage Examples

### Example 1: Complete Authentication Flow (JavaScript/Fetch)

```javascript
// Step 1: Redirect user to Google OAuth
window.location.href = 'http://localhost:8000/auth/google';

// Step 2: After redirect, extract token from callback URL or popup message
// The token will be in the response

// Step 3: Store token and use it for API calls
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
localStorage.setItem('access_token', token);

// Step 4: Make authenticated API calls
async function getCurrentUser() {
  const response = await fetch('http://localhost:8000/me', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  });
  
  if (response.ok) {
    const user = await response.json();
    console.log('Current user:', user);
  }
}

getCurrentUser();
```

---

### Example 2: Create User Profile (Python/Requests)

```python
import requests

# Your JWT token
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create user info
url = "http://localhost:8000/user-info"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
data = {
    "user_id": "1234567890",
    "full_name": "John Doe",
    "phone": "9876543210",
    "state": "Maharashtra",
    "iam_a": "lawyer",
    "user_status": "active"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

---

### Example 3: Update User Profile (cURL)

```bash
curl -X PUT http://localhost:8000/user-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated",
    "phone": "9876543211",
    "state": "Delhi"
  }'
```

---

### Example 4: Get All Users (JavaScript/Axios)

```javascript
import axios from 'axios';

const token = localStorage.getItem('access_token');

async function getAllUsers() {
  try {
    const response = await axios.get('http://localhost:8000/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Total users:', response.data.total_users);
    console.log('Users:', response.data.users);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

getAllUsers();
```

---

### Example 5: Delete User Info (Python)

```python
import requests

token = "your_jwt_token_here"
url = "http://localhost:8000/user-info"
headers = {"Authorization": f"Bearer {token}"}

response = requests.delete(url, headers=headers)
if response.status_code == 200:
    print("User info deleted:", response.json())
```

---

## Data Models

### User Role Enum
```
student, lawyer, advocate, intern, organisation
```

### Indian State Enum
```
Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, 
Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, 
Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, 
Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, 
Uttar Pradesh, Uttarakhand, West Bengal, Andaman and Nicobar Islands, 
Chandigarh, Dadra and Nagar Haveli and Daman and Diu, Delhi, 
Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry
```

### User Status Enum
```
active, inactive, suspended, pending
```

---

## Rate Limiting
Currently no rate limiting is implemented. Consider adding rate limiting for production.

---

## Security Notes

1. **Always use HTTPS in production**
2. **Store JWT tokens securely** (httpOnly cookies recommended for web apps)
3. **Never expose SECRET_KEY** or Google OAuth credentials
4. **Implement token refresh mechanism** for long-lived sessions
5. **Validate all user inputs** on both client and server
6. **Use CORS properly** - only allow trusted origins

---

## Environment Variables Required

```env
# Database
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGHOST=your_db_host
PGPORT=5432
PGDATABASE=your_db_name

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

---

## Support

For issues or questions:
- GitHub Issues: [Your Repository]
- Email: support@advotaclegal.com

---

**Last Updated:** October 12, 2025  
**API Version:** 1.0.0

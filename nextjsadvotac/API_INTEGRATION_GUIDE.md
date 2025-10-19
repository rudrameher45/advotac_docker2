# FastAPI User Profile Integration Guide

## Overview
The dashboard at **https://advotac02.vercel.app/dashboard** now fetches user data from the FastAPI backend at **https://fastapi-eight-zeta.vercel.app**.

## API Endpoint Required

### FastAPI Endpoint: `/api/user/profile`

**Method:** `GET`  
**URL:** `https://fastapi-eight-zeta.vercel.app/api/user/profile`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "image": "https://lh3.googleusercontent.com/...",
  "plan_name": "Pro Plan",
  "credits_remaining": 850,
  "credits_total": 1000,
  "subscription_status": "active"
}
```

**Alternative Field Names Supported:**
The frontend is flexible and supports multiple field name variations:
- `name` OR `full_name`
- `image` OR `profile_picture` OR `picture`
- `plan_name` OR `plan`
- `credits_remaining` OR `credits`
- `credits_total` OR `total_credits`
- `subscription_status` OR `status`

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token (redirects to /auth)
- `403 Forbidden` - Token lacks permissions (redirects to /auth)
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

## Frontend Implementation

### Dashboard Flow

1. **Page Load**
   - Checks for `authToken` in localStorage
   - If no token → redirects to `/auth`

2. **API Call**
   - Sends GET request to FastAPI with Bearer token
   - URL: `https://fastapi-eight-zeta.vercel.app/api/user/profile`
   - Headers include Authorization token

3. **Success Response**
   - Displays user data (name, email, image)
   - Shows subscription info (plan, credits, status)
   - Updates localStorage with fresh data

4. **Error Handling**
   - 401/403 → Clears localStorage and redirects to `/auth`
   - Other errors → Shows error message, falls back to localStorage data
   - Network errors → Uses cached localStorage data

### Data Flow Diagram

```
┌─────────────────┐
│   Dashboard     │
│     Page        │
└────────┬────────┘
         │
         ├─ Check localStorage.authToken
         │
         ├─ Token exists?
         │  ├─ NO → Redirect to /auth
         │  └─ YES → Continue
         │
         ├─ Fetch from API
         │  URL: /api/user/profile
         │  Headers: Bearer {token}
         │
         ├─ Response 200?
         │  ├─ YES → Display data & update localStorage
         │  └─ NO → Check status
         │     ├─ 401/403 → Clear auth & redirect
         │     └─ Other → Show error & use cached data
         │
         └─ Display Dashboard
```

## FastAPI Backend Requirements

### 1. User Profile Endpoint

Create this endpoint in your FastAPI backend:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

router = APIRouter()
security = HTTPBearer()

@router.get("/api/user/profile")
async def get_user_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get authenticated user's profile information
    """
    try:
        # Extract token from Authorization header
        token = credentials.credentials
        
        # Verify and decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_email = payload.get("email")
        
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Fetch user from database
        user = get_user_by_email(user_email)  # Your DB query
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return user profile data
        return {
            "name": user.name,
            "email": user.email,
            "image": user.profile_picture,
            "plan_name": user.subscription_plan or "Free Plan",
            "credits_remaining": user.credits_remaining or 50,
            "credits_total": user.credits_total or 50,
            "subscription_status": user.subscription_status or "active"
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
```

### 2. CORS Configuration

Ensure your FastAPI app allows requests from the Next.js frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://advotac02.vercel.app",
        "https://advotac02-*.vercel.app",  # For preview deployments
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. JWT Token Requirements

The token passed from frontend should contain:
- User's email (required)
- User's name (optional, for initial display)
- Token expiration (recommended)

Example token payload:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "exp": 1234567890,
  "iat": 1234567890
}
```

## Testing

### Test the Integration

1. **Sign in with Google** at https://advotac02.vercel.app/auth
2. **Check localStorage** in browser DevTools:
   - Key: `authToken` should have JWT token
   - Key: `userData` should have user info
3. **Navigate to dashboard** at https://advotac02.vercel.app/dashboard
4. **Open Network tab** in DevTools
5. **Verify API call**:
   - URL: `https://fastapi-eight-zeta.vercel.app/api/user/profile`
   - Method: GET
   - Headers: Authorization: Bearer {token}
   - Status: 200 OK
6. **Check response** contains user data

### Test Error Scenarios

**Invalid Token:**
```bash
curl -H "Authorization: Bearer invalid_token" \
     https://fastapi-eight-zeta.vercel.app/api/user/profile
```
Expected: 401 Unauthorized → Frontend redirects to /auth

**No Token:**
```bash
curl https://fastapi-eight-zeta.vercel.app/api/user/profile
```
Expected: 401/403 → Frontend redirects to /auth

**Valid Token:**
```bash
curl -H "Authorization: Bearer {your_token}" \
     https://fastapi-eight-zeta.vercel.app/api/user/profile
```
Expected: 200 OK with user data

## Dashboard Features

### Displayed Information

1. **User Profile**
   - Name (from API or localStorage)
   - Email (from API or localStorage)
   - Profile Image (from API or localStorage)

2. **Subscription Details**
   - Plan Name (e.g., "Free Plan", "Pro Plan")
   - Subscription Status (active, inactive, cancelled)

3. **Credits Information**
   - Credits Remaining (e.g., 850)
   - Total Credits (e.g., 1000)
   - Visual progress bar

### Sign Out Functionality

When user clicks "Sign Out":
1. Clears `localStorage.authToken`
2. Clears `localStorage.userData`
3. Redirects to `/auth`

## Fallback Behavior

If API call fails (network error, timeout):
- Shows error message at top of dashboard
- Falls back to cached data from localStorage
- User can still see their last known information
- Can retry by refreshing the page

## Security Considerations

1. **Token Storage**: Currently in localStorage (consider httpOnly cookies)
2. **Token Expiration**: Frontend checks for 401/403 and re-authenticates
3. **HTTPS**: All communication over HTTPS
4. **CORS**: FastAPI should validate origin
5. **Token Validation**: Backend must verify JWT signature and expiration

## Deployment Status

✅ **Deployed to Production**
- Frontend: https://advotac02.vercel.app
- Dashboard: https://advotac02.vercel.app/dashboard
- Deployment ID: 2SmGHWiKbnSJnQ2FFnfnSx2UDvd7

## Next Steps for FastAPI Backend

1. ✅ Implement `/api/user/profile` endpoint
2. ✅ Add JWT token verification
3. ✅ Configure CORS for advotac02.vercel.app
4. ✅ Test with actual Google OAuth tokens
5. ✅ Return user data in expected format
6. ✅ Handle error cases (401, 403, 404, 500)
7. ✅ Add rate limiting (optional)
8. ✅ Add logging for debugging

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Network tab for API request/response
3. Verify token in localStorage
4. Check FastAPI logs for backend errors
5. Ensure CORS is configured correctly

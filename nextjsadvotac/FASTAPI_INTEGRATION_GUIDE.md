# FastAPI Google Authentication Integration

## Overview
This document describes the integration of FastAPI backend authentication with the Next.js frontend at https://advotac02.vercel.app/auth.

## Changes Made

### 1. Authentication Flow Update (`src/app/auth/page.tsx`)

**What Changed:**
- Removed NextAuth `signIn` import
- Updated `handleOAuthClick` function to redirect to FastAPI Google OAuth endpoint

**New Flow:**
```
User clicks "Continue with Google" 
  → Redirects to: https://fastapi-eight-zeta.vercel.app/auth/google
  → User authenticates with Google
  → FastAPI processes OAuth
  → Redirects back to: https://advotac02.vercel.app/auth/callback
  → Callback page stores token and user data
  → Redirects to: /dashboard
```

**Code Changes:**
```typescript
// OLD (NextAuth)
const result = await signIn('google', {
  callbackUrl: '/dashboard',
  redirect: true,
});

// NEW (FastAPI)
const fastApiUrl = 'https://fastapi-eight-zeta.vercel.app';
const callbackUrl = encodeURIComponent('https://advotac02.vercel.app/auth/callback');
window.location.href = `${fastApiUrl}/auth/google?callback_url=${callbackUrl}`;
```

### 2. OAuth Callback Handler (`src/app/auth/callback/page.tsx`)

**New File Created**

This page handles the OAuth callback from FastAPI and:
- Receives authentication token and user data from URL parameters
- Stores token in `localStorage.authToken`
- Stores user data in `localStorage.userData` (JSON format)
- Redirects to `/dashboard` on success
- Shows error message and redirects back to `/auth` on failure

**URL Parameters Expected:**
- `token` - JWT authentication token
- `email` - User's email
- `name` - User's name
- `image` - User's profile image URL
- `error` - Error message (if authentication failed)

### 3. Dashboard Update (`src/app/dashboard/page.tsx`)

**What Changed:**
- Removed NextAuth `useSession` and `signOut` imports
- Uses `localStorage` for authentication state
- Updated to read user data from `localStorage.userData`
- Custom sign-out function that clears localStorage

**Authentication Check:**
```typescript
useEffect(() => {
  const token = localStorage.getItem('authToken');
  const storedUserData = localStorage.getItem('userData');
  
  if (!token || !storedUserData) {
    router.push('/auth');
    return;
  }
  
  // Load and parse user data
  const parsedData = JSON.parse(storedUserData);
  setUserData({
    name: parsedData.name || 'User',
    email: parsedData.email || '',
    image: parsedData.image,
    // ... other fields
  });
}, [router]);
```

**Sign Out:**
```typescript
const handleSignOut = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  router.push('/auth');
};
```

## UI Changes

**NONE** - All UI elements remain exactly the same:
- Same "Continue with Google" button
- Same loading states and animations
- Same error messages
- Same dashboard layout
- Same styling and CSS

## Authentication Data Structure

### localStorage.authToken
```
string - JWT token from FastAPI
```

### localStorage.userData
```json
{
  "token": "jwt_token_here",
  "email": "user@example.com",
  "name": "John Doe",
  "image": "https://...",
  "timestamp": 1234567890
}
```

## API Endpoints Used

### FastAPI Endpoints
- **OAuth Initiation:** `https://fastapi-eight-zeta.vercel.app/auth/google`
  - Query params: `callback_url` (where to redirect after auth)
  
- **Expected Callback:** `https://advotac02.vercel.app/auth/callback`
  - Query params: `token`, `email`, `name`, `image`, `error`

## Testing Checklist

- [ ] Click "Continue with Google" on `/auth` page
- [ ] Verify redirect to FastAPI Google OAuth
- [ ] Complete Google authentication
- [ ] Verify redirect to `/auth/callback`
- [ ] Check that token is stored in localStorage
- [ ] Verify automatic redirect to `/dashboard`
- [ ] Check user information displays correctly
- [ ] Test sign-out functionality
- [ ] Verify redirect to `/auth` after sign-out
- [ ] Confirm localStorage is cleared after sign-out

## Security Considerations

1. **Token Storage:** JWT token stored in localStorage (consider httpOnly cookies for production)
2. **Token Expiration:** No automatic token refresh implemented yet
3. **HTTPS Only:** Both domains use HTTPS for secure communication
4. **Callback URL Validation:** FastAPI should validate callback URLs to prevent open redirects

## Future Enhancements

1. Implement token refresh mechanism
2. Add token expiration checking
3. Move token to httpOnly cookies for better security
4. Add API calls to FastAPI for user profile updates
5. Implement proper session management
6. Add loading states during OAuth flow
7. Handle edge cases (network errors, invalid tokens, etc.)

## Deployment Notes

No environment variables needed to be changed in Vercel for this integration. The FastAPI URL is hardcoded in the code.

If FastAPI URL changes, update:
- `src/app/auth/page.tsx` - Line with `const fastApiUrl = 'https://fastapi-eight-zeta.vercel.app';`

If frontend URL changes, update:
- `src/app/auth/page.tsx` - Line with callback URL in `handleOAuthClick`

# FastAPI OAuth Redirect Issue - SOLUTION GUIDE

## 🔴 Current Problem

After successful Google authentication, users are stuck on:
```
https://fastapi-eight-zeta.vercel.app/auth/google/callback?code=...
```

**Expected behavior:** Should redirect to:
```
https://advotac02.vercel.app/auth/callback?token={jwt}&email={email}&name={name}&image={url}
```

## 🎯 Root Cause

Your FastAPI backend is receiving the Google OAuth callback but **NOT redirecting** back to the Next.js frontend with the authentication token and user data.

## ✅ Solution: Update FastAPI Backend

### Step 1: Check Your FastAPI OAuth Flow

Your FastAPI code should have these endpoints:

1. **`/auth/google`** - Initiates OAuth flow
2. **`/auth/google/callback`** - Handles Google's callback

### Step 2: Update the Callback Endpoint

The `/auth/google/callback` endpoint MUST redirect back to your frontend. Here's the correct implementation:

```python
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
import jwt
from datetime import datetime, timedelta

router = APIRouter()

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id='YOUR_GOOGLE_CLIENT_ID',
    client_secret='YOUR_GOOGLE_CLIENT_SECRET',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.get("/auth/google")
async def google_login(request: Request):
    """
    Initiate Google OAuth flow
    Frontend sends: /auth/google?callback_url=https://advotac02.vercel.app/auth/callback
    """
    # Get the callback URL from query params
    callback_url = request.query_params.get('callback_url')
    
    if not callback_url:
        raise HTTPException(status_code=400, detail="callback_url is required")
    
    # Store callback_url in session or state parameter
    # For simplicity, we'll pass it as state
    state = callback_url
    
    # Redirect to Google OAuth with our FastAPI callback URL
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri, state=state)


@router.get("/auth/google/callback")
async def google_callback(request: Request):
    """
    Handle Google OAuth callback and redirect to frontend
    This is where you currently get stuck!
    """
    try:
        # Get the OAuth token from Google
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            user_info = await oauth.google.parse_id_token(token)
        
        # Extract user data
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        
        # Create JWT token for your app
        jwt_payload = {
            'email': email,
            'name': name,
            'picture': picture,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow()
        }
        
        jwt_token = jwt.encode(jwt_payload, 'YOUR_SECRET_KEY', algorithm='HS256')
        
        # Get the frontend callback URL from state
        frontend_callback_url = request.query_params.get('state')
        
        if not frontend_callback_url:
            frontend_callback_url = 'https://advotac02.vercel.app/auth/callback'
        
        # Build redirect URL with token and user data
        from urllib.parse import urlencode
        params = {
            'token': jwt_token,
            'email': email,
            'name': name,
            'image': picture
        }
        
        redirect_url = f"{frontend_callback_url}?{urlencode(params)}"
        
        # THIS IS THE KEY: Redirect back to frontend
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        print(f"OAuth callback error: {e}")
        # Redirect to frontend with error
        error_url = f"https://advotac02.vercel.app/auth/callback?error={str(e)}"
        return RedirectResponse(url=error_url)
```

### Step 3: Key Points to Implement

#### ✅ DO THIS:

1. **In `/auth/google` endpoint:**
   - Accept `callback_url` parameter from frontend
   - Store it in `state` parameter for OAuth
   - Frontend sends: `/auth/google?callback_url=https://advotac02.vercel.app/auth/callback`

2. **In `/auth/google/callback` endpoint:**
   - Get user info from Google token
   - Create your own JWT token
   - Extract `state` parameter (contains frontend callback URL)
   - **BUILD REDIRECT URL** with token and user data
   - **RETURN RedirectResponse** to send user back to frontend

3. **Redirect URL format:**
   ```
   https://advotac02.vercel.app/auth/callback?token={jwt}&email={email}&name={name}&image={picture}
   ```

#### ❌ DON'T DO THIS:

- Don't just return JSON from `/auth/google/callback`
- Don't render an HTML page
- Don't keep user on FastAPI domain

## 🔧 Alternative: Simpler Implementation

If the above is too complex, use this simpler version:

```python
@router.get("/auth/google/callback")
async def google_callback(code: str):
    """
    Simple version - hardcoded redirect to frontend
    """
    try:
        # Exchange code for token with Google
        # ... (your existing code to get user from Google)
        
        # Get user info
        email = "user@example.com"  # From Google
        name = "User Name"          # From Google
        picture = "https://..."     # From Google
        
        # Create your JWT
        jwt_token = create_jwt_token(email, name)  # Your function
        
        # Build redirect URL
        redirect_url = (
            f"https://advotac02.vercel.app/auth/callback"
            f"?token={jwt_token}"
            f"&email={email}"
            f"&name={name}"
            f"&image={picture}"
        )
        
        # REDIRECT!
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        # On error, redirect with error message
        return RedirectResponse(
            url=f"https://advotac02.vercel.app/auth/callback?error={str(e)}"
        )
```

## 🧪 Test Your Changes

### Step 1: Test OAuth Initiation
```bash
# This should redirect to Google login
curl -L "https://fastapi-eight-zeta.vercel.app/auth/google?callback_url=https://advotac02.vercel.app/auth/callback"
```

### Step 2: After Google Authentication
After you sign in with Google, the `/auth/google/callback` endpoint should:
1. ✅ Receive the `code` from Google
2. ✅ Exchange it for user info
3. ✅ Create JWT token
4. ✅ **REDIRECT** to: `https://advotac02.vercel.app/auth/callback?token=...&email=...&name=...`

### Step 3: Verify in Browser
1. Go to: https://advotac02.vercel.app/auth
2. Click "Continue with Google"
3. Sign in with Google
4. **YOU SHOULD SEE:** Browser redirects to `/test_dashboard`
5. **YOU SHOULD NOT SEE:** Stuck on `fastapi-eight-zeta.vercel.app/auth/google/callback`

## 📊 Current Flow vs Expected Flow

### ❌ Current (Broken):
```
Frontend (/auth)
    ↓
FastAPI (/auth/google)
    ↓
Google OAuth
    ↓
FastAPI (/auth/google/callback) ⬅️ STUCK HERE!
```

### ✅ Expected (Fixed):
```
Frontend (/auth)
    ↓
FastAPI (/auth/google)
    ↓
Google OAuth
    ↓
FastAPI (/auth/google/callback)
    ↓ (RedirectResponse)
Frontend (/auth/callback) ⬅️ Should end here!
    ↓
Frontend (/test_dashboard) ✅
```

## 🔍 Debugging

Add logging to your FastAPI callback:

```python
@router.get("/auth/google/callback")
async def google_callback(request: Request):
    print("=" * 50)
    print("CALLBACK RECEIVED")
    print(f"Query params: {request.query_params}")
    print(f"URL: {request.url}")
    print("=" * 50)
    
    # ... rest of your code
    
    redirect_url = "https://advotac02.vercel.app/auth/callback?token=..."
    print(f"REDIRECTING TO: {redirect_url}")
    print("=" * 50)
    
    return RedirectResponse(url=redirect_url)
```

Check your FastAPI logs to verify:
1. Callback is being called
2. Redirect URL is being built correctly
3. RedirectResponse is being returned

## 🚨 Common Mistakes

1. **Returning JSON instead of redirect:**
   ```python
   # ❌ WRONG
   return {"token": jwt_token, "email": email}
   
   # ✅ CORRECT
   return RedirectResponse(url=redirect_url)
   ```

2. **Missing query parameters:**
   ```python
   # ❌ WRONG
   redirect_url = "https://advotac02.vercel.app/auth/callback"
   
   # ✅ CORRECT
   redirect_url = f"https://advotac02.vercel.app/auth/callback?token={jwt_token}&email={email}&name={name}&image={picture}"
   ```

3. **Not URL encoding parameters:**
   ```python
   # ✅ BEST PRACTICE
   from urllib.parse import urlencode
   params = {'token': jwt_token, 'email': email, 'name': name, 'image': picture}
   redirect_url = f"https://advotac02.vercel.app/auth/callback?{urlencode(params)}"
   ```

## 📦 Required Python Packages

Make sure you have these installed in your FastAPI project:

```bash
pip install fastapi
pip install authlib
pip install python-jose[cryptography]  # For JWT
pip install httpx  # For OAuth
```

## 🔐 Environment Variables

Set these in your FastAPI backend:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET_KEY=your_secret_key_for_jwt
FRONTEND_URL=https://advotac02.vercel.app
```

## 📝 Summary

**The fix is simple:** Your FastAPI `/auth/google/callback` endpoint must use `RedirectResponse` to send the user back to your Next.js frontend with the token and user data as query parameters.

**Key line of code:**
```python
return RedirectResponse(url=f"https://advotac02.vercel.app/auth/callback?token={jwt_token}&email={email}&name={name}&image={picture}")
```

That's it! Once you add this redirect, the OAuth flow will complete correctly and users will end up on `/test_dashboard` with their name and email displayed.

---

**Next Step:** Update your FastAPI `/auth/google/callback` endpoint to redirect instead of returning JSON or rendering HTML.

"""
FastAPI Google OAuth Backend for Advotac
✅ FIXED VERSION - Properly redirects to frontend domain
"""

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import jwt
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote
import os
from typing import Optional
import secrets
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advotac Auth API",
    description="Google OAuth Backend for advotac02.vercel.app",
    version="1.0.0"
)

# CORS Configuration - Allow frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://advotac02.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-in-production-please-use-random-32-chars")
JWT_ALGORITHM = "HS256"
FRONTEND_URL = "https://advotac02.vercel.app"

# In-memory store for callback URLs (use Redis in production)
callback_store = {}


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Advotac Auth API",
        "version": "1.0.0"
    }


@app.get("/auth/google")
async def google_login(callback_url: str):
    """
    Initiate Google OAuth flow
    
    Query Parameters:
    - callback_url: Frontend callback URL (e.g., https://advotac02.vercel.app/auth/callback)
    
    Example:
    GET /auth/google?callback_url=https://advotac02.vercel.app/auth/callback
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
        )
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store callback URL with state
    callback_store[state] = callback_url
    
    # Build Google OAuth URL
    google_oauth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    
    # Get the base URL for redirect URI
    redirect_uri = "https://fastapi-eight-zeta.vercel.app/auth/google/callback"
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    oauth_url = f"{google_oauth_url}?{urlencode(params)}"
    print(f"🔐 Redirecting to Google OAuth with state: {state}")
    print(f"📍 Callback will redirect to: {callback_url}")
    
    return RedirectResponse(url=oauth_url)


@app.get("/auth/google/callback")
async def google_callback(code: str, state: Optional[str] = None):
    """
    🎯 CRITICAL FIX: Handle Google OAuth callback and redirect to frontend
    
    This endpoint receives the authorization code from Google,
    exchanges it for user info, generates a JWT token,
    and REDIRECTS to advotac02.vercel.app with the token.
    
    Query Parameters:
    - code: Authorization code from Google
    - state: CSRF protection token (optional)
    """
    logger.info("=" * 60)
    logger.info("🔐 GOOGLE CALLBACK RECEIVED")
    logger.info(f"✅ Code: {code[:30]}...")
    logger.info(f"🔑 State: {state}")
    logger.info("=" * 60)
    
    # Default to advotac02.vercel.app if state is missing
    callback_url = FRONTEND_URL + "/auth/callback"
    
    try:
        # Get the original callback URL from state if it exists
        if state and state in callback_store:
            callback_url = callback_store.get(state)
            logger.info(f"✅ Found callback URL from state: {callback_url}")
            del callback_store[state]  # Clean up
        else:
            logger.info(f"⚠️ Using default callback URL: {callback_url}")
        
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = "https://fastapi-eight-zeta.vercel.app/auth/google/callback"
        
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        logger.info("🔄 Exchanging code for access token...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get access token
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                error_msg = f"Token exchange failed: {token_response.text}"
                logger.error(f"❌ {error_msg}")
                # Redirect to frontend with error
                error_url = f"{callback_url}?error={quote(error_msg)}"
                return RedirectResponse(url=error_url)
            
            tokens = token_response.json()
            logger.info("✅ Got access token from Google")
            
            # Get user info from Google
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            
            logger.info("🔄 Fetching user info from Google...")
            userinfo_response = await client.get(userinfo_url, headers=headers)
            
            if userinfo_response.status_code != 200:
                error_msg = f"User info fetch failed: {userinfo_response.text}"
                logger.error(f"❌ {error_msg}")
                error_url = f"{callback_url}?error={quote(error_msg)}"
                return RedirectResponse(url=error_url)
            
            user_info = userinfo_response.json()
            logger.info(f"✅ Got user info: {user_info.get('email')}")
        
        # Create JWT token for your app
        jwt_payload = {
            "email": user_info.get("email", ""),
            "name": user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
            "sub": user_info.get("id", ""),
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=30)
        }
        
        jwt_token = jwt.encode(jwt_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        logger.info("✅ Generated JWT token")
        
        # Build frontend callback URL with user data
        frontend_params = {
            "token": jwt_token,
            "email": user_info.get("email", ""),
            "name": user_info.get("name", ""),
            "image": user_info.get("picture", "")
        }
        
        redirect_url = f"{callback_url}?{urlencode(frontend_params)}"
        logger.info("=" * 60)
        logger.info("🎯 REDIRECTING TO FRONTEND")
        logger.info(f"📍 URL: {redirect_url[:80]}...")
        logger.info("=" * 60)
        
        # 🔥 THIS IS THE KEY FIX - Redirect to advotac02.vercel.app
        return RedirectResponse(url=redirect_url, status_code=302)
        
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR: {str(e)}")
        logger.exception(e)
        # Always redirect to frontend, even with error
        error_url = f"{callback_url}?error={quote(str(e))}"
        logger.info(f"🔄 Redirecting to error URL: {error_url}")
        return RedirectResponse(url=error_url, status_code=302)


@app.get("/user/profile")
async def get_user_profile(authorization: Optional[str] = Header(None)):
    """
    Get authenticated user profile from JWT token
    
    Headers:
    - Authorization: Bearer <jwt_token>
    
    Returns:
    - name: User's full name
    - email: User's email address  
    - image: User's profile picture URL
    """
    logger.info("📊 Profile request received")
    
    if not authorization:
        logger.error("❌ No authorization header")
        raise HTTPException(
            status_code=401,
            detail="No authorization token provided"
        )
    
    if not authorization.startswith("Bearer "):
        logger.error("❌ Invalid authorization format")
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use: Bearer <token>"
        )
    
    token = authorization.replace("Bearer ", "")
    logger.info(f"🔑 Token received: {token[:20]}...")
    
    try:
        # Verify and decode JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        logger.info(f"✅ Token verified for user: {payload.get('email')}")
        
        # Return user data in multiple formats for compatibility
        user_data = {
            "name": payload.get("name", ""),
            "full_name": payload.get("name", ""),
            "email": payload.get("email", ""),
            "image": payload.get("picture", ""),
            "picture": payload.get("picture", ""),
            "profile_picture": payload.get("picture", ""),
            "sub": payload.get("sub", ""),
            "email_verified": True
        }
        
        logger.info(f"✅ Returning profile for: {user_data['email']}")
        return user_data
        
    except jwt.ExpiredSignatureError:
        logger.error("❌ Token expired")
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"❌ Invalid token: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    except Exception as e:
        logger.error(f"❌ Error in profile endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user profile"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "google_oauth_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

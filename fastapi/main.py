from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse, HTMLResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import requests
import urllib.parse
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import json
import logging
from pathlib import Path
import time

from config import settings
from models import User, Token, GoogleUserInfo, UserCreate, UserInfo, UserInfoCreate, UserInfoUpdate
from database import get_db, UserDB, UserInfoDB, init_db, test_connection, log_auth_event
import os
from api_assistant import router as assistant_router

# Configure logging for serverless environment (Vercel)
# Only log to stdout/stderr since filesystem is read-only except /tmp
handlers = [logging.StreamHandler()]

# Only add file handler if not in serverless environment
if os.environ.get('VERCEL') != '1':
    try:
        handlers.append(logging.FileHandler('app.log', encoding='utf-8'))
    except (OSError, IOError):
        pass  # Skip file logging if filesystem is read-only

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger(__name__)

app = FastAPI(title="FastAPI Google OAuth", version="1.0.0")

# CORS middleware - Allow frontend apps (localhost only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://advotac.com/",
        "https://advotac.com/",
        settings.FRONTEND_URL,  # Will be http://localhost:3000 from .env
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Assistant API routes
app.include_router(assistant_router, prefix="/api")

# Startup event - Initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        logger.info("=" * 80)
        logger.info("🚀 Starting FastAPI Google OAuth Application")
        logger.info("=" * 80)
        
        # Test database connection
        test_connection()
        
        # Initialize database tables
        init_db()
        
        logger.info("=" * 80)
        logger.info("✓ Application started successfully!")
        logger.info(f"✓ Database: {settings.PGDATABASE}")
        logger.info(f"✓ Host: {settings.PGHOST}")
        logger.info(f"✓ Redirect URI: {settings.GOOGLE_REDIRECT_URI}")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"✗ Startup failed: {str(e)}")
        raise

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.warning("Token verification failed: No email in payload")
            raise HTTPException(status_code=401, detail="Invalid token")
        logger.info(f"✓ Token verified for: {email}")
        return email
    except JWTError as e:
        logger.error(f"✗ JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(email: str = Depends(verify_token), db: Session = Depends(get_db)) -> User:
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        logger.warning(f"User not found: {email}")
        raise HTTPException(status_code=404, detail="User not found")
    logger.info(f"✓ Current user retrieved: {email}")
    return User.model_validate(user)

# Google OAuth functions
def get_google_auth_url(state: str = None) -> str:
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "select_account",  # Force account selection every time
    }
    if state:
        params["state"] = state
    
    return f"{settings.GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"

def exchange_code_for_tokens(code: str) -> dict:
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }
    
    response = requests.post(settings.GOOGLE_TOKEN_URL, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
    
    return response.json()

def get_google_user_info(access_token: str) -> GoogleUserInfo:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(settings.GOOGLE_USER_INFO_URL, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")
    
    user_data = response.json()
    return GoogleUserInfo(**user_data)

def create_or_update_user(google_user: GoogleUserInfo, db: Session) -> User:
    """Create or update user in database with retry logic"""
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            # Check if user exists
            user = db.query(UserDB).filter(UserDB.email == google_user.email).first()
            
            if user:
                # Update existing user
                logger.info(f"Updating existing user: {google_user.email}")
                user.name = google_user.name
                user.picture = google_user.picture or ""
                user.verified_email = google_user.verified_email
                user.last_login = datetime.utcnow()
            else:
                # Create new user
                logger.info(f"Creating new user: {google_user.email}")
                user = UserDB(
                    id=google_user.id,
                    email=google_user.email,
                    name=google_user.name,
                    picture=google_user.picture or "",
                    verified_email=google_user.verified_email,
                    created_at=datetime.utcnow(),
                    last_login=datetime.utcnow()
                )
                db.add(user)
            
            db.commit()
            db.refresh(user)
            
            logger.info(f"✓ User saved to database: {user.email}")
            return User.model_validate(user)
            
        except Exception as e:
            logger.error(f"✗ Error creating/updating user (attempt {attempt + 1}/{max_retries}): {str(e)}")
            db.rollback()
            
            # If this is the last attempt or not a connection error, raise immediately
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=503,
                    detail=f"Database unavailable: {str(e)}"
                )
            
            # Wait before retrying (only for connection errors)
            if "connection" in str(e).lower() or "timeout" in str(e).lower():
                import time
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                raise  # Non-connection errors should fail immediately

# Routes
@app.get("/", response_class=HTMLResponse)
async def root(request: Request, test: bool = False):
    """
    Root page - redirects to login unless ?test=true is specified
    - Visit / to auto-login with Google
    - Visit /?test=true to see the deployment test page
    """
    try:
        # If test parameter is true, show the test page
        if test:
            html_path = Path(__file__).parent / "templates" / "index.html"
            if html_path.exists():
                with open(html_path, "r", encoding="utf-8") as f:
                    return HTMLResponse(content=f.read())
        
        # Otherwise, redirect to login page (which auto-redirects to Google)
        return RedirectResponse(url="/login")
        
    except Exception as e:
        logger.error(f"Error serving root page: {str(e)}")
        return RedirectResponse(url="/login")

@app.get("/health")
async def health_check():
    """Health check endpoint to verify database connectivity"""
    import time
    start_time = time.time()
    
    try:
        # Try to connect to database
        from database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        
        # Run a simple query
        db.execute(text("SELECT 1"))
        db.close()
        
        connection_time = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "healthy",
            "database": "connected",
            "connection_time_ms": connection_time,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": "vercel" if os.environ.get('VERCEL') == '1' else "local"
        }
    except Exception as e:
        connection_time = round((time.time() - start_time) * 1000, 2)
        logger.error(f"Health check failed: {str(e)}")
        
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "connection_time_ms": connection_time,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": "vercel" if os.environ.get('VERCEL') == '1' else "local",
            "hint": "Check Azure PostgreSQL firewall settings - see AZURE_VERCEL_CONNECTION_FIX.md"
        }

@app.get("/login", response_class=HTMLResponse)
@app.get("/login/", response_class=HTMLResponse)
async def login_page():
    """Serve login page with auto-redirect to Google OAuth"""
    try:
        login_path = Path(__file__).parent / "templates" / "login.html"
        if login_path.exists():
            with open(login_path, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
        else:
            # Fallback: direct redirect
            return RedirectResponse(url="/auth/google")
    except Exception as e:
        logger.error(f"Error serving login page: {str(e)}")
        return RedirectResponse(url="/auth/google")

@app.get("/auth/google")
@app.get("/auth/google/")
async def google_auth(state: str = None):
    """Redirect to Google OAuth"""
    auth_url = get_google_auth_url(state=state)
    return RedirectResponse(url=auth_url)

@app.get("/api/auth/google-url")
async def get_google_oauth_url(state: str = None):
    """Get Google OAuth URL for frontend to redirect (API endpoint)"""
    auth_url = get_google_auth_url(state=state)
    return {
        "auth_url": auth_url,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI
    }

@app.get("/auth/google/callback")
@app.get("/auth/google/callback/")
async def google_callback(code: str, state: str = None, request: Request = None, frontend_redirect: bool = True):
    """Handle Google OAuth callback - can redirect to frontend or show HTML page"""
    client_ip = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    
    logger.info("=" * 80)
    logger.info("🔐 Google OAuth Callback Received")
    logger.info(f"Code: {code[:20]}...")
    logger.info(f"Client IP: {client_ip}")
    logger.info(f"User Agent: {user_agent}")
    logger.info(f"Frontend Redirect: {frontend_redirect}")
    logger.info("=" * 80)
    
    db_available = False
    db = None
    
    try:
        # Try to get database connection (but don't fail if unavailable)
        try:
            from database import SessionLocal
            from sqlalchemy import text
            db = SessionLocal()
            db.execute(text("SELECT 1"))  # Test connection
            db_available = True
            logger.info("✓ Database connection established")
        except Exception as db_error:
            logger.warning(f"⚠️ Database unavailable: {str(db_error)}")
            logger.warning("⚠️ Continuing without database - user data will not be persisted")
            db_available = False
        
        # Exchange code for tokens
        logger.info("Step 1: Exchanging code for tokens...")
        token_data = exchange_code_for_tokens(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            logger.error("✗ No access token received from Google")
            raise HTTPException(status_code=400, detail="No access token received")
        
        logger.info("✓ Access token received from Google")
        
        # Get user info from Google
        logger.info("Step 2: Getting user info from Google...")
        google_user = get_google_user_info(access_token)
        logger.info(f"✓ User info received: {google_user.email}")
        
        # Create or update user in our system (only if DB is available)
        user = None
        if db_available and db:
            try:
                logger.info("Step 3: Creating/updating user in database...")
                user = create_or_update_user(google_user, db)
                logger.info(f"✓ User saved: {user.email}")
                
                # Log successful authentication
                log_auth_event(
                    db=db,
                    user_id=user.id,
                    email=user.email,
                    action="login",
                    status="success",
                    ip_address=client_ip,
                    user_agent=user_agent
                )
            except Exception as db_error:
                logger.error(f"✗ Database operation failed: {str(db_error)}")
                logger.warning("⚠️ Continuing without saving to database")
                db_available = False
        
        # Create JWT token for our application (using Google user data)
        logger.info("Step 4: Creating JWT token...")
        jwt_token = create_access_token(data={"sub": google_user.email})
        logger.info("✓ JWT token created")
        
        # Prepare user data
        user_display_name = user.name if (user and db_available) else google_user.name
        user_display_email = user.email if (user and db_available) else google_user.email
        user_display_id = user.id if (user and db_available) else google_user.id
        user_display_picture = (user.picture if (user and db_available) else google_user.picture) or ''
        
        # Redirect to frontend callback page with token and user data
        # The callback page will store in localStorage and then redirect to dashboard
        frontend_url = settings.FRONTEND_URL or "https://advotac02.vercel.app"
        redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}&id={urllib.parse.quote(user_display_id)}&email={urllib.parse.quote(user_display_email)}&name={urllib.parse.quote(user_display_name)}&image={urllib.parse.quote(user_display_picture)}"
        
        logger.info(f"✓ Redirecting to frontend callback: {frontend_url}/auth/callback")
        logger.info(f"✓ Token: {jwt_token[:20]}...")
        logger.info(f"✓ User ID: {user_display_id}")
        logger.info(f"✓ User: {user_display_name} ({user_display_email})")
        return RedirectResponse(url=redirect_url)
        
        # Old HTML response kept for reference (not used when redirecting)
        db_status_html = ""
        if not db_available:
            db_status_html = '<p style="color: orange;">⚠️ Note: Database temporarily unavailable. User data not persisted. <a href="/AZURE_VERCEL_CONNECTION_FIX.md" target="_blank">See fix guide</a></p>'
        else:
            db_status_html = '<p>✅ User data has been saved to database</p><p>✅ Authentication event has been logged</p>'
        
        # This HTML won't be shown when redirecting, kept for backward compatibility
        if False:  # Disabled - we're redirecting instead
            return HTMLResponse(f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign in Successful - Advotac Legal</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                :root {{
                    --background: #ffffff;
                    --foreground: #000000;
                    --card: #ffffff;
                    --border: #e5e7eb;
                    --primary: #000000;
                    --success: #22c55e;
                    --warning: #f59e0b;
                    --muted: #6b7280;
                }}
                body {{
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: var(--background);
                    color: var(--foreground);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    -webkit-font-smoothing: antialiased;
                }}
                .success-container {{
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    max-width: 600px;
                    width: 100%;
                    padding: 48px 40px;
                }}
                .success-icon {{
                    width: 64px;
                    height: 64px;
                    background: var(--success);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    margin: 0 auto 24px;
                    animation: scaleIn 0.3s ease-out;
                }}
                @keyframes scaleIn {{
                    from {{ transform: scale(0); }}
                    to {{ transform: scale(1); }}
                }}
                h1 {{
                    font-size: 28px;
                    font-weight: 600;
                    text-align: center;
                    margin-bottom: 8px;
                    letter-spacing: -0.025em;
                }}
                .subtitle {{
                    color: var(--muted);
                    font-size: 16px;
                    text-align: center;
                    margin-bottom: 32px;
                }}
                .user-card {{
                    background: #f9fafb;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }}
                .user-avatar {{
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 600;
                    flex-shrink: 0;
                }}
                .user-info {{
                    flex: 1;
                }}
                .user-name {{
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 4px;
                }}
                .user-email {{
                    color: var(--muted);
                    font-size: 14px;
                }}
                .token-section {{
                    background: #f9fafb;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                }}
                .token-label {{
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--muted);
                    margin-bottom: 8px;
                }}
                .token-value {{
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 12px;
                    word-break: break-all;
                    color: var(--primary);
                }}
                .status-list {{
                    list-style: none;
                    margin-bottom: 24px;
                }}
                .status-item {{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 0;
                    font-size: 14px;
                }}
                .status-item.success {{ color: var(--success); }}
                .status-item.warning {{ color: var(--warning); }}
                .status-icon {{
                    font-size: 18px;
                    flex-shrink: 0;
                }}
                .info-box {{
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 24px;
                }}
                .info-box p {{
                    font-size: 13px;
                    color: #0c4a6e;
                    line-height: 1.6;
                }}
                @media (prefers-color-scheme: dark) {{
                    :root {{
                        --background: #000000;
                        --foreground: #ffffff;
                        --card: #0a0a0a;
                        --border: #262626;
                        --primary: #ffffff;
                        --muted: #a3a3a3;
                    }}
                    .user-card, .token-section {{
                        background: #1a1a1a;
                    }}
                    .token-value {{
                        background: #0a0a0a;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="success-container">
                <div class="success-icon">✓</div>
                <h1>Sign in Successful!</h1>
                <p class="subtitle">Welcome back, {user_display_name}</p>
                
                <div class="user-card">
                    <div class="user-avatar">{user_display_name[0].upper()}</div>
                    <div class="user-info">
                        <div class="user-name">{user_display_name}</div>
                        <div class="user-email">{user_display_email}</div>
                    </div>
                </div>
                
                <div class="token-section">
                    <div class="token-label">🔑 Your Access Token</div>
                    <div class="token-value">{jwt_token[:60]}...</div>
                </div>
                
                <ul class="status-list">
                    {"<li class='status-item success'><span class='status-icon'>✓</span> User data saved to database</li><li class='status-item success'><span class='status-icon'>✓</span> Authentication event logged</li>" if db_available else "<li class='status-item warning'><span class='status-icon'>⚠</span> Database temporarily unavailable - data not persisted</li>"}
                    <li class="status-item success"><span class="status-icon">✓</span> JWT token generated</li>
                    <li class="status-item success"><span class="status-icon">✓</span> Session expires in {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes</li>
                </ul>
                
                <div class="info-box">
                    <p>You can now close this window. Use the access token above for API authentication by including it in the Authorization header: <code>Bearer YOUR_TOKEN</code></p>
                </div>
            </div>
            
            <script>
                // Send token to parent window if opened as popup
                if (window.opener) {{
                    window.opener.postMessage({{
                        token: "{jwt_token}",
                        user: {{
                            id: "{user_display_id}",
                            email: "{user_display_email}",
                            name: "{user_display_name}",
                            picture: "{user_display_picture}"
                        }}
                    }}, "*");
                    setTimeout(() => window.close(), 3000);
                }}
            </script>
        </body>
        </html>
        """)
        
    except HTTPException as he:
        logger.error("=" * 80)
        logger.error(f"✗ Authentication failed: {he.detail}")
        logger.error("=" * 80)
        
        # Try to log failed authentication (but don't fail if logging fails)
        try:
            log_auth_event(
                db=db,
                user_id="unknown",
                email="unknown",
                action="login",
                status="failed",
                ip_address=client_ip,
                user_agent=user_agent,
                error_message=str(he.detail)
            )
        except Exception as log_error:
            logger.warning(f"Could not log auth event: {log_error}")
        
        # Return user-friendly error page
        return HTMLResponse(
            status_code=he.status_code,
            content=f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sign in Failed - Advotac Legal</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                    :root {{
                        --background: #ffffff;
                        --foreground: #000000;
                        --card: #ffffff;
                        --border: #e5e7eb;
                        --error: #ef4444;
                        --muted: #6b7280;
                    }}
                    body {{
                        font-family: 'Inter', sans-serif;
                        background: var(--background);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                    }}
                    .error-container {{
                        background: var(--card);
                        border: 1px solid var(--border);
                        border-radius: 12px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        max-width: 500px;
                        width: 100%;
                        padding: 48px 40px;
                        text-align: center;
                    }}
                    .error-icon {{
                        width: 64px;
                        height: 64px;
                        background: #fee2e2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        margin: 0 auto 24px;
                    }}
                    h1 {{
                        font-size: 24px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        color: var(--foreground);
                    }}
                    .error-message {{
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 24px 0;
                        color: #991b1b;
                        font-size: 14px;
                        text-align: left;
                    }}
                    .error-message strong {{
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                    }}
                    .back-btn {{
                        display: inline-block;
                        background: var(--foreground);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 500;
                        font-size: 14px;
                        transition: all 0.2s;
                    }}
                    .back-btn:hover {{
                        opacity: 0.9;
                        transform: translateY(-1px);
                    }}
                    .help-text {{
                        margin-top: 24px;
                        font-size: 13px;
                        color: var(--muted);
                    }}
                    @media (prefers-color-scheme: dark) {{
                        :root {{
                            --background: #000000;
                            --foreground: #ffffff;
                            --card: #0a0a0a;
                            --border: #262626;
                            --muted: #a3a3a3;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">✕</div>
                    <h1>Sign in Failed</h1>
                    <p style="color: var(--muted); margin-bottom: 8px;">We couldn't complete your authentication</p>
                    
                    <div class="error-message">
                        <strong>Error Details:</strong>
                        {he.detail}
                    </div>
                    
                    <a href="/" class="back-btn">← Try Again</a>
                    
                    <p class="help-text">
                        If this problem persists, please contact support at<br>
                        <strong>support@advotaclegal.com</strong>
                    </p>
                </div>
            </body>
            </html>
            """
        )
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"✗ Unexpected error: {str(e)}")
        logger.error("=" * 80)
        
        # Try to log failed authentication (but don't fail if logging fails)
        try:
            log_auth_event(
                db=db,
                user_id="unknown",
                email="unknown",
                action="login",
                status="failed",
                ip_address=client_ip,
                user_agent=user_agent,
                error_message=str(e)
            )
        except Exception as log_error:
            logger.warning(f"Could not log auth event: {log_error}")
        
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
    
    finally:
        # Always close DB connection if opened
        if db:
            try:
                db.close()
            except:
                pass

@app.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    logger.info(f"User info requested for: {current_user.email}")
    return current_user

@app.get("/users")
async def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all users (protected route example)"""
    logger.info(f"All users requested by: {current_user.email}")
    users = db.query(UserDB).all()
    return {
        "users": [User.model_validate(u).model_dump() for u in users],
        "current_user": current_user.email,
        "total_users": len(users)
    }

@app.get("/auth-logs")
async def get_auth_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get authentication logs"""
    logger.info(f"Auth logs requested by: {current_user.email}")
    from database import AuthLogDB
    logs = db.query(AuthLogDB).order_by(AuthLogDB.timestamp.desc()).limit(50).all()
    return {
        "logs": [
            {
                "id": log.id,
                "email": log.email,
                "action": log.action,
                "status": log.status,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat()
            }
            for log in logs
        ],
        "total": len(logs)
    }

@app.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Logout user (in a real app, you might blacklist the token)"""
    logger.info(f"User logout: {current_user.email}")
    
    # Log logout event
    log_auth_event(
        db=db,
        user_id=current_user.id,
        email=current_user.email,
        action="logout",
        status="success",
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    
    return {"message": f"User {current_user.email} logged out successfully"}


# ============================================================================
# USER INFO ENDPOINTS
# ============================================================================

@app.post("/user-info", response_model=UserInfo)
async def create_user_info(
    user_info: UserInfoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create user info for the authenticated user"""
    logger.info(f"Creating user info for: {current_user.email}")
    
    # Check if user info already exists
    existing_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    if existing_info:
        logger.warning(f"User info already exists for: {current_user.email}")
        raise HTTPException(status_code=400, detail="User info already exists. Use PUT to update.")
    
    # No need to verify user_id - we use the authenticated user's ID automatically
    # This prevents the 403 error and is more secure
    
    try:
        # Create new user info using the authenticated user's ID
        db_user_info = UserInfoDB(
            user_id=current_user.id,  # Always use the authenticated user's ID
            full_name=user_info.full_name or current_user.name,
            profile_pic=user_info.profile_pic or current_user.picture,
            email=user_info.email or current_user.email,
            phone=user_info.phone,
            phone_verified=user_info.phone_verified,
            state=user_info.state,
            iam_a=user_info.iam_a,
            user_status=user_info.user_status
        )
        
        db.add(db_user_info)
        db.commit()
        db.refresh(db_user_info)
        
        logger.info(f"User info created successfully for: {current_user.email}")
        return UserInfo.model_validate(db_user_info)
        
    except Exception as e:
        logger.error(f"Error creating user info: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user info: {str(e)}")


@app.get("/user-info", response_model=UserInfo)
async def get_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user info for the authenticated user"""
    logger.info(f"Getting user info for: {current_user.email}")
    
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    
    if not user_info:
        logger.warning(f"User info not found for: {current_user.email}")
        raise HTTPException(status_code=404, detail="User info not found. Please create it first.")
    
    return UserInfo.model_validate(user_info)


@app.get("/user-info/{user_id}", response_model=UserInfo)
async def get_user_info_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user info by user ID (for admin or public profile view)"""
    logger.info(f"Getting user info for user_id: {user_id} requested by: {current_user.email}")
    
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == user_id).first()
    
    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found")
    
    return UserInfo.model_validate(user_info)


@app.put("/user-info", response_model=UserInfo)
async def update_user_info(
    user_info_update: UserInfoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user info for the authenticated user"""
    logger.info(f"Updating user info for: {current_user.email}")
    
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    
    if not user_info:
        logger.warning(f"User info not found for update: {current_user.email}")
        raise HTTPException(status_code=404, detail="User info not found. Please create it first.")
    
    try:
        # Update only provided fields
        update_data = user_info_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user_info, field, value)
        
        user_info.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user_info)
        
        logger.info(f"User info updated successfully for: {current_user.email}")
        return UserInfo.model_validate(user_info)
        
    except Exception as e:
        logger.error(f"Error updating user info: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user info: {str(e)}")


@app.delete("/user-info")
async def delete_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user info for the authenticated user"""
    logger.info(f"Deleting user info for: {current_user.email}")
    
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    
    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found")
    
    try:
        db.delete(user_info)
        db.commit()
        
        logger.info(f"User info deleted successfully for: {current_user.email}")
        return {"message": "User info deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting user info: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user info: {str(e)}")


@app.get("/user-info-list")
async def list_all_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all user info records (admin endpoint)"""
    logger.info(f"Listing all user info requested by: {current_user.email}")
    
    user_infos = db.query(UserInfoDB).offset(skip).limit(limit).all()
    total = db.query(UserInfoDB).count()
    
    return {
        "user_infos": [UserInfo.model_validate(ui).model_dump() for ui in user_infos],
        "total": total,
        "skip": skip,
        "limit": limit
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

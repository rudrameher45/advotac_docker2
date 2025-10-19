"""
FastAPI Google OAuth API
========================
Pure REST API for Google OAuth authentication and user management.
All endpoints return JSON responses (no HTML templates).

Author: Advotac Legal
Version: 1.0.0
Last Updated: October 12, 2025
"""

from fastapi import FastAPI, HTTPException, Depends, Request
import re
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests
import urllib.parse
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import logging
import os

from config import settings
from models import User, Token, GoogleUserInfo, UserInfo, UserInfoCreate, UserInfoUpdate
from database import get_db, UserDB, UserInfoDB, init_db, test_connection, log_auth_event
from api_assistant import router as assistant_router

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

handlers = [logging.StreamHandler()]
if os.environ.get('VERCEL') != '1':
    try:
        handlers.append(logging.FileHandler('app.log', encoding='utf-8'))
    except (OSError, IOError):
        pass

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger(__name__)

# ============================================================================
# APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="FastAPI Google OAuth API",
    description="REST API for Google OAuth authentication and user management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# Normalize duplicate slashes in incoming request paths (e.g. //api/assistant -> /api/assistant)
@app.middleware("http")
async def normalize_path_middleware(request: Request, call_next):
    try:
        # Normalize textual path
        path = request.scope.get('path', '')
        if isinstance(path, str) and '//' in path:
            # Replace multiple slashes with a single slash
            new_path = re.sub(r'/{2,}', '/', path)
            request.scope['path'] = new_path

        # Normalize raw_path (bytes) if present - some ASGI servers set raw_path
        raw_path = request.scope.get('raw_path')
        if isinstance(raw_path, (bytes, bytearray)):
            try:
                if b'//' in raw_path:
                    new_raw = re.sub(rb'/{2,}', b'/', raw_path)
                    request.scope['raw_path'] = new_raw
            except Exception:
                # ignore bytes replacement errors
                pass

        # Normalize root_path if set (rare) to avoid leading duplicate slashes
        root = request.scope.get('root_path', '')
        if isinstance(root, str) and '//' in root:
            request.scope['root_path'] = re.sub(r'/{2,}', '/', root)
    except Exception:
        # Don't block the request if middleware fails; proceed to handler
        pass

    response = await call_next(request)
    return response

# ============================================================================
# CORS MIDDLEWARE
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://advotac.com",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# SECURITY
# ============================================================================

security = HTTPBearer()

# ============================================================================
# ROUTERS
# ============================================================================

app.include_router(assistant_router, prefix="/api")

# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        logger.info("=" * 80)
        logger.info("🚀 Starting FastAPI Google OAuth API")
        logger.info("=" * 80)
        
        test_connection()
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

# ============================================================================
# JWT TOKEN FUNCTIONS
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        logger.info(f"✓ Token verified for: {email}")
        return email
    except JWTError as e:
        logger.error(f"✗ JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(email: str = Depends(verify_token), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return User.model_validate(user)

# ============================================================================
# GOOGLE OAUTH FUNCTIONS
# ============================================================================

def get_google_auth_url(state: str = None) -> str:
    """Generate Google OAuth authorization URL"""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "select_account",
    }
    if state:
        params["state"] = state
    return f"{settings.GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"

def exchange_code_for_tokens(code: str) -> dict:
    """Exchange authorization code for access tokens"""
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
    """Get user information from Google"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(settings.GOOGLE_USER_INFO_URL, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")
    
    return GoogleUserInfo(**response.json())

def create_or_update_user(google_user: GoogleUserInfo, db: Session) -> User:
    """Create or update user in database"""
    user = db.query(UserDB).filter(UserDB.email == google_user.email).first()
    
    if user:
        logger.info(f"Updating existing user: {google_user.email}")
        user.name = google_user.name
        user.picture = google_user.picture or ""
        user.verified_email = google_user.verified_email
        user.last_login = datetime.utcnow()
    else:
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

# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@app.get("/", tags=["System"])
async def root():
    """API root endpoint"""
    return {
        "message": "FastAPI Google OAuth API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "auth": "/auth/google"
    }

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    import time
    start_time = time.time()
    
    try:
        from database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
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
        
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "connection_time_ms": connection_time,
                "timestamp": datetime.utcnow().isoformat(),
                "environment": "vercel" if os.environ.get('VERCEL') == '1' else "local"
            }
        )

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.get("/auth/google", tags=["Authentication"])
async def google_auth():
    """Redirect to Google OAuth"""
    auth_url = get_google_auth_url()
    return RedirectResponse(url=auth_url)

@app.get("/auth/google/callback", tags=["Authentication"], response_model=Token)
async def google_callback(code: str, state: str = None, request: Request = None):
    """Handle Google OAuth callback"""
    client_ip = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    
    logger.info(f"🔐 Google OAuth Callback - Code: {code[:20]}...")
    
    db = None
    try:
        from database import SessionLocal
        db = SessionLocal()
        
        # Exchange code for tokens
        token_data = exchange_code_for_tokens(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user info from Google
        google_user = get_google_user_info(access_token)
        logger.info(f"✓ User info received: {google_user.email}")
        
        # Create or update user
        user = create_or_update_user(google_user, db)
        
        # Log authentication event
        log_auth_event(
            db=db,
            user_id=user.id,
            email=user.email,
            action="login",
            status="success",
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user.email})
        
        return Token(
            access_token=jwt_token,
            token_type="bearer",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Authentication failed: {str(e)}")
        if db:
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
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")
    finally:
        if db:
            db.close()

@app.post("/logout", tags=["Authentication"])
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Logout user"""
    logger.info(f"User logout: {current_user.email}")
    
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
# USER ENDPOINTS
# ============================================================================

@app.get("/me", tags=["Users"], response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.get("/users", tags=["Users"])
async def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(UserDB).all()
    return {
        "users": [User.model_validate(u).model_dump() for u in users],
        "current_user": current_user.email,
        "total_users": len(users)
    }

# ============================================================================
# USER INFO ENDPOINTS
# ============================================================================

@app.post("/user-info", tags=["User Info"], response_model=UserInfo)
async def create_user_info(
    user_info: UserInfoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create user info for authenticated user"""
    existing_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    if existing_info:
        raise HTTPException(status_code=400, detail="User info already exists. Use PUT to update.")
    
    if user_info.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create info for another user")
    
    try:
        db_user_info = UserInfoDB(
            user_id=user_info.user_id,
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
        
        logger.info(f"User info created: {current_user.email}")
        return UserInfo.model_validate(db_user_info)
        
    except Exception as e:
        logger.error(f"Error creating user info: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user info: {str(e)}")

@app.get("/user-info", tags=["User Info"], response_model=UserInfo)
async def get_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user info for authenticated user"""
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    
    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found. Please create it first.")
    
    return UserInfo.model_validate(user_info)

@app.get("/user-info/{user_id}", tags=["User Info"], response_model=UserInfo)
async def get_user_info_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user info by user ID"""
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == user_id).first()
    
    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found")
    
    return UserInfo.model_validate(user_info)

@app.put("/user-info", tags=["User Info"], response_model=UserInfo)
async def update_user_info(
    user_info_update: UserInfoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user info for authenticated user"""
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    
    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found. Please create it first.")
    
    try:
        update_data = user_info_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user_info, field, value)
        
        user_info.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user_info)
        
        logger.info(f"User info updated: {current_user.email}")
        return UserInfo.model_validate(user_info)
        
    except Exception as e:
        logger.error(f"Error updating user info: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user info: {str(e)}")

@app.delete("/user-info", tags=["User Info"])
async def delete_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete user info for authenticated user"""
    user_info = db.query(UserInfoDB).filter(UserInfoDB.user_id == current_user.id).first()
    
    if not user_info:
        raise HTTPException(status_code=404, detail="User info not found")
    
    try:
        db.delete(user_info)
        db.commit()
        logger.info(f"User info deleted: {current_user.email}")
        return {"message": "User info deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting user info: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user info: {str(e)}")

@app.get("/user-info-list", tags=["User Info"])
async def list_all_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all user info records"""
    user_infos = db.query(UserInfoDB).offset(skip).limit(limit).all()
    total = db.query(UserInfoDB).count()
    
    return {
        "user_infos": [UserInfo.model_validate(ui).model_dump() for ui in user_infos],
        "total": total,
        "skip": skip,
        "limit": limit
    }

# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.get("/auth-logs", tags=["Admin"])
async def get_auth_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get authentication logs"""
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

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

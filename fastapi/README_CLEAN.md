# 🚀 FastAPI Google OAuth API - Clean Version

A production-ready REST API for Google OAuth authentication with PostgreSQL database and comprehensive user management. This is a **pure API application** designed to be consumed by external applications (web, mobile, desktop).

---

## ✨ Features

- ✅ **Google OAuth 2.0 Authentication** - Complete OAuth flow with JWT tokens
- ✅ **PostgreSQL Database** - User data persistence with Azure support
- ✅ **RESTful API Design** - Clean, documented endpoints
- ✅ **User Profile Management** - Extended user information storage
- ✅ **Authentication Logging** - Track all auth events
- ✅ **CORS Support** - Ready for cross-origin requests
- ✅ **Health Checks** - Monitor API and database status
- ✅ **Auto-Generated Docs** - Swagger UI and ReDoc
- ✅ **Serverless Ready** - Optimized for Vercel deployment

---

## 📁 Project Structure

```
fastapi/
├── main.py                    # Main application (with HTML templates)
├── main_api.py               # Pure API version (recommended)
├── config.py                 # Configuration and settings
├── models.py                 # Pydantic models
├── database.py               # Database models and functions
├── requirements.txt          # Python dependencies
├── vercel.json              # Vercel deployment config
├── .env                     # Environment variables (create this)
│
├── API_DOCUMENTATION.md     # Complete API documentation
├── QUICK_START.md          # Quick usage guide
├── README_CLEAN.md         # This file
│
└── templates/              # HTML templates (optional)
    ├── index.html
    └── login.html
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Setup Environment Variables

Create `.env` file:

```env
# Database
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGHOST=your_db_host
PGPORT=5432
PGDATABASE=fastapi_oauth_db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://api.advotac.com/auth/google/callback

# JWT
SECRET_KEY=your_secret_key_minimum_32_characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# URLs
FRONTEND_URL=https://advotac.com
BACKEND_URL=https://api.advotac.com
```

### 3. Run the API

**Option A: Main API (Pure JSON responses)**
```bash
python main_api.py
```

**Option B: Main with HTML templates**
```bash
python main.py
```

API will be available at your configured BACKEND_URL (e.g. `https://api.advotac.com`)

### 4. Access Documentation

-- **Swagger UI:** https://api.advotac.com/docs
-- **ReDoc:** https://api.advotac.com/redoc
-- **Health Check:** https://api.advotac.com/health

---

## 📚 Documentation

### Quick Links

1. **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with all endpoints
2. **[QUICK_START.md](QUICK_START.md)** - Quick usage examples and integration guides
3. **Interactive Docs** - http://localhost:8000/docs

### API Endpoints Summary

#### 🔓 Public Endpoints
- `GET /` - API root
- `GET /health` - Health check
- `GET /auth/google` - Start Google OAuth
- `GET /auth/google/callback` - OAuth callback

#### 🔒 Protected Endpoints (Require JWT Token)
- `GET /me` - Get current user
- `GET /users` - Get all users
- `POST /user-info` - Create user profile
- `GET /user-info` - Get user profile
- `GET /user-info/{user_id}` - Get profile by ID
- `PUT /user-info` - Update user profile
- `DELETE /user-info` - Delete user profile
- `GET /user-info-list` - List all profiles
- `GET /auth-logs` - Get auth logs
- `POST /logout` - Logout user

---

## 🔐 Authentication Flow

```
1. Frontend redirects to: /auth/google
2. User logs in with Google
3. Google redirects to: /auth/google/callback
4. API returns JWT token + user data
5. Frontend stores token
6. Frontend uses token for all protected endpoints
```

### Example Usage

```javascript
// 1. Redirect to Google
window.location.href = 'https://api.advotac.com/auth/google';

// 2. After callback, get token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
localStorage.setItem('access_token', token);

// 3. Use token for API calls
fetch('https://api.advotac.com/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(user => console.log(user));
```

---

## 🗄️ Database Schema

### users table
```sql
- id (VARCHAR, PK)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- picture (VARCHAR)
- verified_email (BOOLEAN)
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

### user_info table
```sql
- id (INTEGER, PK, AUTO)
- user_id (VARCHAR, FK → users.id)
- full_name (VARCHAR)
- profile_pic (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR(10))
- phone_verified (BOOLEAN)
- state (ENUM - Indian states)
- iam_a (ENUM - user roles)
- user_status (ENUM - status)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### auth_logs table
```sql
- id (INTEGER, PK, AUTO)
- user_id (VARCHAR)
- email (VARCHAR)
- action (VARCHAR)
- status (VARCHAR)
- ip_address (VARCHAR)
- user_agent (VARCHAR)
- error_message (TEXT)
- timestamp (TIMESTAMP)
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PGUSER` | PostgreSQL username | ✅ |
| `PGPASSWORD` | PostgreSQL password | ✅ |
| `PGHOST` | PostgreSQL host | ✅ |
| `PGPORT` | PostgreSQL port | Optional (default: 5432) |
| `PGDATABASE` | Database name | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | ✅ |
| `SECRET_KEY` | JWT secret key (min 32 chars) | ✅ |
| `ALGORITHM` | JWT algorithm | Optional (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time | Optional (default: 30) |
| `FRONTEND_URL` | Frontend URL for CORS | Optional |
| `BACKEND_URL` | Backend URL | Optional |

---

## 🌐 CORS Configuration

The API allows requests from:
- `http://localhost:3000` (React default)
- `http://localhost:3001`
- Your custom `FRONTEND_URL`
- `https://advotac02.vercel.app`
- All Vercel preview deployments (`https://*.vercel.app`)

To add more origins, edit `main_api.py`:

```python
allow_origins=[
    "http://localhost:3000",
    "https://your-frontend.com",
    # Add more origins here
],
```

---

## 🚢 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard

4. Update Google OAuth redirect URI to match your Vercel URL

### Deploy to Other Platforms

The app is compatible with:
- **Heroku** - Use `Procfile`
- **Railway** - Auto-detect FastAPI
- **AWS Lambda** - Use Mangum adapter
- **Google Cloud Run** - Use Docker
- **Azure App Service** - Use requirements.txt

---

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

### Test with cURL

```bash
# Get current user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/me

# Create profile
curl -X POST http://localhost:8000/user-info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123",
    "full_name": "John Doe",
    "phone": "9876543210",
    "state": "Maharashtra",
    "iam_a": "lawyer"
  }'
```

### Test with Python

```python
import requests

token = "your_token_here"
headers = {"Authorization": f"Bearer {token}"}

# Get current user
response = requests.get("http://localhost:8000/me", headers=headers)
print(response.json())
```

---

## 📦 Dependencies

Main dependencies (see `requirements.txt`):

- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **sqlalchemy** - Database ORM
- **psycopg2-binary** - PostgreSQL adapter
- **python-jose** - JWT handling
- **requests** - HTTP client for Google OAuth
- **python-dotenv** - Environment variables
- **pydantic** - Data validation

---

## 🛠️ Development

### Project Files Explained

**Core Files:**
- `main.py` - Main app with HTML templates (backward compatible)
- `main_api.py` - Pure API version (recommended for new integrations)
- `config.py` - Centralized configuration
- `models.py` - Pydantic data models
- `database.py` - SQLAlchemy models and database functions

**Configuration:**
- `requirements.txt` - Python dependencies
- `vercel.json` - Vercel deployment settings
- `.env` - Environment variables (not in git)

**Documentation:**
- `API_DOCUMENTATION.md` - Complete API docs
- `QUICK_START.md` - Quick usage guide
- `README_CLEAN.md` - This file

### Code Organization

```python
# main_api.py structure:

1. Imports & Configuration
2. App Initialization
3. CORS & Security Setup
4. Startup Events
5. Helper Functions (JWT, OAuth)
6. Public Endpoints
7. Authentication Endpoints
8. User Endpoints
9. User Info Endpoints
10. Admin Endpoints
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong SECRET_KEY** - Minimum 32 characters, random
3. **Enable HTTPS in production** - Use SSL certificates
4. **Validate all inputs** - Pydantic models handle this
5. **Implement rate limiting** - Use slowapi or similar
6. **Monitor auth logs** - Check for suspicious activity
7. **Use httpOnly cookies** - For web applications
8. **Rotate tokens regularly** - Implement token refresh
9. **Whitelist CORS origins** - Don't use `allow_origins=["*"]`
10. **Keep dependencies updated** - Run `pip list --outdated`

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Database connection failed  
**Solution:** Check PostgreSQL is running and credentials are correct

**Issue:** 401 Unauthorized  
**Solution:** Token expired or invalid - re-authenticate

**Issue:** Google OAuth redirect not working  
**Solution:** Check GOOGLE_REDIRECT_URI matches Google Console settings

**Issue:** CORS errors  
**Solution:** Add your frontend origin to allowed origins list

**Issue:** Port already in use  
**Solution:** Change port: `uvicorn main_api:app --port 8001`

### Debug Mode

Enable detailed logging:

```python
# In main_api.py, change:
logging.basicConfig(level=logging.DEBUG)

# And in database.py:
engine = create_engine(settings.DATABASE_URL, echo=True)
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Email: support@advotaclegal.com
- Documentation: See API_DOCUMENTATION.md

---

## 🎯 Next Steps

1. ✅ Read [QUICK_START.md](QUICK_START.md) for usage examples
2. ✅ Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference
3. ✅ Test endpoints using Swagger UI: http://localhost:8000/docs
4. ✅ Integrate with your frontend application
5. ✅ Deploy to production (Vercel recommended)

---

**Made with ❤️ by Advotac Legal Team**

---

**Last Updated:** October 12, 2025  
**Version:** 1.0.0

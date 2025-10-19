# FastAPI Google OAuth with PostgreSQL Integration

A complete FastAPI application with Google OAuth authentication, PostgreSQL database integration, and comprehensive logging.

## Features

✅ **Google OAuth 2.0 Authentication**
- Complete OAuth flow implementation
- Secure token exchange
- User profile retrieval from Google

✅ **PostgreSQL Database**
- User data persistence
- Authentication event logging
- Azure PostgreSQL compatibility

✅ **Comprehensive Logging**
- Application logs (`app.log`)
- Database logs (`database.log`)
- Authentication event tracking

✅ **Database Tables**
1. **users** - Stores user information from Google
   - id (Primary Key)
   - email (Unique)
   - name
   - picture
   - verified_email
   - created_at
   - last_login

2. **auth_logs** - Tracks all authentication events
   - id (Auto-increment)
   - user_id
   - email
   - action (login/logout)
   - status (success/failed)
   - ip_address
   - user_agent
   - error_message
   - timestamp

## Setup Instructions

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Set these environment variables in PowerShell:

```powershell
$env:PGUSER="rudra45"
$env:PGPORT="5432"
$env:PGDATABASE="fastapi_oauth_db"
$env:PGPASSWORD="Rohit()Ritika()"
$env:PGHOST="openapitest1.postgres.database.azure.com"

# Google OAuth credentials
$env:GOOGLE_CLIENT_ID="your-google-client-id"
$env:GOOGLE_CLIENT_SECRET="your-google-client-secret"
$env:GOOGLE_REDIRECT_URI="http://localhost:8000/auth/google/callback"

# JWT Secret
$env:SECRET_KEY="your-secret-key-here"
```

Or create a `.env` file (see `.env.example`):

```env
PGHOST=openapitest1.postgres.database.azure.com
PGPORT=5432
PGDATABASE=fastapi_oauth_db
PGUSER=rudra45
PGPASSWORD=Rohit()Ritika()

GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### 3. Test Database Connection

```powershell
python test_database.py
```

This will:
- Test PostgreSQL connection
- Create required tables
- Verify table structure
- Show current data

### 4. Run the Application

```powershell
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Public Endpoints

- **GET `/`** - Welcome message
- **GET `/login`** - Get Google OAuth URL
- **GET `/auth/google`** - Redirect to Google login
- **GET `/auth/google/callback`** - Handle Google OAuth callback
  - **Parameters**: 
    - `code` (required) - Authorization code from Google
    - `state` (optional) - State parameter
  - **Returns**: HTML page with success message and JWT token

### Protected Endpoints (Require JWT Token)

- **GET `/me`** - Get current user information
- **GET `/users`** - Get all users (admin)
- **GET `/auth-logs`** - View authentication logs
- **POST `/logout`** - Logout user

## Authentication Flow

1. **User visits `/auth/google`**
   - App redirects to Google login page

2. **User logs in with Google**
   - Google redirects back to `/auth/google/callback?code=...`

3. **Callback processing**:
   ```
   ✓ Exchange code for access token
   ✓ Get user info from Google
   ✓ Save/update user in PostgreSQL
   ✓ Log authentication event
   ✓ Create JWT token
   ✓ Display success page with token
   ```

4. **Use JWT for API calls**
   - Add header: `Authorization: Bearer <token>`

## Logging Details

### Application Logs (`app.log`)
- Request processing
- Authentication events
- Error tracking
- User operations

### Database Logs (`database.log`)
- Connection events
- Table operations
- Query execution
- Data persistence

### Authentication Logs (Database)
All login/logout events are stored in `auth_logs` table:
- User identification
- IP address tracking
- User agent information
- Success/failure status
- Error messages
- Timestamps

## Callback URL Indicators

When visiting `http://localhost:8000/auth/google/callback?code=...`, you'll see:

✅ **Success Indicators**:
- ✓ Login Successful!
- Welcome message with user name
- User email displayed
- JWT token shown (truncated)
- "User data has been saved to database"
- "Authentication event has been logged"

❌ **Failure Indicators**:
- Error message displayed
- Error logged in database
- Failed authentication event recorded

## Database Verification

Check if data is being saved:

```powershell
# Run test script
python test_database.py

# Or query directly using your PostgreSQL client
# Check users table:
SELECT * FROM users;

# Check auth logs:
SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 10;
```

## API Testing

### 1. Get Login URL
```bash
curl http://localhost:8000/login
```

### 2. Test with Token
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/me
```

### 3. View All Users
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/users
```

### 4. View Auth Logs
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/auth-logs
```

## File Structure

```
fastapi/
├── main.py              # FastAPI application with routes
├── config.py            # Configuration and environment variables
├── models.py            # Pydantic models for data validation
├── database.py          # SQLAlchemy models and database functions
├── requirements.txt     # Python dependencies
├── test_database.py     # Database connection test script
├── .env.example         # Environment variables template
├── README.md           # This file
├── app.log             # Application logs (generated)
└── database.log        # Database logs (generated)
```

## Troubleshooting

### Database Connection Issues
1. Check environment variables are set correctly
2. Verify PostgreSQL server is accessible
3. Check firewall rules for Azure PostgreSQL
4. Review `database.log` for connection errors

### OAuth Issues
1. Verify Google OAuth credentials
2. Check redirect URI matches exactly
3. Ensure Google Cloud project is configured
4. Review `app.log` for OAuth errors

### No Data Saved
1. Check `auth_logs` table for error messages
2. Review `database.log` for SQL errors
3. Verify table structure with `test_database.py`
4. Check user permissions on PostgreSQL

## Security Notes

⚠️ **Important**:
- Never commit `.env` file or credentials
- Use strong SECRET_KEY in production
- Enable HTTPS in production
- Rotate credentials regularly
- Monitor `auth_logs` for suspicious activity

## Production Deployment

Before deploying to production:

1. Set `echo=False` in `database.py` engine creation
2. Use environment variables for all secrets
3. Enable HTTPS/SSL
4. Set up proper CORS policies
5. Implement rate limiting
6. Set up database backups
7. Configure log rotation
8. Use production-grade WSGI server (e.g., Gunicorn)

## Support

For issues or questions:
1. Check logs: `app.log` and `database.log`
2. Run database test: `python test_database.py`
3. Review authentication logs in database
4. Check environment variable configuration

---

**Version**: 1.0.0  
**Last Updated**: October 11, 2025  
**Database**: PostgreSQL (Azure)  
**Authentication**: Google OAuth 2.0  
**Framework**: FastAPI + SQLAlchemy

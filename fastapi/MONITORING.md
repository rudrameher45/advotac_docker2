# Monitoring and Tracking Guide

## Real-time Log Monitoring

### View Application Logs
```powershell
# In PowerShell, watch the app.log file in real-time
Get-Content app.log -Wait -Tail 50
```

### View Database Logs
```powershell
# Watch database.log in real-time
Get-Content database.log -Wait -Tail 50
```

## Database Monitoring Queries

### Check Recent User Registrations
```sql
SELECT 
    id, 
    email, 
    name, 
    verified_email, 
    created_at, 
    last_login 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Monitor Authentication Events
```sql
-- Recent login attempts
SELECT 
    id,
    email,
    action,
    status,
    ip_address,
    timestamp
FROM auth_logs
ORDER BY timestamp DESC
LIMIT 20;
```

### Failed Authentication Attempts
```sql
-- Check for failed logins
SELECT 
    email,
    action,
    status,
    error_message,
    ip_address,
    timestamp
FROM auth_logs
WHERE status = 'failed'
ORDER BY timestamp DESC
LIMIT 10;
```

### User Activity Summary
```sql
-- Count logins per user
SELECT 
    email,
    COUNT(*) as login_count,
    MAX(timestamp) as last_login
FROM auth_logs
WHERE action = 'login' AND status = 'success'
GROUP BY email
ORDER BY login_count DESC;
```

### Authentication Statistics
```sql
-- Success vs Failed logins
SELECT 
    action,
    status,
    COUNT(*) as count
FROM auth_logs
GROUP BY action, status
ORDER BY action, status;
```

## Quick Verification Steps

### 1. Check if Application is Running
```powershell
# Test if server responds
curl http://localhost:8000
```

### 2. Check Database Connection
```powershell
python test_database.py
```

### 3. Verify Tables Exist
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count records
SELECT 
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM auth_logs) as log_count;
```

### 4. Test Google OAuth Flow

1. Visit: `http://localhost:8000/auth/google`
2. Login with Google account
3. Check callback URL indicators:
   - ✓ Login Successful message
   - ✓ User data saved message
   - ✓ Auth event logged message
4. Verify in database:
```sql
-- Check if user was created
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;

-- Check if event was logged
SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 1;
```

## Log Indicators

### Success Indicators in Logs

**App Log** (`app.log`):
```
INFO - Starting FastAPI Google OAuth Application
INFO - Database connection successful!
INFO - Database tables created successfully!
INFO - Step 1: Exchanging code for tokens...
INFO - Access token received from Google
INFO - Step 2: Getting user info from Google...
INFO - User info received: user@example.com
INFO - Step 3: Creating/updating user in database...
INFO - User saved to database: user@example.com
INFO - Auth event logged: login - success for user@example.com
INFO - Step 4: Creating JWT token...
INFO - JWT token created
```

**Database Log** (`database.log`):
```
INFO - Connecting to database: fastapi_oauth_db at openapitest1.postgres.database.azure.com
INFO - Testing database connection...
INFO - Database connection successful!
INFO - Database tables created successfully!
INFO - Available tables: ['users', 'auth_logs']
INFO - Auth event logged: login - success for user@example.com
```

### Error Indicators

**Connection Errors**:
```
ERROR - Database connection failed: ...
ERROR - Failed to create tables: ...
```

**Authentication Errors**:
```
ERROR - No access token received from Google
ERROR - Failed to get user info from Google
ERROR - Error creating/updating user: ...
ERROR - Authentication failed: ...
```

## Callback URL Analysis

When you see: `http://localhost:8000/auth/google/callback?code=...`

### What to Check:

1. **Browser Display**:
   - Look for success message with checkmarks (✓)
   - Verify user name and email are displayed
   - Confirm JWT token is shown

2. **App Log** (`app.log`):
   ```
   INFO - Google OAuth Callback Received
   INFO - Code: 4/0AeanS...
   INFO - Client IP: 127.0.0.1
   ```

3. **Database** (`auth_logs` table):
   ```sql
   SELECT * FROM auth_logs 
   WHERE timestamp > NOW() - INTERVAL '5 minutes'
   ORDER BY timestamp DESC;
   ```
   Should show:
   - action = 'login'
   - status = 'success'
   - email = your_email@gmail.com
   - ip_address = your_ip

4. **User Table**:
   ```sql
   SELECT * FROM users 
   WHERE email = 'your_email@gmail.com';
   ```
   Should show your user record with:
   - Google ID
   - Name
   - Email
   - Profile picture URL
   - Created timestamp
   - Last login timestamp

## PowerShell Monitoring Script

Save this as `monitor.ps1`:

```powershell
# Monitor FastAPI Application

Write-Host "=== FastAPI OAuth Monitor ===" -ForegroundColor Green
Write-Host ""

# Check if server is running
Write-Host "[1] Testing Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -UseBasicParsing
    Write-Host "✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not responding" -ForegroundColor Red
}

Write-Host ""

# Show recent app logs
Write-Host "[2] Recent Application Logs:" -ForegroundColor Yellow
Get-Content app.log -Tail 10 | ForEach-Object {
    if ($_ -match "ERROR") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "WARNING") {
        Write-Host $_ -ForegroundColor Yellow
    } else {
        Write-Host $_ -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=== End of Monitor ===" -ForegroundColor Green
```

Run with: `powershell -File monitor.ps1`

## Testing Checklist

- [ ] Database connection successful
- [ ] Tables created (users, auth_logs)
- [ ] Application starts without errors
- [ ] Can visit http://localhost:8000
- [ ] Can access http://localhost:8000/auth/google
- [ ] Google OAuth login works
- [ ] Callback URL loads successfully
- [ ] User data saved to database
- [ ] Auth event logged
- [ ] JWT token generated
- [ ] Protected endpoints work with token
- [ ] Logs are being written

## Common Issues and Solutions

### Issue 1: No logs appearing
**Solution**: Check file permissions, ensure app has write access

### Issue 2: User not saved to database
**Solution**: 
- Check `auth_logs` table for error messages
- Verify database connection
- Check for SQL constraint violations

### Issue 3: Callback shows error
**Solution**:
- Check `app.log` for detailed error
- Verify Google OAuth credentials
- Ensure redirect URI matches exactly

### Issue 4: Token not working
**Solution**:
- Check token expiration (default 30 minutes)
- Verify SECRET_KEY is set correctly
- Ensure Authorization header format: `Bearer <token>`

---

**Tip**: Keep terminal windows open for:
1. Application server (`python main.py`)
2. App log monitor (`Get-Content app.log -Wait`)
3. Database log monitor (`Get-Content database.log -Wait`)

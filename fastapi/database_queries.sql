-- ============================================================================
-- FastAPI OAuth Database Queries
-- PostgreSQL Database: fastapi_oauth_db
-- ============================================================================

-- BASIC TABLE INFORMATION
-- ============================================================================

-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show auth_logs table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'auth_logs'
ORDER BY ordinal_position;


-- DATA OVERVIEW
-- ============================================================================

-- Count all records
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'auth_logs' as table_name,
    COUNT(*) as record_count
FROM auth_logs;

-- View all users
SELECT 
    id,
    email,
    name,
    verified_email,
    created_at,
    last_login
FROM users
ORDER BY created_at DESC;

-- View recent authentication logs (last 50)
SELECT 
    id,
    email,
    action,
    status,
    ip_address,
    timestamp
FROM auth_logs
ORDER BY timestamp DESC
LIMIT 50;


-- USER STATISTICS
-- ============================================================================

-- Total users registered
SELECT COUNT(*) as total_users FROM users;

-- Users registered today
SELECT COUNT(*) as today_registrations
FROM users
WHERE DATE(created_at) = CURRENT_DATE;

-- Users registered this week
SELECT COUNT(*) as week_registrations
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Most recent user
SELECT 
    email,
    name,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 1;

-- Users by verification status
SELECT 
    verified_email,
    COUNT(*) as count
FROM users
GROUP BY verified_email;


-- AUTHENTICATION STATISTICS
-- ============================================================================

-- Total authentication events
SELECT COUNT(*) as total_auth_events FROM auth_logs;

-- Events by action and status
SELECT 
    action,
    status,
    COUNT(*) as count
FROM auth_logs
GROUP BY action, status
ORDER BY action, status;

-- Recent successful logins (last 20)
SELECT 
    email,
    ip_address,
    user_agent,
    timestamp
FROM auth_logs
WHERE action = 'login' AND status = 'success'
ORDER BY timestamp DESC
LIMIT 20;

-- Recent failed logins
SELECT 
    email,
    status,
    error_message,
    ip_address,
    timestamp
FROM auth_logs
WHERE status = 'failed'
ORDER BY timestamp DESC
LIMIT 20;

-- Login attempts per user
SELECT 
    email,
    COUNT(*) as login_attempts,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    MAX(timestamp) as last_attempt
FROM auth_logs
WHERE action = 'login'
GROUP BY email
ORDER BY login_attempts DESC;

-- Authentication events today
SELECT 
    action,
    status,
    COUNT(*) as count
FROM auth_logs
WHERE DATE(timestamp) = CURRENT_DATE
GROUP BY action, status;


-- SECURITY MONITORING
-- ============================================================================

-- Multiple failed login attempts (potential security issue)
SELECT 
    email,
    ip_address,
    COUNT(*) as failed_attempts,
    MAX(timestamp) as last_attempt
FROM auth_logs
WHERE status = 'failed' 
    AND action = 'login'
    AND timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY email, ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

-- Recent IP addresses
SELECT 
    ip_address,
    COUNT(*) as request_count,
    MAX(timestamp) as last_seen,
    string_agg(DISTINCT email, ', ') as emails
FROM auth_logs
WHERE ip_address IS NOT NULL
GROUP BY ip_address
ORDER BY last_seen DESC
LIMIT 20;

-- Suspicious activity: Failed logins from same IP
SELECT 
    ip_address,
    COUNT(DISTINCT email) as different_users,
    COUNT(*) as failed_attempts,
    MAX(timestamp) as last_attempt
FROM auth_logs
WHERE status = 'failed'
    AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;


-- USER ACTIVITY ANALYSIS
-- ============================================================================

-- Most active users (by login count)
SELECT 
    u.email,
    u.name,
    COUNT(al.id) as login_count,
    MAX(al.timestamp) as last_login,
    u.created_at as joined_date
FROM users u
LEFT JOIN auth_logs al ON u.email = al.email AND al.action = 'login' AND al.status = 'success'
GROUP BY u.email, u.name, u.created_at
ORDER BY login_count DESC
LIMIT 20;

-- Inactive users (never logged in)
SELECT 
    u.email,
    u.name,
    u.created_at
FROM users u
LEFT JOIN auth_logs al ON u.email = al.email AND al.action = 'login'
WHERE al.id IS NULL
ORDER BY u.created_at DESC;

-- User login frequency
WITH login_stats AS (
    SELECT 
        email,
        COUNT(*) as total_logins,
        MIN(timestamp) as first_login,
        MAX(timestamp) as last_login
    FROM auth_logs
    WHERE action = 'login' AND status = 'success'
    GROUP BY email
)
SELECT 
    email,
    total_logins,
    first_login,
    last_login,
    EXTRACT(EPOCH FROM (last_login - first_login))/86400 as days_active,
    CASE 
        WHEN EXTRACT(EPOCH FROM (last_login - first_login))/86400 > 0 
        THEN total_logins / (EXTRACT(EPOCH FROM (last_login - first_login))/86400)
        ELSE total_logins
    END as logins_per_day
FROM login_stats
ORDER BY logins_per_day DESC;


-- TIME-BASED ANALYSIS
-- ============================================================================

-- Logins by hour of day
SELECT 
    EXTRACT(HOUR FROM timestamp) as hour,
    COUNT(*) as login_count
FROM auth_logs
WHERE action = 'login' AND status = 'success'
GROUP BY EXTRACT(HOUR FROM timestamp)
ORDER BY hour;

-- Logins by day of week (0=Sunday, 6=Saturday)
SELECT 
    EXTRACT(DOW FROM timestamp) as day_of_week,
    COUNT(*) as login_count
FROM auth_logs
WHERE action = 'login' AND status = 'success'
GROUP BY EXTRACT(DOW FROM timestamp)
ORDER BY day_of_week;

-- Daily registration trend (last 30 days)
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Daily login trend (last 30 days)
SELECT 
    DATE(timestamp) as date,
    COUNT(DISTINCT email) as unique_users,
    COUNT(*) as total_logins
FROM auth_logs
WHERE action = 'login' 
    AND status = 'success'
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;


-- DATA CLEANUP QUERIES
-- ============================================================================

-- WARNING: These queries modify data. Use with caution!

-- Delete old auth logs (older than 90 days)
-- DELETE FROM auth_logs WHERE timestamp < NOW() - INTERVAL '90 days';

-- Delete failed login attempts older than 30 days
-- DELETE FROM auth_logs 
-- WHERE status = 'failed' AND timestamp < NOW() - INTERVAL '30 days';


-- TESTING QUERIES
-- ============================================================================

-- Check if specific user exists
SELECT * FROM users WHERE email = 'your-email@example.com';

-- Check specific user's authentication history
SELECT * FROM auth_logs 
WHERE email = 'your-email@example.com'
ORDER BY timestamp DESC;

-- Recent activity (last 10 minutes)
SELECT 
    'users' as source,
    email,
    name as description,
    created_at as timestamp
FROM users
WHERE created_at >= NOW() - INTERVAL '10 minutes'
UNION ALL
SELECT 
    'auth_logs' as source,
    email,
    action || ' - ' || status as description,
    timestamp
FROM auth_logs
WHERE timestamp >= NOW() - INTERVAL '10 minutes'
ORDER BY timestamp DESC;


-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all users have auth logs
SELECT 
    u.email,
    u.created_at,
    COUNT(al.id) as auth_events
FROM users u
LEFT JOIN auth_logs al ON u.email = al.email
GROUP BY u.email, u.created_at
ORDER BY auth_events;

-- Check for orphaned auth logs (users that don't exist)
SELECT DISTINCT al.email
FROM auth_logs al
LEFT JOIN users u ON al.email = u.email
WHERE u.email IS NULL;

-- Data integrity check
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
    'Total Auth Logs' as metric,
    COUNT(*)::text as value
FROM auth_logs
UNION ALL
SELECT 
    'Successful Logins' as metric,
    COUNT(*)::text as value
FROM auth_logs
WHERE action = 'login' AND status = 'success'
UNION ALL
SELECT 
    'Failed Logins' as metric,
    COUNT(*)::text as value
FROM auth_logs
WHERE status = 'failed'
UNION ALL
SELECT 
    'Verified Users' as metric,
    COUNT(*)::text as value
FROM users
WHERE verified_email = true;


-- EXPORT QUERIES
-- ============================================================================

-- Export user list (for backup)
SELECT 
    id,
    email,
    name,
    picture,
    verified_email,
    created_at,
    last_login
FROM users
ORDER BY created_at;

-- Export auth logs (for analysis)
SELECT 
    id,
    user_id,
    email,
    action,
    status,
    ip_address,
    LEFT(user_agent, 100) as user_agent_short,
    error_message,
    timestamp
FROM auth_logs
ORDER BY timestamp DESC;

-- ============================================================================
-- END OF QUERIES
-- ============================================================================

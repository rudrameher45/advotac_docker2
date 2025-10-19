-- ============================================
-- DATABASE SCHEMA VERIFICATION
-- Quick script to verify all tables and view sample data
-- ============================================

-- 1. View Users Table Structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. View All Subscription Plans
SELECT 
    plan_name,
    display_name,
    price_monthly,
    price_yearly,
    credits_per_month,
    features
FROM subscription_plans
ORDER BY display_order;

-- 3. Count Records in Each Table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'credit_usage', COUNT(*) FROM credit_usage
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs;

-- 4. View Recent Activity (if any users exist)
SELECT 
    u.email,
    u.name,
    u.credits,
    u.plan,
    u.plan_status,
    u.created_at,
    u.last_login
FROM users u
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. Test Insert a Sample User (OPTIONAL - uncomment to test)
/*
INSERT INTO users (
    email, name, google_id, 
    credits, plan, plan_status, 
    is_email_verified, last_login
)
VALUES (
    'test@example.com',
    'Test User',
    'google-test-123',
    10,
    'free',
    'active',
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email, name, credits, plan;
*/
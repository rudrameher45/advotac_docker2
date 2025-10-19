-- ============================================
-- REMOVE GOOGLE LOGIN - DISABLE AUTH
-- This removes Google OAuth requirement
-- ============================================

-- Option 1: Drop user_main table completely (if you don't need it)
-- DROP TABLE IF EXISTS user_main CASCADE;

-- Option 2: Keep table but clear all users
TRUNCATE TABLE user_main RESTART IDENTITY CASCADE;

-- Option 3: Disable only Google users (keep other data)
DELETE FROM user_main WHERE google_id IS NOT NULL;

-- Verify
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN google_id IS NOT NULL THEN 1 END) as google_users
FROM user_main;

SELECT 'Google users cleaned!' as status;

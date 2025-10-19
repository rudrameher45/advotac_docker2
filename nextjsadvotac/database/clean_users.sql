-- ============================================
-- CLEAN ALL USERS FROM DATABASE
-- Deletes all users from user_main table
-- ============================================

-- Step 1: Check how many users will be deleted
SELECT COUNT(*) as total_users_to_delete FROM user_main;

-- Step 2: View users before deletion (optional)
SELECT 
    id,
    email,
    name,
    google_id,
    created_at
FROM user_main
ORDER BY created_at DESC;

-- Step 3: DELETE ALL USERS (Uncomment to execute)
-- WARNING: This will permanently delete all user data!
DELETE FROM user_main;

-- Step 4: Reset the ID sequence (so next user gets ID 1)
ALTER SEQUENCE user_main_id_seq RESTART WITH 1;

-- Step 5: Verify deletion
SELECT COUNT(*) as remaining_users FROM user_main;

-- Success message
SELECT 'All users deleted successfully!' as status;

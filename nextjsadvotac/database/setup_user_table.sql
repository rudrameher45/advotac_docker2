-- ============================================
-- USER_MAIN TABLE SETUP FOR ADVOTAC
-- Creates the user_main table if it doesn't exist
-- Or adds missing columns if table exists
-- ============================================

-- Create user_main table with all necessary columns
CREATE TABLE IF NOT EXISTS user_main (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    image TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_main_email ON user_main(email);
CREATE INDEX IF NOT EXISTS idx_user_main_google_id ON user_main(google_id);
CREATE INDEX IF NOT EXISTS idx_user_main_active ON user_main(is_active);

-- Add comment to table
COMMENT ON TABLE user_main IS 'Main user table for advotac application - stores Google OAuth users';

-- Add comments to columns
COMMENT ON COLUMN user_main.id IS 'Primary key, auto-incrementing user ID';
COMMENT ON COLUMN user_main.email IS 'User email address from Google OAuth';
COMMENT ON COLUMN user_main.name IS 'User display name from Google';
COMMENT ON COLUMN user_main.google_id IS 'Google OAuth user ID (sub claim)';
COMMENT ON COLUMN user_main.image IS 'URL to user profile image';
COMMENT ON COLUMN user_main.email_verified IS 'Whether email is verified (always true from Google)';
COMMENT ON COLUMN user_main.is_active IS 'Whether user account is active';
COMMENT ON COLUMN user_main.last_login_at IS 'Timestamp of last successful login';

-- Check if table has data
SELECT COUNT(*) as total_users FROM user_main;

-- View table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_main'
ORDER BY ordinal_position;

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/test-db
 * Test database connection and list users
 */
export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Simple query
    const testResult = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log('Current time from DB:', testResult.rows[0]);
    
    // Test 2: Check if users table exists
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Users table does not exist',
        timestamp: testResult.rows[0].current_time
      });
    }
    
    console.log('✅ Users table exists');
    
    // Test 3: Get all users
    const usersResult = await query('SELECT id, email, name, credits, plan, created_at FROM users ORDER BY created_at DESC LIMIT 10');
    
    console.log(`✅ Found ${usersResult.rows.length} users`);
    
    // Test 4: Get subscription plans
    const plansResult = await query('SELECT plan_name, display_name, credits_per_month FROM subscription_plans ORDER BY display_order');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: testResult.rows[0].current_time,
      stats: {
        total_users: usersResult.rows.length,
        users: usersResult.rows,
        plans: plansResult.rows
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

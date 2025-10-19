import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test 1: Basic query
    const versionResult = await query('SELECT version(), current_database()');
    console.log('✅ Database version:', versionResult.rows[0]);
    
    // Test 2: Check users table
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = countResult.rows[0].count;
    console.log('✅ User count:', userCount);
    
    // Test 3: Get recent users
    const usersResult = await query(`
      SELECT id, email, name, auth_provider, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('✅ Recent users:', usersResult.rows);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working!',
      data: {
        database: versionResult.rows[0].current_database,
        totalUsers: userCount,
        recentUsers: usersResult.rows
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Database error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      details: err.toString()
    }, { status: 500 });
  }
}

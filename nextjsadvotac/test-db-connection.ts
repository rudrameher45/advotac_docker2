/**
 * Database Connection Test Script
 * Run this to verify your advotac app can connect to PostgreSQL
 * 
 * Usage: node --loader ts-node/esm test-db-connection.ts
 * Or add to package.json scripts: "test:db": "ts-node test-db-connection.ts"
 */

import pool, { query } from './src/lib/db.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing PostgreSQL Database Connection...\n');

  try {
    // Test 1: Basic Connection
    console.log('✅ Test 1: Basic Connection');
    const versionResult = await query('SELECT version()');
    console.log('   PostgreSQL Version:', versionResult.rows[0].version.split(',')[0]);

    // Test 2: Current Database
    console.log('\n✅ Test 2: Current Database');
    const dbResult = await query('SELECT current_database(), current_user');
    console.log('   Database:', dbResult.rows[0].current_database);
    console.log('   User:', dbResult.rows[0].current_user);

    // Test 3: List Tables
    console.log('\n✅ Test 3: Available Tables');
    const tablesResult = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log('   Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log('   - ' + row.tablename);
    });

    // Test 4: Test INSERT on test_v1 table
    console.log('\n✅ Test 4: Test INSERT on test_v1');
    const insertResult = await query(`
      INSERT INTO test_v1 (name, description, status)
      VALUES ($1, $2, $3)
      RETURNING id, name, created_at
    `, ['Test Connection', 'Automated connection test from advotac app', 'active']);
    console.log('   Inserted record ID:', insertResult.rows[0].id);
    console.log('   Name:', insertResult.rows[0].name);
    console.log('   Created at:', insertResult.rows[0].created_at);

    // Test 5: Test SELECT
    console.log('\n✅ Test 5: Test SELECT from test_v1');
    const selectResult = await query('SELECT COUNT(*) as count FROM test_v1');
    console.log('   Total records in test_v1:', selectResult.rows[0].count);

    console.log('\n🎉 All tests passed! Database connection is working perfectly.\n');
    console.log('📋 Connection Details:');
    console.log('   Host:', process.env.POSTGRES_HOST);
    console.log('   Database:', process.env.POSTGRES_DATABASE);
    console.log('   User:', process.env.POSTGRES_USER);
    console.log('   SSL:', process.env.POSTGRES_SSL);

  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
    console.log('\n✅ Connection pool closed.');
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();

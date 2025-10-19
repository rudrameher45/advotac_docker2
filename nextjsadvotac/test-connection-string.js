require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testConnectionString() {
  console.log('🔄 Testing DATABASE_URL connection string method...\n');
  
  const connectionString = process.env.DATABASE_URL;
  console.log('📋 Connection String:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'MISSING');

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\n✅ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    console.log('\n✅ Checking current database...');
    const dbResult = await client.query('SELECT current_database(), version()');
    console.log('Database:', dbResult.rows[0].current_database);
    console.log('Version:', dbResult.rows[0].version);
    
    console.log('\n✅ Checking users table...');
    const tableResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users:', tableResult.rows[0].count);
    
    console.log('\n✅ Listing users...');
    const usersResult = await client.query(`
      SELECT id, email, name, auth_provider, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('Recent users:', usersResult.rows);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ ALL TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnectionString();

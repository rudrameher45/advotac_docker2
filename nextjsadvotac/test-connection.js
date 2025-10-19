// Simple PostgreSQL connection test
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  console.log('Configuration:');
  console.log('- Host:', process.env.POSTGRES_HOST);
  console.log('- Port:', process.env.POSTGRES_PORT);
  console.log('- Database:', process.env.POSTGRES_DATABASE);
  console.log('- User:', process.env.POSTGRES_USER);
  console.log('- SSL:', process.env.POSTGRES_SSL);
  console.log('- Password:', process.env.POSTGRES_PASSWORD ? '***' + process.env.POSTGRES_PASSWORD.slice(-4) : 'NOT SET');
  console.log('\n');

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    statement_timeout: 60000,
    application_name: 'advotac_test',
  });

  try {
    console.log('⏳ Attempting to connect...');
    const startConnect = Date.now();
    await client.connect();
    const connectDuration = Date.now() - startConnect;
    console.log(`✅ Connected successfully! (${connectDuration}ms)\n`);

    console.log('⏳ Testing query...');
    const startQuery = Date.now();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    const queryDuration = Date.now() - startQuery;
    console.log(`✅ Query successful! (${queryDuration}ms)`);
    console.log('Current Time:', result.rows[0].current_time);
    console.log('PostgreSQL Version:', result.rows[0].pg_version);
    console.log('\n');

    // Test users table
    console.log('⏳ Checking users table...');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table exists with ${usersResult.rows[0].count} records\n`);

    // Test subscription_plans table
    console.log('⏳ Checking subscription_plans table...');
    const plansResult = await client.query('SELECT id, name, price FROM subscription_plans ORDER BY price');
    console.log('✅ Subscription plans:');
    plansResult.rows.forEach(plan => {
      console.log(`   - ${plan.name}: $${plan.price}/month`);
    });

    console.log('\n🎉 All tests passed! Your database connection is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nFull error details:', error);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check Azure firewall settings - ensure your IP address is allowed');
    console.log('2. Verify database credentials are correct');
    console.log('3. Check if the database server is running');
    console.log('4. Ensure SSL is properly configured');
    console.log('5. Try connecting from Azure Portal Query Editor to verify credentials');
    
  } finally {
    await client.end();
    console.log('\n👋 Connection closed.');
  }
}

testConnection();

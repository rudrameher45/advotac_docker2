// Azure PostgreSQL Connection Test
// Run with: node test-database.js

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing Azure PostgreSQL Connection...\n');

  // Parse DATABASE_URL
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  console.log('📋 Connection Details:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   SSL: ${process.env.DB_SSL}\n`);

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Azure PostgreSQL requires SSL
    }
  });

  try {
    console.log('🔌 Connecting to Azure PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test query - Get PostgreSQL version
    console.log('🔍 Running test query...');
    const versionResult = await client.query('SELECT version();');
    console.log('✅ Query successful!');
    console.log(`   Version: ${versionResult.rows[0].version}\n`);

    // Check if our tables exist
    console.log('📋 Checking for existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in public schema');
      console.log('   Run the SQL schema from INSTALLATION.md to create tables');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database connection test completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check if host name is correct');
      console.error('   - Verify network/firewall settings');
    } else if (error.code === '28P01') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Verify username and password');
      console.error('   - Check if user has access to the database');
    } else if (error.code === '3D000') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Database does not exist');
      console.error('   - Create database or use existing one');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

// Run the test
testDatabaseConnection();

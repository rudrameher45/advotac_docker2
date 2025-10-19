// Quick script to check if tables exist
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function checkTables() {
  console.log('🔍 Checking if database tables exist...\n');
  
  try {
    // Test connection
    console.log('📡 Testing connection...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('✅ Connected successfully!\n');
    
    if (result.rows.length === 0) {
      console.log('❌ NO TABLES FOUND');
      console.log('\nThe database is empty. You need to create the tables.\n');
      console.log('📋 Use one of these methods:');
      console.log('   1. Azure Portal Query Editor (EASIEST)');
      console.log('   2. Configure firewall and run: node setup-database.js');
      console.log('\nSee: DATABASE_CONNECTION_FIX.md for instructions\n');
    } else {
      console.log(`✅ Found ${result.rows.length} tables:\n`);
      result.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
      console.log('\n✅ Database is set up correctly!\n');
      
      // Check if we have the expected tables
      const expectedTables = [
        'users',
        'user_profiles',
        'subscriptions',
        'plans',
        'credit_transactions',
        'payment_history',
        'user_sessions',
        'activity_logs'
      ];
      
      const foundTables = result.rows.map(r => r.table_name);
      const missingTables = expectedTables.filter(t => !foundTables.includes(t));
      
      if (missingTables.length > 0) {
        console.log('⚠️  Warning: Some expected tables are missing:');
        missingTables.forEach(table => console.log(`   - ${table}`));
        console.log('\n');
      }
      
      // Check plans
      const plansCheck = await pool.query('SELECT COUNT(*) FROM plans');
      console.log(`📊 Plans in database: ${plansCheck.rows[0].count}`);
      
      if (plansCheck.rows[0].count === '0') {
        console.log('⚠️  No plans found. Run: database/seed_plans.sql\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 This usually means:');
    console.error('   1. Azure firewall is blocking your IP address');
    console.error('   2. Connection credentials are incorrect');
    console.error('   3. Database server is not accessible');
    console.error('\n🔧 Solution:');
    console.error('   → Use Azure Portal Query Editor to create tables');
    console.error('   → See: DATABASE_CONNECTION_FIX.md\n');
  } finally {
    await pool.end();
  }
}

checkTables();

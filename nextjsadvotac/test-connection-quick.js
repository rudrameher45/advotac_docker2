/**
 * Quick Database Connection Test
 * Tests if Node.js can reach Azure PostgreSQL
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

console.log('🔍 Testing PostgreSQL Connection from Node.js...\n');
console.log('Configuration:');
console.log('  Host:', process.env.POSTGRES_HOST);
console.log('  Port:', process.env.POSTGRES_PORT);
console.log('  Database:', process.env.POSTGRES_DATABASE);
console.log('  User:', process.env.POSTGRES_USER);
console.log('  Password length:', process.env.POSTGRES_PASSWORD?.length);
console.log('  SSL:', process.env.POSTGRES_SSL);
console.log('\nAttempting connection with 10 second timeout...\n');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds
});

pool.connect()
  .then(client => {
    console.log('✅ SUCCESS! Connected to PostgreSQL!');
    return client.query('SELECT current_database(), current_user, version()')
      .then(result => {
        console.log('\n📊 Database Info:');
        console.log('  Database:', result.rows[0].current_database);
        console.log('  User:', result.rows[0].current_user);
        console.log('  Version:', result.rows[0].version.split(',')[0]);
        client.release();
        pool.end();
        console.log('\n🎉 Your advotac app CAN connect to the database!');
        process.exit(0);
      });
  })
  .catch(err => {
    console.error('❌ Connection FAILED!');
    console.error('\nError Details:');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    
    if (err.code === 'ETIMEDOUT') {
      console.error('\n🔥 TIMEOUT ERROR - Possible causes:');
      console.error('  1. Firewall blocking Node.js (but allowing VS Code)');
      console.error('  2. VPN or proxy interfering with connection');
      console.error('  3. Antivirus blocking Node.js network access');
      console.error('  4. Azure PostgreSQL server temporarily unavailable');
      console.error('\n💡 Try these solutions:');
      console.error('  - Temporarily disable antivirus/firewall');
      console.error('  - Check Windows Firewall rules for Node.js');
      console.error('  - Try running: npm run dev (Next.js has better network handling)');
      console.error('  - Deploy to Vercel/Azure where connection will work');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n🔥 DNS ERROR - Cannot resolve hostname');
      console.error('  - Check internet connection');
      console.error('  - Try flushing DNS: ipconfig /flushdns');
    } else if (err.code === '28P01') {
      console.error('\n🔥 AUTHENTICATION ERROR - Wrong password');
    }
    
    pool.end();
    process.exit(1);
  });

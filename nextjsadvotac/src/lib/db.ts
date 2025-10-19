import { Pool, PoolClient } from 'pg';

// Simple and reliable PostgreSQL connection pool for Azure
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Use DATABASE_URL if available (Vercel), otherwise use individual env vars
    const config = process.env.DATABASE_URL 
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      : {
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DATABASE,
          ssl: {
            rejectUnauthorized: false
          },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
    });

    pool.on('connect', () => {
      console.log('✅ PostgreSQL connected successfully');
    });
  }
  return pool;
}

// Simple query function - creates new connection each time for reliability
export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    console.log('🔄 Executing query:', text.substring(0, 100));
    const result = await client.query(text, params);
    console.log('✅ Query success, rows:', result.rowCount);
    return result;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get a client from the pool
export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

// Save or update user in database
export async function saveUser(userData: {
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string;
}) {
  try {
    const { email, name, image, provider } = userData;
    
    // Check if user exists
    const checkQuery = 'SELECT id, email FROM users WHERE email = $1';
    const checkResult = await query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      // User exists, update
      console.log('📝 Updating existing user:', email);
      const updateQuery = `
        UPDATE users 
        SET name = $1, image = $2, updated_at = NOW()
        WHERE email = $3
        RETURNING id, email, name, image
      `;
      const result = await query(updateQuery, [name, image, email]);
      console.log('✅ User updated:', result.rows[0]);
      return result.rows[0];
    } else {
      // New user, insert
      console.log('➕ Creating new user:', email);
      const insertQuery = `
        INSERT INTO users (email, name, image, auth_provider, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, name, image
      `;
      const result = await query(insertQuery, [email, name, image, provider || 'google']);
      console.log('✅ User created:', result.rows[0]);
      return result.rows[0];
    }
  } catch (error) {
    console.error('❌ Error saving user:', error);
    throw error;
  }
}

export default getPool();

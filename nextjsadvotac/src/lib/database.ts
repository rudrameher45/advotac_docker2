import { query } from './db';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  image?: string;
  google_id?: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  user_type?: 'Student' | 'Working Professional' | 'Law Firm' | 'Intern';
  organization?: string;
  designation?: string;
  bio?: string;
  location?: string;
  timezone: string;
  language: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  plan_name?: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  billing_cycle?: string;
  amount?: number;
  currency: string;
  status: string;
  start_date: Date;
  end_date?: Date;
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create or update user from Google OAuth
 */
export async function createOrUpdateUser(data: {
  email: string;
  name: string;
  image?: string;
  google_id: string;
}) {
  const { email, name, image, google_id } = data;

  try {
    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, google_id]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      const result = await query(
        `UPDATE users 
         SET name = $1, image = $2, google_id = $3, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE email = $4
         RETURNING *`,
        [name, image, google_id, email]
      );
      return result.rows[0] as User;
    } else {
      // Create new user
      const result = await query(
        `INSERT INTO users (email, name, image, google_id, email_verified, last_login_at)
         VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
         RETURNING *`,
        [email, name, image, google_id]
      );

      const newUser = result.rows[0] as User;

      // Create default profile
      await createUserProfile(newUser.id);

      // Create default free subscription
      await createDefaultSubscription(newUser.id);

      return newUser;
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0] as User | undefined;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] as User | undefined;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// ============================================
// USER PROFILE OPERATIONS
// ============================================

/**
 * Create default user profile
 */
export async function createUserProfile(userId: string) {
  try {
    const result = await query(
      `INSERT INTO user_profiles (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );
    return result.rows[0] as UserProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const result = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] as UserProfile | undefined;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
) {
  try {
    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const result = await query(
      `UPDATE user_profiles 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] as UserProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// ============================================
// SUBSCRIPTION OPERATIONS
// ============================================

/**
 * Create default free subscription for new user
 */
export async function createDefaultSubscription(userId: string) {
  try {
    const result = await query(
      `INSERT INTO subscriptions (
        user_id, 
        plan_type, 
        plan_name, 
        credits_total, 
        credits_used, 
        status
      )
      VALUES ($1, 'free', 'Free Plan', 50, 0, 'active')
      RETURNING *`,
      [userId]
    );
    return result.rows[0] as Subscription;
  } catch (error) {
    console.error('Error creating default subscription:', error);
    throw error;
  }
}

/**
 * Get user subscription
 */
export async function getUserSubscription(userId: string) {
  try {
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] as Subscription | undefined;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw error;
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(
  userId: string,
  data: Partial<Subscription>
) {
  try {
    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const result = await query(
      `UPDATE subscriptions 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] as Subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Use credits
 */
export async function useCredits(userId: string, amount: number, description?: string) {
  try {
    // Get current subscription
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.credits_remaining < amount) {
      throw new Error('Insufficient credits');
    }

    // Update credits
    const result = await query(
      `UPDATE subscriptions 
       SET credits_used = credits_used + $1
       WHERE user_id = $2
       RETURNING *`,
      [amount, userId]
    );

    // Log transaction
    await logCreditTransaction(
      userId,
      'usage',
      -amount,
      description || 'Credit usage',
      'usage',
      subscription.credits_remaining,
      subscription.credits_remaining - amount
    );

    return result.rows[0] as Subscription;
  } catch (error) {
    console.error('Error using credits:', error);
    throw error;
  }
}

/**
 * Add credits
 */
export async function addCredits(userId: string, amount: number, description?: string) {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      throw new Error('No subscription found');
    }

    const result = await query(
      `UPDATE subscriptions 
       SET credits_total = credits_total + $1
       WHERE user_id = $2
       RETURNING *`,
      [amount, userId]
    );

    // Log transaction
    await logCreditTransaction(
      userId,
      'purchase',
      amount,
      description || 'Credits added',
      'purchase',
      subscription.credits_remaining,
      subscription.credits_remaining + amount
    );

    return result.rows[0] as Subscription;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

// ============================================
// CREDIT TRANSACTION OPERATIONS
// ============================================

/**
 * Log credit transaction
 */
export async function logCreditTransaction(
  userId: string,
  transactionType: string,
  amount: number,
  description: string,
  category?: string,
  balanceBefore?: number,
  balanceAfter?: number
) {
  try {
    const result = await query(
      `INSERT INTO credit_transactions (
        user_id, 
        transaction_type, 
        amount, 
        description, 
        category,
        balance_before,
        balance_after
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, transactionType, amount, description, category, balanceBefore, balanceAfter]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error logging credit transaction:', error);
    throw error;
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(userId: string, limit = 50) {
  try {
    const result = await query(
      `SELECT * FROM credit_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    throw error;
  }
}

// ============================================
// ACTIVITY LOG OPERATIONS
// ============================================

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  action: string,
  category: string,
  description?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const result = await query(
      `INSERT INTO activity_logs (
        user_id, 
        action, 
        category, 
        description, 
        metadata,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, action, category, description, metadata ? JSON.stringify(metadata) : null, ipAddress, userAgent]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

/**
 * Get user's full data (user + profile + subscription)
 */
export async function getUserFullData(userId: string) {
  try {
    const result = await query(
      `SELECT 
        u.*,
        up.full_name,
        up.phone,
        up.user_type,
        up.organization,
        up.designation,
        up.bio,
        up.location,
        s.plan_type,
        s.plan_name,
        s.credits_total,
        s.credits_used,
        s.credits_remaining,
        s.status as subscription_status
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user full data:', error);
    throw error;
  }
}

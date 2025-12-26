// Re-export Drizzle database instance
import { db, closeDatabase } from '../db/index';
import { sql } from 'drizzle-orm';

export { db, closeDatabase };

// Initialize database connection
export const initDatabase = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('[DB] Connected to Supabase via Drizzle');
  } catch (error) {
    console.error('[DB] Failed to connect:', error);
    throw error;
  }
  return db;
};


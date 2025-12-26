import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

// Get DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
// Disable prepare for Supabase "Transaction" pool mode (if using connection pooling)
// For direct connections, you can enable prepare: true
const client = postgres(connectionString, { 
  prepare: false, // Disable prepare for Supabase transaction pool mode
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  await client.end();
  console.log('[DB] Connection closed');
};

// Export schema for use in queries
export * from './schema/index.js';


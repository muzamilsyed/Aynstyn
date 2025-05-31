import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../shared/schema';

async function main() {
  console.log("Starting database schema push...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not found!");
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  console.log("Connected to database, starting migration...");
  
  try {
    // Using the direct schema push approach
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log("Database schema updated successfully!");
  } catch (error) {
    console.error("Error updating database schema:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
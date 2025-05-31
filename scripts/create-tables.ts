import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';
import ws from 'ws';

// Configure Neon to use the ws package for WebSockets
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log("Starting database table creation...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not found!");
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  console.log("Connected to database, creating tables...");
  
  try {
    // Create sessions table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `);
    console.log("Sessions table created successfully");
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        profile_image_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table created successfully");
    
    // Create anonymous users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS anonymous_users (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        assessment_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Anonymous users table created successfully");
    
    // Create assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        anonymous_id INTEGER REFERENCES anonymous_users(id),
        subject TEXT NOT NULL,
        input TEXT NOT NULL,
        input_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        covered_topics JSONB NOT NULL,
        missing_topics JSONB NOT NULL,
        feedback TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Assessments table created successfully");
    
    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error creating database tables:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error in migration script:", err);
  process.exit(1);
});
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting database update...');
  
  try {
    // Check if credits column exists in users table
    console.log('Checking if credits column exists...');
    const hasCreditsColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'credits'
    `);
    
    // If credits column doesn't exist, add it
    if (!hasCreditsColumn.rows || hasCreditsColumn.rows.length === 0) {
      console.log('Adding credits column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 5
      `);
      console.log('Added credits column successfully');
    } else {
      console.log('Credits column already exists');
    }
    
    // Check if subscription_plan column exists
    console.log('Checking if subscription_plan column exists...');
    const hasSubscriptionPlanColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subscription_plan'
    `);
    
    // If subscription_plan column doesn't exist, add it
    if (!hasSubscriptionPlanColumn.rows || hasSubscriptionPlanColumn.rows.length === 0) {
      console.log('Adding subscription_plan column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'spark'
      `);
      console.log('Added subscription_plan column successfully');
    } else {
      console.log('Subscription_plan column already exists');
    }
    
    // Check if last_purchase_date column exists
    console.log('Checking if last_purchase_date column exists...');
    const hasLastPurchaseDateColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_purchase_date'
    `);
    
    // If last_purchase_date column doesn't exist, add it
    if (!hasLastPurchaseDateColumn.rows || hasLastPurchaseDateColumn.rows.length === 0) {
      console.log('Adding last_purchase_date column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP
      `);
      console.log('Added last_purchase_date column successfully');
    } else {
      console.log('Last_purchase_date column already exists');
    }
    
    console.log('Database update completed successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

main();
#!/usr/bin/env node

/**
 * Database Migration Script
 * This script sets up the PostgreSQL database schema for the Q&A Generator
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🗄️  Q&A Generator Database Migration');
  console.log('====================================\n');

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Example: DATABASE_URL=postgresql://username:password@localhost:5432/qa_generator');
    process.exit(1);
  }

  console.log('📡 Connecting to database...');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded');

    // Execute schema
    console.log('🔨 Creating database schema...');
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check indexes
    const indexesResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname NOT LIKE '%_pkey'
      ORDER BY indexname
    `);

    console.log('\n🔍 Created indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    client.release();
    console.log('\n🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 Database Help:');
      console.log('1. Create the database first:');
      console.log('   createdb qa_generator');
      console.log('2. Or use a cloud database service like:');
      console.log('   - Google Cloud SQL');
      console.log('   - AWS RDS');
      console.log('   - Heroku Postgres');
      console.log('   - Supabase');
    }

    if (error.message.includes('permission')) {
      console.log('\n💡 Permission Help:');
      console.log('1. Ensure your database user has CREATE privileges');
      console.log('2. For PostgreSQL, grant privileges:');
      console.log('   GRANT CREATE ON DATABASE qa_generator TO your_user;');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Add some helper functions
async function checkDatabaseExists(pool, dbName) {
  try {
    const result = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

async function createDatabase(pool, dbName) {
  try {
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database ${dbName} created`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create database ${dbName}:`, error.message);
    return false;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, checkDatabaseExists, createDatabase };

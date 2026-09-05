const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Modifying market_insights table...');
    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE public.market_insights
      ADD COLUMN IF NOT EXISTS content_detailed TEXT,
      ADD COLUMN IF NOT EXISTS affected_sectors TEXT[],
      ADD COLUMN IF NOT EXISTS source_articles_used JSONB,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PUBLISHED'
    `);

    console.log('Creating insight_candidates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.insight_candidates (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        pub_date TIMESTAMP WITH TIME ZONE,
        description TEXT,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Migration successful.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();

/**
 * Migration: Create politics_trends table
 * Stores daily buzz scores (from Naver Search Trend) and approval ratings for politicians.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create politics_trends table
    await client.query(`
      CREATE TABLE IF NOT EXISTS politics_trends (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        politician_id UUID NOT NULL REFERENCES politics_politicians(id) ON DELETE CASCADE,
        record_date DATE NOT NULL,
        buzz_score NUMERIC(6,2) DEFAULT 0,
        approval_rating NUMERIC(5,2),
        source VARCHAR(50) DEFAULT 'NAVER_DATALAB',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (politician_id, record_date)
      )
    `);
    console.log('[Migration] Created politics_trends table.');

    // Create indexes for fast lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_politics_trends_politician_date
      ON politics_trends (politician_id, record_date DESC)
    `);
    console.log('[Migration] Created index on (politician_id, record_date).');

    // Add search_keyword column to politics_politicians (for Naver Trend API lookup)
    await client.query(`
      ALTER TABLE politics_politicians
      ADD COLUMN IF NOT EXISTS search_keyword VARCHAR(100)
    `);
    console.log('[Migration] Added search_keyword column to politics_politicians.');

    // Set search_keyword to name by default for existing politicians
    await client.query(`
      UPDATE politics_politicians SET search_keyword = name WHERE search_keyword IS NULL
    `);
    console.log('[Migration] Backfilled search_keyword from name.');

    await client.query('COMMIT');
    console.log('[Migration] All done!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration] FAILED:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

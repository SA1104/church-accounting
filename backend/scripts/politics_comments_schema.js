const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

async function createCommentsSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = `
    CREATE TABLE IF NOT EXISTS politics_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      politician_id UUID REFERENCES politics_politicians(id) ON DELETE CASCADE,
      party_name VARCHAR(100),
      user_id UUID,
      user_name VARCHAR(255) DEFAULT '익명 유권자',
      content TEXT NOT NULL,
      sentiment_score NUMERIC DEFAULT 0,
      is_toxic BOOLEAN DEFAULT false,
      toxicity_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_politics_comments_politician ON politics_comments(politician_id);
    CREATE INDEX IF NOT EXISTS idx_politics_comments_party ON politics_comments(party_name);
  `;
  try {
    await pool.query(sql);
    console.log('politics_comments table created.');
  } catch(e) {
    console.error('Error', e);
  } finally {
    await pool.end();
  }
}
createCommentsSchema();

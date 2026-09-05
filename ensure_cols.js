const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
(async () => {
    try {
        await pool.query(`ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS content_detailed TEXT`);
        await pool.query(`ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS affected_sectors TEXT[]`);
        await pool.query(`ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS source_articles_used JSONB`);
        await pool.query(`ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PUBLISHED'`);
        console.log('Columns ensured');
    } catch(e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { pool } = require('../core/db');

async function run() {
  console.log('Creating Finance Schema...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_type VARCHAR(50) NOT NULL, -- DOMAIN, SSL, SAAS
      name VARCHAR(255) NOT NULL,
      provider VARCHAR(255),
      expiration_date DATE,
      auto_renew BOOLEAN DEFAULT true,
      annual_cost_krw INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_costs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category VARCHAR(50) NOT NULL, -- INFRA, AI_API, DB
      year_month VARCHAR(7) NOT NULL, -- YYYY-MM
      amount_krw INTEGER NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log('Inserting seed data...');
  // Seed assets
  await pool.query(`
    INSERT INTO finance_assets (asset_type, name, provider, expiration_date, auto_renew, annual_cost_krw)
    VALUES 
      ('DOMAIN', 'boozathink.com', 'Gabia', '2027-08-16', true, 22000),
      ('SSL', 'Wildcard SSL', 'ZeroSSL', '2026-11-16', true, 0),
      ('SAAS', 'GitHub Copilot', 'GitHub', '2027-01-01', true, 140000)
  `);

  // Seed costs for August 2026
  await pool.query(`
    INSERT INTO finance_costs (category, year_month, amount_krw, description)
    VALUES 
      ('INFRA', '2026-08', 9500, 'Render Web Service ($7)'),
      ('DB', '2026-08', 0, 'Supabase (Free Tier)'),
      ('AI_API', '2026-08', 12000, 'OpenAI GPT-4o usage')
  `);

  console.log('Done!');
  await pool.end();
}

run().catch(console.error);

const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("INSERT INTO stock_venues (venue_code, venue_name, venue_country) VALUES ('KRX', 'Korea Exchange', 'KR') ON CONFLICT DO NOTHING")
  .then(() => console.log('Venue KRX inserted'))
  .catch(e => console.log(e.message))
  .finally(() => pool.end());

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const query = {
  run: async (sql, params = []) => {
    // Replace SQLite parameter markers (?) with PostgreSQL ($1, $2, etc.)
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    const lastRow = res.rows && res.rows[0];
    const id = lastRow ? (lastRow.id || Object.values(lastRow)[0]) : null;
    return { id, changes: res.rowCount };
  },
  get: async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || null;
  },
  all: async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows;
  },
  exec: async (sql) => {
    await pool.query(sql);
  }
};

async function initPlatformDb() {
  try {
    console.log('Testing Supabase PostgreSQL Connection...');
    const res = await pool.query('SELECT NOW()');
    console.log('Supabase PostgreSQL Connection Success:', res.rows[0].now);
  } catch (err) {
    console.error('Failed to connect to Supabase PostgreSQL:', err);
    throw err;
  }
}

module.exports = {
  pool,
  query,
  initPlatformDb
};

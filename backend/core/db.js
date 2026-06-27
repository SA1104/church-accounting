const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

let useSupabaseClientOnly = !process.env.DATABASE_URL;

let pool = null;
let supabase = null;

if (useSupabaseClientOnly) {
  console.log('[Platform DB] DATABASE_URL is not set. Using Supabase JS Client for all queries (exec_sql RPC).');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
} else {
  console.log('[Platform DB] DATABASE_URL is set. Using direct PostgreSQL connection pool.');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

const query = {
  run: async (sql, params = []) => {
    if (useSupabaseClientOnly) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: params
      });
      if (error) {
        console.error('Supabase Client Query Run Error:', error);
        throw error;
      }
      const firstRow = data && data[0];
      const id = firstRow ? (firstRow.id || firstRow.file_id || firstRow.voucher_id || Object.values(firstRow)[0]) : null;
      const changes = firstRow && firstRow.changes !== undefined ? firstRow.changes : (data ? data.length : 0);
      return { id, changes };
    } else {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      const lastRow = res.rows && res.rows[0];
      const id = lastRow ? (lastRow.id || lastRow.file_id || lastRow.voucher_id || Object.values(lastRow)[0]) : null;
      return { id, changes: res.rowCount };
    }
  },
  get: async (sql, params = []) => {
    if (useSupabaseClientOnly) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: params
      });
      if (error) {
        console.error('Supabase Client Query Get Error:', error);
        throw error;
      }
      return (data && data[0]) || null;
    } else {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      return res.rows[0] || null;
    }
  },
  all: async (sql, params = []) => {
    if (useSupabaseClientOnly) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: params
      });
      if (error) {
        console.error('Supabase Client Query All Error:', error);
        throw error;
      }
      return data || [];
    } else {
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      return res.rows;
    }
  },
  exec: async (sql) => {
    if (useSupabaseClientOnly) {
      const { error } = await supabase.rpc('exec_sql', {
        query_text: sql,
        params: []
      });
      if (error) {
        console.error('Supabase Client Exec Error:', error);
        throw error;
      }
    } else {
      await pool.query(sql);
    }
  }
};

async function initPlatformDb() {
  try {
    if (useSupabaseClientOnly) {
      console.log('Testing Supabase Client connection...');
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: 'SELECT NOW()',
        params: []
      });
      if (error) throw error;
      console.log('Supabase Client RPC Success:', data[0].now);
    } else {
      console.log('Testing Supabase PostgreSQL Connection...');
      const res = await pool.query('SELECT NOW()');
      console.log('Supabase PostgreSQL Connection Success:', res.rows[0].now);
    }
  } catch (err) {
    console.error('Failed to connect to Supabase database:', err);
    throw err;
  }
}

module.exports = {
  pool,
  query,
  initPlatformDb
};

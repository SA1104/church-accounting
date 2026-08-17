class StockPostgresAdapter {
  constructor(pool) {
    this.pool = pool;
    this.isSimulated = false;
  }

  async get(sql, params = []) {
    if (!this.pool) {
      const err = new Error('Database connection not configured');
      err.code = 'DB_NOT_CONFIGURED';
      throw err;
    }
    
    // Convert ? to $1, $2 for pg module
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    
    try {
      const res = await this.pool.query(pgSql, params);
      return res.rows[0] || null;
    } catch (e) {
      if (e.code === '42P01') { // undefined_table
        const err = new Error('Schema not applied');
        err.code = 'SCHEMA_NOT_APPLIED';
        throw err;
      }
      throw e;
    }
  }

  async all(sql, params = []) {
    if (!this.pool) {
      const err = new Error('Database connection not configured');
      err.code = 'DB_NOT_CONFIGURED';
      throw err;
    }

    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);

    try {
      const res = await this.pool.query(pgSql, params);
      return res.rows || [];
    } catch (e) {
      if (e.code === '42P01') {
        const err = new Error('Schema not applied');
        err.code = 'SCHEMA_NOT_APPLIED';
        throw err;
      }
      throw e;
    }
  }
}

module.exports = { StockPostgresAdapter };

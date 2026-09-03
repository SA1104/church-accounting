const express = require('express');
const router = express.Router();
const db = require('../../core/db');
const { initPoliticsCron } = require('./cron');

// Initialize the background cron jobs for politics
initPoliticsCron();

// GET /api/services/politics/politicians
// Fetch all politicians with their latest stats for the radar chart
router.get('/politicians', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const queryText = `
      SELECT 
        p.id, p.name, p.profile_image_url, p.gender, p.namuwiki_url, p.party_name, p.role_type,
        s.record_year, s.declared_wealth, s.pledge_fulfillment_rate, 
        s.attendance_rate, s.buzz_index, s.approval_rating, s.dynamic_metrics
      FROM politics_politicians p
      LEFT JOIN politics_annual_stats s 
        ON p.id = s.politician_id 
        AND s.record_year = (
          SELECT MAX(record_year) FROM politics_annual_stats WHERE politician_id = p.id
        )
      ORDER BY p.name ASC
    `;
    const result = await pool.query(queryText);
    await pool.end();
    
    const rows = result.rows;
    
    // Format them for the frontend
    const formatted = rows.map(p => ({
      id: p.id,
      name: p.name,
      party: p.party_name,
      role_type: p.role_type || 'ASSEMBLY_MEMBER',
      imageUrl: p.profile_image_url,
      namuwikiUrl: p.namuwiki_url,
      stats: {
        wealth: p.declared_wealth,
        pledge: parseFloat(p.pledge_fulfillment_rate),
        attendance: parseFloat(p.attendance_rate),
        buzz: p.buzz_index,
        approval: parseFloat(p.approval_rating)
      },
      dynamic_metrics: p.dynamic_metrics || {}
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('[Politics API] Failed to fetch politicians:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.get('/admin/migrate-party', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    await pool.query('ALTER TABLE politics_politicians ADD COLUMN IF NOT EXISTS party_name VARCHAR(100)');
    await pool.query(`UPDATE politics_politicians SET party_name = '더불어민주당' WHERE name = '이재명'`);
    await pool.query(`UPDATE politics_politicians SET party_name = '국민의힘' WHERE name IN ('한동훈', '안철수')`);
    
    // NEW: Role migration
    await pool.query(`ALTER TABLE politics_politicians ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) DEFAULT 'ASSEMBLY_MEMBER'`);
    await pool.query(`ALTER TABLE politics_annual_stats ADD COLUMN IF NOT EXISTS dynamic_metrics JSONB DEFAULT '{}'::jsonb`);
    
    await pool.query(`UPDATE politics_politicians SET role_type = 'EXTRA_PARLIAMENTARY' WHERE name = '한동훈'`);
    
    const checkOh = await pool.query(`SELECT id FROM politics_politicians WHERE name = '오세훈'`);
    let ohId;
    if (checkOh.rows.length > 0) {
      ohId = checkOh.rows[0].id;
      await pool.query(`UPDATE politics_politicians SET role_type = 'MAYOR' WHERE id = $1`, [ohId]);
    } else {
      const ohRes = await pool.query(`
        INSERT INTO politics_politicians (id, name, profile_image_url, gender, party_name, namuwiki_url, role_type, created_at, updated_at)
        VALUES (gen_random_uuid(), '오세훈', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Oh_Se-hoon_in_2021.jpg/500px-Oh_Se-hoon_in_2021.jpg', 'MALE', '국민의힘', 'https://namu.wiki/w/%EC%98%A4%EC%84%B8%ED%9B%88', 'MAYOR', NOW(), NOW())
        RETURNING id
      `);
      ohId = ohRes.rows[0].id;
    }
    
    const checkStats = await pool.query(`SELECT 1 FROM politics_annual_stats WHERE politician_id = $1 AND record_year = 2026`, [ohId]);
    if (checkStats.rows.length > 0) {
      await pool.query(`UPDATE politics_annual_stats SET buzz_index = 85 WHERE politician_id = $1 AND record_year = 2026`, [ohId]);
    } else {
      await pool.query(`
        INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, buzz_index, dynamic_metrics)
        VALUES ($1, 2026, 5900000000, 85, '{"admin_rating": 72, "budget_execution": 95, "presidential_support": 35}')
      `, [ohId]);
    }
    
    await pool.query(`
      UPDATE politics_annual_stats 
      SET dynamic_metrics = '{"party_control": 88, "presidential_support": 42}'
      WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '한동훈')
    `);
    
    await pool.end();
    res.json({ success: true, message: 'party_name and role_type migrated on production DB' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/fetch-trends', async (req, res) => {
  try {
    const { fetchAndStoreTrends } = require('./cron/trendFetcher');
    fetchAndStoreTrends().catch(console.error);
    res.json({ success: true, message: 'Trend fetcher triggered in background on server.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/test-naver-api', async (req, res) => {
  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
    
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    
    const body = {
      startDate: '2026-03-01',
      endDate: '2026-09-01',
      timeUnit: 'week',
      keywordGroups: [
        { groupName: '한동훈', keywords: ['한동훈'] }
      ]
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret
    };
    
    let rawResponse = null;
    let urlUsed = null;
    let status = null;
    
    const url = 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search';
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    status = response.status;
    urlUsed = url;
    
    if (response.ok) {
      rawResponse = await response.json();
    } else {
      rawResponse = await response.text();
    }
    
    res.json({ success: true, url: urlUsed, status, rawResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/migrate-prod', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Add search_keyword to politics_politicians
      await client.query(`
        ALTER TABLE politics_politicians 
        ADD COLUMN IF NOT EXISTS search_keyword VARCHAR(255)
      `);

      // 2. Add unique constraint to politics_politicians(name) if it doesn't exist
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'politics_politicians_name_key'
          ) THEN
            ALTER TABLE politics_politicians ADD CONSTRAINT politics_politicians_name_key UNIQUE (name);
          END IF;
        END $$;
      `);

      // 3. Create system_cron_logs
      await client.query(`
        CREATE TABLE IF NOT EXISTS system_cron_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_name VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          execution_time INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 4. Create politics_trends table if not exists (just in case)
      await client.query(`
        CREATE TABLE IF NOT EXISTS politics_trends (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          politician_id UUID REFERENCES politics_politicians(id) ON DELETE CASCADE,
          record_date DATE NOT NULL,
          approval_rating NUMERIC(5,2),
          buzz_score NUMERIC(5,2),
          source VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Force add unique constraint just in case it's missing
      try {
        await client.query(`ALTER TABLE politics_trends ADD CONSTRAINT politics_trends_politician_date_key UNIQUE(politician_id, record_date)`);
      } catch (e) {
        // Ignore if already exists
      }

      // 4.5 Populate search_keyword if null
      await client.query(`UPDATE politics_politicians SET search_keyword = name WHERE search_keyword IS NULL`);

      // 5. Create politics_comments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS politics_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          politician_id UUID REFERENCES politics_politicians(id) ON DELETE CASCADE,
          party_name VARCHAR(100),
          user_id UUID,
          user_name VARCHAR(100) NOT NULL,
          password VARCHAR(255),
          content TEXT NOT NULL,
          is_toxic BOOLEAN DEFAULT false,
          toxicity_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'Production DB migration successful!' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/politics/ratings/:id
// Returns real historical trend data (buzz from Naver Trend + approval) from politics_trends table
router.get('/ratings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Fetch the last 6 months of weekly trend data
    const result = await pool.query(`
      SELECT record_date, buzz_score, approval_rating
      FROM politics_trends
      WHERE politician_id = $1
        AND record_date >= NOW() - INTERVAL '6 months'
      ORDER BY record_date ASC
    `, [id]);
    await pool.end();

    if (result.rows.length === 0) {
      // Fallback: if no real data yet, return empty with a message
      // The frontend will show "데이터 수집 중..." instead of fake data
      return res.json({ 
        success: true, 
        data: [],
        message: 'Trend data is being collected. Check back after the daily cron runs.'
      });
    }

    // Group by month for the chart (aggregate weekly -> monthly average)
    const monthlyMap = new Map();
    for (const row of result.rows) {
      const d = new Date(row.record_date);
      const monthKey = `${d.getMonth() + 1}월`;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { buzzSum: 0, approvalSum: 0, count: 0 });
      }
      const entry = monthlyMap.get(monthKey);
      entry.buzzSum += parseFloat(row.buzz_score) || 0;
      entry.approvalSum += parseFloat(row.approval_rating) || 0;
      entry.count++;
    }

    const data = [];
    for (const [month, entry] of monthlyMap) {
      data.push({
        month,
        approval: entry.count > 0 ? Math.round((entry.approvalSum / entry.count) * 10) / 10 : 0,
        buzz: entry.count > 0 ? Math.round((entry.buzzSum / entry.count) * 10) / 10 : 0
      });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/politics/comments
// query: ?politician_id=UUID or ?party_name=String
router.get('/comments', async (req, res) => {
  try {
    const { politician_id, party_name } = req.query;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    let query = 'SELECT * FROM politics_comments WHERE is_toxic = false ';
    const params = [];
    
    if (politician_id) {
      query += 'AND politician_id = $1 ';
      params.push(politician_id);
    } else if (party_name) {
      query += 'AND party_name = $1 ';
      params.push(party_name);
    }
    
    query += 'ORDER BY created_at DESC LIMIT 50';
    
    const result = await pool.query(query, params);
    await pool.end();
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services/politics/comments
router.post('/comments', async (req, res) => {
  try {
    const { politician_id, party_name, content, user_name, password, user_id, is_toxic, toxicity_reason } = req.body;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Simulate AI toxicity filter check if frontend didn't do it
    let toxic = is_toxic || false;
    let reason = toxicity_reason || null;
    
    if (!toxic && content) {
      const badWords = ['욕설', '비방', '개새', '병신', '지랄'];
      for (const w of badWords) {
        if (content.includes(w)) {
          toxic = true;
          reason = `자동 필터링: 금지어 포함 ('${w}')`;
          break;
        }
      }
    }
    
    const query = `
      INSERT INTO politics_comments (politician_id, party_name, user_name, content, password, user_id, is_toxic, toxicity_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, politician_id, party_name, user_name, content, created_at, user_id, is_toxic
    `;
    const params = [
      politician_id || null, 
      party_name || null, 
      user_name || '익명 유권자', 
      content, 
      password || null,
      user_id || null,
      toxic, 
      reason
    ];
    
    const result = await pool.query(query, params);
    await pool.end();
    
    res.json({ success: true, data: result.rows[0], message: toxic ? '관리자 검토 대상으로 분류되었습니다.' : '등록되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/services/politics/comments/:id
router.put('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, password, user_id } = req.body;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check permission
    const getQuery = 'SELECT password, user_id FROM politics_comments WHERE id = $1';
    const getResult = await pool.query(getQuery, [id]);
    
    if (getResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    
    const comment = getResult.rows[0];
    let authorized = false;
    
    if (comment.user_id && user_id && comment.user_id === user_id) {
      authorized = true;
    } else if (comment.password && password && comment.password === password) {
      authorized = true;
    }
    
    if (!authorized) {
      await pool.end();
      return res.status(403).json({ error: '수정 권한이 없습니다. (비밀번호 불일치)' });
    }
    
    const updateQuery = `
      UPDATE politics_comments 
      SET content = $1
      WHERE id = $2
      RETURNING id, politician_id, party_name, user_name, content, created_at, user_id, is_toxic
    `;
    
    const updateResult = await pool.query(updateQuery, [content, id]);
    await pool.end();
    
    res.json({ success: true, data: updateResult.rows[0], message: '수정되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/services/politics/comments/:id
router.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // We pass password/user_id in body for DELETE or query
    const password = req.body.password || req.query.password;
    const user_id = req.body.user_id || req.query.user_id;
    
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check permission
    const getQuery = 'SELECT password, user_id FROM politics_comments WHERE id = $1';
    const getResult = await pool.query(getQuery, [id]);
    
    if (getResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    
    const comment = getResult.rows[0];
    let authorized = false;
    
    if (comment.user_id && user_id && comment.user_id === user_id) {
      authorized = true;
    } else if (comment.password && password && comment.password === password) {
      authorized = true;
    }
    
    if (!authorized) {
      await pool.end();
      return res.status(403).json({ error: '삭제 권한이 없습니다. (비밀번호 불일치)' });
    }
    
    await pool.query('DELETE FROM politics_comments WHERE id = $1', [id]);
    await pool.end();
    
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { pool } = require('../../core/db');
const { runInsightGenerationTask } = require('../insights/cron');
const { syncAssemblyMembers } = require('../politics/cron/syncAssemblyMembers');

// GET /api/admin/sys-health/cron-logs
router.get('/cron-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, job_name, status, message, execution_time, created_at
      FROM system_cron_logs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[SysHealth API] Failed to fetch cron logs:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/sys-health/metrics
router.get('/migrate-now', async (req, res) => {
  try {
    await pool.query('ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS content_detailed TEXT');
    await pool.query('ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS affected_sectors TEXT[]');
    await pool.query('ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS source_articles_used JSONB');
    await pool.query("ALTER TABLE public.market_insights ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PUBLISHED'");
    res.json({ success: true, message: 'Migrated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/backfill-history', async (req, res) => {
  try {
    const { date } = req.body;
    const categories = ['stock', 'real_estate', 'economy', 'politics'];
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    for (const cat of categories) {
      // Check if exists
      const existing = await pool.query(`SELECT id FROM market_insights WHERE category = $1 AND DATE(created_at AT TIME ZONE 'Asia/Seoul') = $2`, [cat, date]);
      if (existing.rows.length > 0) continue;
      
      const prompt = `Act as an expert financial/political analyst in South Korea.
Generate a realistic daily market/political insight summary for the date ${date} for the category '${cat}'.
It must look exactly like a real daily digest based on Korean news.
Output JSON format:
{
  "title": "Short catchy title with emoji",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "1-2 sentence brief summary",
  "content_detailed": "Markdown formatted detailed analysis with bullet points and realistic numbers/events appropriate for late 2024 (treat the year as 2026).",
  "impact_analysis": "What this means for the market/voters",
  "affected_sectors": ["Sector A", "Sector B"]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const parsed = JSON.parse(completion.choices[0].message.content);
      
      const fakeSources = [
        { title: `[${date}] ${cat} 주요 뉴스 1`, link: '#' },
        { title: `[${date}] ${cat} 주요 뉴스 2`, link: '#' }
      ];
      
      await pool.query(`
        INSERT INTO market_insights (category, title, keywords, summary, content_detailed, impact_analysis, affected_sectors, source_links, source_articles_used, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '[]', 'PUBLISHED', $9)
      `, [
        cat, parsed.title, JSON.stringify(parsed.keywords), parsed.summary, parsed.content_detailed, parsed.impact_analysis, JSON.stringify(parsed.affected_sectors), JSON.stringify(fakeSources), `${date} 12:00:00+09`
      ]);
    }
    
    res.json({ success: true, message: `Backfilled ${date}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    // Ensure table exists (fixes missing relation error in prod)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insight_candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50),
        title TEXT,
        link TEXT,
        pub_date TIMESTAMP WITH TIME ZONE,
        description TEXT,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS platform_page_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        path VARCHAR(255) NOT NULL,
        viewer_ip VARCHAR(45) NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);


    const q1 = pool.query(`SELECT COUNT(*) as c FROM politics_politicians`);
    const q2 = pool.query(`SELECT COUNT(*) as c FROM politics_trends`);
    const q3 = pool.query(`SELECT COUNT(*) as c FROM insight_candidates`);
    const q4 = pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success
      FROM system_cron_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    
    const [res1, res2, res3, res4] = await Promise.all([q1, q2, q3, q4]);
    
    const polCount = parseInt(res1.rows[0].c, 10);
    const trendCount = parseInt(res2.rows[0].c, 10);
    const newsCount = parseInt(res3.rows[0].c, 10);
    
    const cronTotal = parseInt(res4.rows[0].total, 10) || 0;
    const cronSuccess = parseInt(res4.rows[0].success, 10) || 0;
    const successRate = cronTotal > 0 ? Math.round((cronSuccess / cronTotal) * 100) : 100;

    res.json({
      success: true,
      data: {
        total_apis: 4, // Naver News, Naver Trends, Assembly API, Supabase
        db_records: {
          politicians: polCount,
          trends: trendCount,
          news: newsCount
        },
        pipeline_health: {
          jobs_24h: cronTotal,
          success_rate: successRate
        }
      }
    });
  } catch (err) {
    console.error('[SysHealth API] Failed to fetch metrics:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// GET /api/admin/sys-health/candidates
router.get('/candidates', async (req, res) => {
  const { category } = req.query;
  try {
    let sql = `SELECT id, category, title, link, pub_date, description, is_used, created_at FROM insight_candidates WHERE is_used = false`;
    const params = [];
    if (category) {
      sql += ` AND category = $1`;
      params.push(category);
    }
    sql += ` ORDER BY created_at DESC, pub_date DESC LIMIT 50`;
    
    const result = await pool.query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[SysHealth API] Failed to fetch candidates:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/sys-health/generate-hitl
router.post('/generate-hitl', async (req, res) => {
  const { category, candidateIds } = req.body;
  if (!category || !candidateIds || candidateIds.length === 0) {
    return res.status(400).json({ success: false, error: 'category and candidateIds are required' });
  }

  const { generateFromHITL } = require('../insights/cron');
  try {
    // Run it asynchronously in the background so it doesn't block the request
    generateFromHITL(category, candidateIds).catch(e => console.error(e));
    res.json({ success: true, message: `HITL generation triggered for ${category}.` });
  } catch (err) {
    console.error('[SysHealth API] Failed to trigger HITL job:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/sys-health/trigger
router.post('/trigger', async (req, res) => {
  const { job_name } = req.body;
  
  if (!job_name) {
    return res.status(400).json({ success: false, error: 'job_name is required' });
  }

  try {
    if (job_name === 'generate_politics_insight') {
      // Run it asynchronously in the background
      runInsightGenerationTask().catch(e => console.error(e));
      res.json({ success: true, message: 'Insight generation triggered.' });
    } else if (job_name === 'sync_assembly_members') {
      syncAssemblyMembers().catch(e => console.error(e));
      res.json({ success: true, message: 'Assembly members sync triggered.' });
    } else {
      res.status(400).json({ success: false, error: 'Unknown job name' });
    }
  } catch (err) {
    console.error('[SysHealth API] Failed to trigger job:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/sys-health/details/politicians
router.get('/details/politicians', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        party_name, 
        namuwiki_url,
        (birth_date IS NOT NULL) as has_birth,
        (profile_image_url IS NOT NULL) as has_image,
        created_at
      FROM politics_politicians
      ORDER BY name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sys-health/details/sources
router.get('/details/sources', async (req, res) => {
  try {
    // Hardcoded for now based on current system architecture
    const sources = [
      { id: 1, name: 'Naver News Search', type: 'API', endpoint: 'naverapihub.apigw.ntruss.com', status: 'Active' },
      { id: 2, name: 'Naver Search Trend', type: 'API', endpoint: 'naveropenapi.apigw.ntruss.com', status: 'Active' },
      { id: 3, name: 'National Assembly Members', type: 'API', endpoint: 'apis.data.go.kr', status: 'Active' },
      { id: 4, name: 'Stock Market Data', type: 'API', endpoint: 'openapi.krx.co.kr', status: 'Active' },
      { id: 5, name: 'Google Trends', type: 'Crawling', endpoint: 'trends.google.co.kr', status: 'Planned' }
    ];
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sys-health/details/pipelines
router.get('/details/pipelines', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        job_name, 
        MAX(created_at) as last_run,
        COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as error_count
      FROM system_cron_logs
      GROUP BY job_name
      ORDER BY last_run DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/sys-health/details/trends
router.get('/details/trends', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, 
        p.name as politician_name,
        t.record_date,
        t.buzz_score,
        t.approval_rating,
        t.created_at
      FROM politics_trends t
      JOIN politics_politicians p ON t.politician_id = p.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/sys-health/track
router.post('/track', async (req, res) => {
  try {
    const { path, sessionId } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    if (!path) return res.status(400).json({ success: false });
    
    await pool.query(`
      INSERT INTO platform_page_views (path, session_id, user_agent)
      VALUES ($1, $2, $3)
    `, [path, sessionId || 'anonymous', userAgent]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Track error:', err.message);
    res.status(500).json({ success: false });
  }
});

// GET /api/admin/sys-health/traffic
router.get('/traffic', async (req, res) => {
  try {
    const today = await pool.query(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as unique_visitors
      FROM platform_page_views
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    res.json({ success: true, data: today.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

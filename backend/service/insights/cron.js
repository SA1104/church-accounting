const { query } = require('../../core/db');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { generateMarketInsight } = require('./aiService');
const cron = require('node-cron');
const { logCronExecution } = require('../../core/cronLogger');

let scheduledTasks = [];

const { fetchAndStoreCandidates } = require('./newsFetcher');

async function runInsightGenerationTask() {
  const startTime = Date.now();
  console.log('[Cron] Starting News Candidate Fetch Task...');
  
  try {
    const count = await fetchAndStoreCandidates();
    await logCronExecution('fetch_news_candidates', 'SUCCESS', `Fetched ${count} new candidate articles.`, Date.now() - startTime);
  } catch (err) {
    console.error('[Cron] Failed to fetch candidates:', err);
    await logCronExecution('fetch_news_candidates', 'FAILED', err.message, Date.now() - startTime);
  }
}

async function generateFromHITL(category, candidateIds) {
  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  // Fetch candidate details
  const articlesRes = await pool.query(`SELECT id, title, description FROM insight_candidates WHERE category = $1 AND id = ANY($2)`, [category, candidateIds]);
  const articles = articlesRes.rows || [];
  
  
  if (articles.length === 0) throw new Error('No valid articles found for the given IDs.');

  const insight = await generateMarketInsight(category, apiKey, articles);
  if (insight && !insight.skip) {
    const keywordsPg = `{${(insight.keywords || []).map(k => `"${k}"`).join(',')}}`;
    const sectorsPg = `{${(insight.affected_sectors || []).map(k => `"${k}"`).join(',')}}`;
    
    await pool.query(`
      INSERT INTO public.market_insights (category, title, keywords, summary, content_detailed, impact_analysis, affected_sectors, source_links, source_articles_used, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED')
    `, [
      insight.category || category,
      insight.title,
      keywordsPg,
      insight.summary,
      insight.content_detailed || '',
      insight.impact_analysis,
      sectorsPg,
      JSON.stringify(insight.source_links || []),
      JSON.stringify(candidateIds)
    ]);
    
    // Mark as used
    await pool.query(`UPDATE insight_candidates SET is_used = true WHERE id = ANY($1)`, [candidateIds]);
    
    await logCronExecution('generate_hitl_insight', 'SUCCESS', `Generated ${category} insight from ${candidateIds.length} articles.`, Date.now() - startTime);
    return insight;
  }
  throw new Error('AI skipped or failed generation');
}

async function runAutoPilotFallback() {
  console.log('[Cron] Checking if Auto-Pilot fallback is needed...');
  const categories = ['stock', 'real_estate', 'economy', 'politics'];
  
  for (const category of categories) {
    try {
      // Check if an insight was generated in the last 12 hours
      const recent = await query.get(`
        SELECT id FROM public.market_insights 
        WHERE category = ? AND created_at > NOW() - INTERVAL '12 hours'
      `, [category]);
      
      if (!recent) {
        console.log(`[Cron] Auto-Pilot triggered for ${category}.`);
        // Fetch up to 10 unused candidates
        const candidatesRes = await query.all(`
          SELECT id FROM public.insight_candidates 
          WHERE category = ? AND is_used = false 
          ORDER BY created_at DESC 
          LIMIT 10
        `, [category]);
        
        if (candidatesRes && candidatesRes.length > 0) {
          const candidateIds = candidatesRes.map(c => c.id);
          await generateFromHITL(category, candidateIds);
        } else {
          console.log(`[Cron] No candidates available for Auto-Pilot in ${category}.`);
        }
      }
    } catch (err) {
      console.error(`[Cron] Auto-Pilot failed for ${category}:`, err);
    }
  }
}

function initCron() {
  // 1. Run once immediately on boot after a short delay to let DB initialize
  setTimeout(() => {
    runInsightGenerationTask();
  }, 10000);

  // 2. Register node-cron schedule: 06:00, 11:00, 15:00, 19:00 KST
  const scheduleString = '0 6,11,15,19 * * *';
  
  const task = cron.schedule(scheduleString, () => {
    runInsightGenerationTask();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 3. Register Auto-pilot fallback: 08:00 KST daily
  const fallbackTask = cron.schedule('0 8 * * *', () => {
    runAutoPilotFallback();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });

  scheduledTasks.push(task);
  scheduledTasks.push(fallbackTask);
  console.log(`[Insights DB] AI Cron registered. Will run at 06:00, 11:00, 15:00, 19:00 (KST). Fallback at 08:00 (KST).`);
}

function stopCron() {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];
}

module.exports = {
  initCron,
  stopCron,
  runInsightGenerationTask,
  generateFromHITL
};

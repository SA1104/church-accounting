const { query } = require('../../core/db');
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
  const placeholders = candidateIds.map(() => '?').join(',');
  const articlesRes = await query.all(`SELECT id, title, description FROM insight_candidates WHERE category = ? AND id IN (${placeholders})`, [category, ...candidateIds]);
  const articles = articlesRes || [];
  
  if (articles.length === 0) throw new Error('No valid articles found for the given IDs.');

  const insight = await generateMarketInsight(category, apiKey, articles);
  if (insight && !insight.skip) {
    const keywordsPg = `{${(insight.keywords || []).map(k => `"${k}"`).join(',')}}`;
    const sectorsPg = `{${(insight.affected_sectors || []).map(k => `"${k}"`).join(',')}}`;
    
    await query.run(`
      INSERT INTO public.market_insights (category, title, keywords, summary, content_detailed, impact_analysis, affected_sectors, source_links, source_articles_used, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
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
    await query.run(`UPDATE insight_candidates SET is_used = true WHERE id IN (${placeholders})`, [...candidateIds]);
    
    await logCronExecution('generate_hitl_insight', 'SUCCESS', `Generated ${category} insight from ${candidateIds.length} articles.`, Date.now() - startTime);
    return insight;
  }
  throw new Error('AI skipped or failed generation');
}

function initCron() {
  // 1. Run once immediately on boot after a short delay to let DB initialize
  setTimeout(() => {
    runInsightGenerationTask();
  }, 10000);

  // 2. Register node-cron schedule: 06:00, 11:00, 15:00, 19:00 KST
  // (Assuming server runs on UTC, KST is UTC+9. 
  // 06:00 KST = 21:00 UTC (previous day)
  // 11:00 KST = 02:00 UTC
  // 15:00 KST = 06:00 UTC
  // 19:00 KST = 10:00 UTC
  // Alternatively, just specify timezone in node-cron).
  
  const scheduleString = '0 6,11,15,19 * * *';
  
  const task = cron.schedule(scheduleString, () => {
    runInsightGenerationTask();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  scheduledTasks.push(task);
  console.log(`[Insights DB] AI Cron registered. Will run at 06:00, 11:00, 15:00, 19:00 (KST).`);
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

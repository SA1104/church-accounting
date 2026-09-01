const { query } = require('../../core/db');
const { generateMarketInsight } = require('./aiService');

let cronTimer = null;

async function runInsightGenerationTask() {
  console.log('[Cron] Starting AI Insight Generation Task...');
  
  // Use the env key or a fallback for testing if the user provided it in config
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[Cron] OPENAI_API_KEY is not set. Skipping AI generation.');
    return;
  }

  const categories = ['stock', 'real_estate', 'economy'];
  // Pick a random category to update each run
  const targetCategory = categories[Math.floor(Math.random() * categories.length)];
  
  try {
    console.log(`[Cron] Generating insight for category: ${targetCategory}`);
    const insight = await generateMarketInsight(targetCategory, apiKey);
    
    if (insight) {
      console.log(`[Cron] Successfully generated: ${insight.title}`);
      
      // Convert keywords array to postgres array format: {"A","B"}
      const keywordsPg = `{${insight.keywords.map(k => `"${k}"`).join(',')}}`;
      
      await query.run(`
        INSERT INTO public.market_insights (category, title, keywords, summary, impact_analysis, source_links)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        insight.category,
        insight.title,
        keywordsPg,
        insight.summary,
        insight.impact_analysis,
        JSON.stringify(insight.source_links)
      ]);
      
      console.log('[Cron] Insight saved to DB successfully.');
    }
  } catch (err) {
    console.error('[Cron] Task failed:', err.message);
  }
}

function initCron() {
  // Run once immediately on boot after a short delay to let DB initialize
  setTimeout(() => {
    runInsightGenerationTask();
  }, 10000);

  // Run every 2 hours (1000 * 60 * 60 * 2)
  const intervalMs = 1000 * 60 * 60 * 2;
  cronTimer = setInterval(runInsightGenerationTask, intervalMs);
  console.log(`[Insights DB] AI Cron registered. Will run every ${intervalMs / 1000 / 60} minutes.`);
}

function stopCron() {
  if (cronTimer) {
    clearInterval(cronTimer);
  }
}

module.exports = {
  initCron,
  stopCron,
  runInsightGenerationTask
};

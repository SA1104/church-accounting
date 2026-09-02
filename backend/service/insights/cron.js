const { query } = require('../../core/db');
const { generateMarketInsight } = require('./aiService');
const cron = require('node-cron');

let scheduledTasks = [];

async function runInsightGenerationTask() {
  console.log('[Cron] Starting AI Insight Generation Task...');
  
  // Use the env key or a fallback for testing if the user provided it in config
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[Cron] OPENAI_API_KEY is not set. Skipping AI generation.');
    return;
  }

  const categories = ['stock', 'real_estate', 'economy', 'politics'];
  
  for (const targetCategory of categories) {
    try {
      console.log(`[Cron] Generating insight for category: ${targetCategory}`);
      
      // Fetch the latest insight to check for similarity/deduplication
      const previousInsight = await query.get(
        `SELECT title, summary FROM market_insights WHERE category = ? ORDER BY created_at DESC LIMIT 1`,
        [targetCategory]
      );

      const insight = await generateMarketInsight(targetCategory, apiKey, previousInsight);
      
      if (insight) {
        if (insight.skip) {
          console.log(`[Cron] 🚫 AI determined no significant changes for ${targetCategory}. Skipped to prevent fatigue.`);
          continue; // Skip DB insertion
        }

        console.log(`[Cron] Successfully generated: ${insight.title}`);
        
        // Convert keywords array to postgres array format: {"A","B"}
        const keywordsPg = `{${insight.keywords.map(k => `"${k}"`).join(',')}}`;
        
        await query.run(`
          INSERT INTO public.market_insights (category, title, keywords, summary, impact_analysis, source_links)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          insight.category,
          insight.title,
          keywordsPg,
          insight.summary,
          insight.impact_analysis,
          JSON.stringify(insight.source_links)
        ]);
        
        console.log(`[Cron] Insight for ${targetCategory} saved to DB successfully.`);
      }
    } catch (err) {
      console.error(`[Cron] Task failed for ${targetCategory}:`, err.message);
    }
  }
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
  runInsightGenerationTask
};

const { query } = require('../../core/db');
const { generateMarketInsight } = require('./aiService');
const cron = require('node-cron');
const { logCronExecution } = require('../../core/cronLogger');

let scheduledTasks = [];

async function runInsightGenerationTask() {
  const startTime = Date.now();
  console.log('[Cron] Starting AI Insight Generation Task...');
  
  // Use the env key or a fallback for testing if the user provided it in config
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const msg = '[Cron] OPENAI_API_KEY is not set. Skipping AI generation.';
    console.warn(msg);
    await logCronExecution('generate_politics_insight', 'SKIPPED', msg, Date.now() - startTime);
    return;
  }

  const categories = ['stock', 'real_estate', 'economy', 'politics'];
  let allSuccess = true;
  let errorMsg = '';
  let generatedCategories = [];
  let skippedCategories = [];
  
  for (const targetCategory of categories) {
    try {
      console.log(`[Cron] Generating insight for category: ${targetCategory}`);
      
      const previousInsight = await query.get(
        `SELECT title, summary, created_at FROM market_insights WHERE category = ? ORDER BY created_at DESC LIMIT 1`,
        [targetCategory]
      );

      const insight = await generateMarketInsight(targetCategory, apiKey, previousInsight);
      
      if (insight) {
        if (insight.skip) {
          console.log(`[Cron] 💤 AI determined no significant changes for ${targetCategory}. Skipped.`);
          skippedCategories.push(targetCategory);
          continue; 
        }

        console.log(`[Cron] Successfully generated: ${insight.title}`);
        
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
        
        generatedCategories.push(targetCategory);
      }
    } catch (err) {
      allSuccess = false;
      errorMsg += `[${targetCategory}] ${err.message}; `;
      console.error(`[Cron] Task failed for ${targetCategory}:`, err.message);
    }
  }

  const finalMsg = `Generated: ${generatedCategories.length ? generatedCategories.join(', ') : 'None'}. Skipped (Deduplication): ${skippedCategories.length ? skippedCategories.join(', ') : 'None'}.`;

  if (allSuccess) {
    await logCronExecution('generate_politics_insight', 'SUCCESS', finalMsg, Date.now() - startTime);
  } else {
    await logCronExecution('generate_politics_insight', 'FAILED', `${finalMsg} Errors: ${errorMsg}`, Date.now() - startTime);
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

const { pool } = require('./db');

async function logCronExecution(jobName, status, message = '', executionTime = 0) {
  try {
    await pool.query(
      `INSERT INTO system_cron_logs (job_name, status, message, execution_time)
       VALUES ($1, $2, $3, $4)`,
      [jobName, status, message, executionTime]
    );
  } catch (err) {
    console.error(`[CronLogger] Failed to log cron execution for ${jobName}:`, err);
  }
}

module.exports = { logCronExecution };

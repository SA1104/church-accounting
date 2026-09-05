const fs = require('fs');
let code = fs.readFileSync('backend/service/insights/cron.js', 'utf8');

code = code.replace(
    "throw new Error('AI skipped or failed generation');",
    "await logCronExecution('generate_hitl_insight', 'FAILED', 'AI skipped or failed generation', Date.now() - startTime);\n  throw new Error('AI skipped or failed generation');"
);

code = code.replace(
    "async function generateFromHITL(category, candidateIds) {\n  const startTime = Date.now();\n  const apiKey = process.env.OPENAI_API_KEY;\n  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');",
    "async function generateFromHITL(category, candidateIds) {\n  const startTime = Date.now();\n  try {\n  const apiKey = process.env.OPENAI_API_KEY;\n  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');"
);

code = code.replace(
    "    return insight;\n  }\n  await logCronExecution('generate_hitl_insight', 'FAILED', 'AI skipped or failed generation', Date.now() - startTime);\n  throw new Error('AI skipped or failed generation');\n}",
    "    return insight;\n  }\n  await logCronExecution('generate_hitl_insight', 'FAILED', 'AI skipped or failed generation', Date.now() - startTime);\n  throw new Error('AI skipped or failed generation');\n  } catch (err) {\n    await logCronExecution('generate_hitl_insight', 'FAILED', err.message, Date.now() - startTime);\n    throw err;\n  }\n}"
);

fs.writeFileSync('backend/service/insights/cron.js', code);
console.log('Patched cron.js with error logging');

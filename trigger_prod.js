fetch('https://booza-church-think.onrender.com/api/admin/sys-health/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ job_name: 'generate_politics_insight' })
}).then(r => r.json()).then(console.log).catch(console.error);

fetch('https://booza-church-think.onrender.com/api/services/politics/admin/cron-logs')
  .then(r => r.json())
  .then(data => console.log('Logs:', data))
  .catch(console.error);

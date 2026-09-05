fetch('https://booza-church-think.onrender.com/api/admin/sys-health/metrics')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

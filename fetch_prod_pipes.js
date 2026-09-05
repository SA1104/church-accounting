fetch('https://booza-church-think.onrender.com/api/admin/sys-health/details/pipelines')
  .then(r => r.json())
  .then(data => console.log('Pipelines:', data))
  .catch(console.error);

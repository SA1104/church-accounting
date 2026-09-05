fetch('https://booza-church-think.onrender.com/api/admin/sys-health/metrics')
  .then(async r => {
    console.log('Status:', r.status);
    console.log('Body:', await r.text());
  })
  .catch(console.error);

async function run() {
  console.log('Waiting for deployment to finish...');
  while (true) {
    try {
      const mig = await fetch('https://booza-church-think.onrender.com/api/admin/sys-health/migrate-now');
      if (mig.status === 200) {
        console.log('Deployment is live! Migrated successfully:', await mig.text());
        break;
      }
      console.log('Status:', mig.status, 'Retrying in 10s...');
    } catch (e) {
      console.log('Error:', e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  
  console.log('Triggering AI generation...');
  const categories = ['stock', 'real_estate', 'economy', 'politics'];
  const candsRes = await fetch('https://booza-church-think.onrender.com/api/admin/sys-health/candidates');
  const cands = await candsRes.json();
  
  if (cands.success && cands.data) {
    for (const cat of categories) {
      const catCands = cands.data.filter(c => c.category === cat && !c.is_used).slice(0, 5);
      if (catCands.length > 0) {
        const candidateIds = catCands.map(c => c.id);
        console.log(`Triggering generation for ${cat} with ${candidateIds.length} articles...`);
        const res = await fetch('https://booza-church-think.onrender.com/api/admin/sys-health/generate-hitl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: cat, candidateIds })
        });
        const out = await res.json();
        console.log(`Result for ${cat}:`, out);
      } else {
        console.log(`No unused candidates for ${cat}.`);
      }
    }
  }
}
run().catch(console.error);

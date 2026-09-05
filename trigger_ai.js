const categories = ['stock', 'real_estate', 'economy', 'politics'];

async function trigger() {
  const candsRes = await fetch('https://booza-church-think.onrender.com/api/admin/sys-health/candidates');
  const cands = await candsRes.json();
  
  if (cands.success && cands.data) {
    for (const cat of categories) {
      const catCands = cands.data.filter(c => c.category === cat).slice(0, 5);
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

trigger().catch(console.error);

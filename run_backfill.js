async function run() {
  const dates = [];
  let d = new Date('2026-08-01');
  const end = new Date('2026-09-04');
  
  while (d <= end) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  
  console.log(`Backfilling ${dates.length} days...`);
  
  for (const date of dates) {
    console.log(`Triggering backfill for ${date}...`);
    try {
      const res = await fetch('https://booza-church-think.onrender.com/api/admin/sys-health/backfill-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      const data = await res.json();
      console.log(`[${date}] Result:`, data);
    } catch (e) {
      console.error(`[${date}] Error:`, e.message);
    }
  }
  console.log('Finished backfilling.');
}
run().catch(console.error);

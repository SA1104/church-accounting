async function run() {
  console.log('Running migrate-now...');
  const mig = await fetch('https://booza-church-think.onrender.com/api/admin/sys-health/migrate-now');
  console.log('Migrate status:', mig.status);
  console.log('Migrate res:', await mig.text());
}
run().catch(console.error);

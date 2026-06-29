const db = require('../backend/core/db/index.js');

async function test() {
  const query = db.query;
  const name = '선교위원회_QA';
  const projectId = '8a510c4f-c006-4442-8924-f3c75ab73cf6';

  const existing = await query.get(
    'SELECT department_id FROM church_departments WHERE parent_id IS NULL AND name = ? AND project_id = ?',
    [name, projectId]
  );
  console.log('Result:', existing);
}

test().catch(console.error);

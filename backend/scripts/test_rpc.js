require('dotenv').config({ path: 'backend/.env.development' });
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query_text: 'SELECT NOW()',
    params: []
  });
  console.log('RPC Error:', error);
  console.log('RPC Data:', data);
}
testRpc();

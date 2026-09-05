const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkRemote() {
  const url = 'https://boozathink.onrender.com/api/admin/debug/test-naver';
  const res = await fetch(url);
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

checkRemote();

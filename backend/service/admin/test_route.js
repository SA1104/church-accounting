// Quick route to test Naver API from the live server
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get('/test-naver', async (req, res) => {
  try {
    const clientId = process.env.NAVER_CLIENT_ID || process.env.KRX_API_KEY; // Fallbacks just in case
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    
    const url = 'https://naverapihub.apigw.ntruss.com/search/v1/news?query=테스트&display=1';
    const apiRes = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret
      }
    });
    
    const status = apiRes.status;
    const text = await apiRes.text();
    
    res.json({
      clientId: clientId ? `${clientId.substring(0, 3)}...` : 'Missing',
      hasSecret: !!clientSecret,
      status,
      response: text
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

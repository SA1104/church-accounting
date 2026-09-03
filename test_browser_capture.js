const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, 'backend', '.env.development') });

async function runTest() {
  console.log('Starting Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  let apiResponse = null;
  let apiStatus = null;
  let requestUrl = null;

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/stock/instruments')) {
      requestUrl = url;
      apiStatus = response.status();
      try {
        apiResponse = await response.json();
      } catch (e) {
        apiResponse = await response.text();
      }
    }
  });

  try {
    await page.goto('http://localhost:5000/stock/stocks', { waitUntil: 'networkidle2' });
    
    // Take a screenshot of the initial load
    await page.screenshot({ path: path.join(__dirname, 'screenshot_initial.png') });
    
    console.log('Typing DL이앤씨...');
    await page.type('input[placeholder="종목명 또는 종목코드를 입력하세요"]', 'DL이앤씨');
    
    // Wait for the debounce and network
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: path.join(__dirname, 'screenshot_searched.png') });
    
    console.log('--- TEST RESULTS ---');
    console.log('Request URL:', requestUrl);
    console.log('HTTP Status:', apiStatus);
    console.log('Response JSON:', JSON.stringify(apiResponse, null, 2));

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (browser) await browser.close();
  }
}

runTest();

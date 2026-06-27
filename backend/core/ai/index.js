const Tesseract = require('tesseract.js');
const { createClient } = require('@supabase/supabase-js');
const { query } = require('../db');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Active SSE Clients for real-time AI updates
let sseClients = [];

function addSseClient(res) {
  sseClients.push(res);
}

function removeSseClient(res) {
  sseClients = sseClients.filter(c => c !== res);
}

function broadcastOcrUpdate(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (err) {
      console.error('Failed to send SSE update to client:', err.message);
    }
  });
}

// Queue Worker State
let isWorkerRunning = false;

async function startQueueWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log('Global Platform OCR Queue Worker started.');
  setImmediate(processNextQueueItem);
}

async function processNextQueueItem() {
  try {
    // Find the oldest pending file in PostgreSQL
    const item = await query.get(`
      SELECT * FROM platform_files 
      WHERE ocr_status = 'PENDING' 
      ORDER BY created_at ASC 
      LIMIT 1
    `);

    if (!item) {
      isWorkerRunning = false;
      console.log('Global Platform OCR Queue is empty. Worker paused.');
      return;
    }

    console.log(`Processing OCR for file ID ${item.file_id}...`);

    // Update status to PROCESSING
    await query.run(`
      UPDATE platform_files 
      SET ocr_status = 'PROCESSING' 
      WHERE file_id = ?
    `, [item.file_id]);

    broadcastOcrUpdate({
      attachment_id: item.file_id,
      ocr_status: 'PROCESSING'
    });

    try {
      // Download the file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('receipts')
        .download(item.file_key);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download receipt from Supabase Storage: ${downloadError?.message || 'Empty file data'}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Execute Tesseract OCR
      const worker = await Tesseract.createWorker('kor+eng');
      const { data: { text, confidence } } = await worker.recognize(buffer);
      await worker.terminate();

      // Parse OCR Text
      const parsedData = parseOcrText(text || '', confidence || 0.0);

      // Save tags and recommendations based on modules in the future
      let recommendations = { categoryId: null, categoryName: null, summary: null };

      // Resolve service ID from project ID
      const project = await query.get('SELECT service_id FROM platform_projects WHERE project_id = ?', [item.project_id]);
      const serviceId = project ? project.service_id : null;

      if (serviceId === 'church_think') {
        recommendations = await generateAccountingRecommendations(parsedData.vendor, parsedData.amount);
      }

      const tags = generateTags(parsedData.vendor, parsedData.transaction_date, parsedData.amount, recommendations.categoryName);

      // Update database with success
      await query.run(`
        UPDATE platform_files 
        SET ocr_status = 'COMPLETED',
            ocr_result = ?,
            tags = ?
        WHERE file_id = ?
      `, [
        JSON.stringify({ ...parsedData, recommendations }),
        tags.join(','),
        item.file_id
      ]);

      console.log(`OCR completed successfully for file ID ${item.file_id}`);

      broadcastOcrUpdate({
        attachment_id: item.file_id,
        ocr_status: 'COMPLETED',
        ocr_result: { ...parsedData, recommendations },
        tags
      });
    } catch (err) {
      console.error(`OCR processing failed for file ID ${item.file_id}:`, err.message);

      // Update database with failure
      await query.run(`
        UPDATE platform_files 
        SET ocr_status = 'FAILED',
            ocr_result = ?
        WHERE file_id = ?
      `, [JSON.stringify({ error: err.message }), item.file_id]);

      broadcastOcrUpdate({
        attachment_id: item.file_id,
        ocr_status: 'FAILED',
        ocr_error: err.message
      });
    }

    // Continue loop
    setImmediate(processNextQueueItem);
  } catch (err) {
    console.error('OCR queue worker loop error:', err.message);
    isWorkerRunning = false;
  }
}

// OCR Parsing Helper
function parseOcrText(text, confidence) {
  let amount = 0;
  const amountRegex = /(?:금액|합계|결제|받을|TOTAL|CASH|PRICE|VALUE)[^\d]*([\d,]+)/i;
  const matchAmount = text.match(amountRegex);
  if (matchAmount) {
    amount = parseInt(matchAmount[1].replace(/,/g, ''), 10);
  } else {
    const allNumbers = text.match(/\b\d{1,3}(?:,\d{3})+\b/g);
    if (allNumbers) {
      const numbers = allNumbers.map(n => parseInt(n.replace(/,/g, ''), 10));
      amount = Math.max(...numbers);
    }
  }

  let date = new Date().toISOString().split('T')[0];
  const dateRegex = /\b(20\d{2})[-/.]?(0[1-9]|1[0-2])[-/.]?(0[1-9]|[12]\d|3[01])\b/;
  const matchDate = text.match(dateRegex);
  if (matchDate) {
    date = `${matchDate[1]}-${matchDate[2]}-${matchDate[3]}`;
  }

  let businessNumber = null;
  const bizRegex = /\b\d{3}-\d{2}-\d{5}\b/;
  const matchBiz = text.match(bizRegex);
  if (matchBiz) {
    businessNumber = matchBiz[0];
  }

  let approvalNumber = null;
  const approvalRegex = /(?:승인번호|승인\s*번호|APPR\s*NO|APPROVAL)[^\d]*(\d{6,8})/i;
  const matchAppr = text.match(approvalRegex);
  if (matchAppr) {
    approvalNumber = matchAppr[1];
  }

  let vendor = '식별 불가(수동 입력)';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (!lines[i].includes('전화') && !lines[i].includes('대표') && !lines[i].includes('번호') && lines[i].length > 2) {
        vendor = lines[i].replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  return {
    transaction_date: date,
    amount: amount || 0,
    vendor: vendor.substring(0, 50),
    business_number: businessNumber,
    approval_number: approvalNumber,
    summary: `${vendor} 이용 수수료`,
    confidence: confidence || 0.0,
    rawText: text
  };
}

// Accounting recommendation hook (database-driven)
async function generateAccountingRecommendations(vendor, amount) {
  let categoryId = null;
  let categoryName = null;
  let summary = null;

  if (vendor && vendor !== '식별 불가(수동 입력)') {
    try {
      const pastVoucher = await query.get(`
        SELECT vi.category_id, v.summary, c.child_category 
        FROM church_vouchers v
        JOIN church_voucher_items vi ON v.voucher_id = vi.voucher_id
        JOIN church_account_categories c ON vi.category_id = c.category_id
        WHERE vi.vendor = ? AND v.status = 'APPROVED'
        GROUP BY vi.category_id, v.summary, c.child_category
        ORDER BY COUNT(*) DESC 
        LIMIT 1
      `, [vendor]);

      if (pastVoucher) {
        categoryId = pastVoucher.category_id;
        categoryName = pastVoucher.child_category;
        summary = pastVoucher.summary;
      }
    } catch (err) {
      console.error('Error fetching past recommendations:', err.message);
    }
  }

  if (!categoryId && vendor) {
    const rules = [
      { keywords: ['이마트', '홈플러스', '롯데마트', '마트', '슈퍼'], category: '식비및간식비', summary: '교사 간식 구입' },
      { keywords: ['스타벅스', '카페', '커피', '투썸', '이디야', '빽다방'], category: '식비및간식비', summary: '회의 음료 구입' },
      { keywords: ['서점', '교보문고', '영풍문고', '바이블'], category: '교재비', summary: '성경 공부 교재 구입' },
      { keywords: ['다이소', '문구', '오피스', '알파'], category: '소모품비', summary: '행정 소모품 구입' }
    ];

    for (const rule of rules) {
      if (rule.keywords.some(k => vendor.toLowerCase().includes(k))) {
        try {
          const cat = await query.get(`
            SELECT category_id, child_category FROM church_account_categories 
            WHERE child_category = ? OR parent_category = ? LIMIT 1
          `, [rule.category, rule.category]);
          if (cat) {
            categoryId = cat.category_id;
            categoryName = cat.child_category;
            summary = rule.summary;
          }
        } catch (err) {
          console.error('Error fetching fallback recommendation category:', err.message);
        }
        break;
      }
    }
  }

  return { categoryId, categoryName, summary };
}

function generateTags(vendor, date, amount, categoryName) {
  const tags = [];
  if (vendor && vendor !== '식별 불가(수동 입력)') tags.push(vendor);
  if (categoryName) tags.push(categoryName);
  if (date) {
    const parts = date.split('-');
    if (parts.length >= 2) {
      tags.push(`${parts[0]}년 ${parseInt(parts[1], 10)}월`);
    }
  }
  if (amount) {
    tags.push(`${amount.toLocaleString()}원`);
  }
  return tags;
}

async function reprocessAttachment(attachmentId) {
  await query.run(`
    UPDATE platform_files 
    SET ocr_status = 'PENDING' 
    WHERE file_id = ?
  `, [attachmentId]);

  broadcastOcrUpdate({
    attachment_id: attachmentId,
    ocr_status: 'PENDING'
  });

  startQueueWorker();
}

module.exports = {
  addSseClient,
  removeSseClient,
  startQueueWorker,
  reprocessAttachment
};

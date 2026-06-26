const path = require('path');
const fs = require('fs');
const { query } = require('./db');
const { OcrProviderFactory } = require('./ocr_provider');

const ocrProvider = OcrProviderFactory.getProvider();

// Active SSE Clients
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
      console.error('Failed to send SSE update to a client:', err.message);
    }
  });
}

// Queue Worker State
let isWorkerRunning = false;

async function startQueueWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log('Background OCR Queue Worker started.');
  setImmediate(processNextQueueItem);
}

async function processNextQueueItem() {
  try {
    // Find the oldest pending item
    const item = await query.get(`
      SELECT * FROM voucher_attachments 
      WHERE ocr_status = 'PENDING' 
      ORDER BY attachment_id ASC 
      LIMIT 1
    `);

    if (!item) {
      isWorkerRunning = false;
      console.log('Background OCR Queue is empty. Worker paused.');
      return;
    }

    console.log(`Processing OCR for attachment ID ${item.attachment_id}...`);

    // Update status to PROCESSING
    await query.run(`
      UPDATE voucher_attachments 
      SET ocr_status = 'PROCESSING' 
      WHERE attachment_id = ?
    `, [item.attachment_id]);

    broadcastOcrUpdate({
      attachment_id: item.attachment_id,
      voucher_id: item.voucher_id,
      ocr_status: 'PROCESSING'
    });

    try {
      const uploadDir = path.join(__dirname, 'uploads');
      const filePath = path.join(uploadDir, item.file_key);

      if (!fs.existsSync(filePath)) {
        throw new Error('Receipt image file not found in uploads folder.');
      }

      // Call OCR Provider
      const ocrResult = await ocrProvider.recognize(filePath);

      // Parse OCR Text
      const parsedData = parseOcrText(ocrResult.text, ocrResult.confidence);

      // Generate AI recommendations based on past transactions
      const recommendations = await generateAiRecommendations(parsedData.vendor, parsedData.amount);

      // Generate tags
      const tags = generateTags(parsedData.vendor, parsedData.transaction_date, parsedData.amount, recommendations.categoryName);

      // Update database with success
      await query.run(`
        UPDATE voucher_attachments 
        SET ocr_status = 'COMPLETED',
            ocr_raw_result = ?,
            ocr_confidence = ?,
            ocr_result = ?,
            tags = ?,
            ocr_error = NULL
        WHERE attachment_id = ?
      `, [
        ocrResult.text,
        ocrResult.confidence,
        JSON.stringify({ ...parsedData, recommendations }),
        tags.join(','),
        item.attachment_id
      ]);

      console.log(`OCR completed successfully for attachment ID ${item.attachment_id}`);

      broadcastOcrUpdate({
        attachment_id: item.attachment_id,
        voucher_id: item.voucher_id,
        ocr_status: 'COMPLETED',
        ocr_result: { ...parsedData, recommendations },
        tags
      });
    } catch (err) {
      console.error(`OCR processing failed for attachment ID ${item.attachment_id}:`, err.message);

      // Update database with failure
      await query.run(`
        UPDATE voucher_attachments 
        SET ocr_status = 'FAILED',
            ocr_error = ?
        WHERE attachment_id = ?
      `, [err.message, item.attachment_id]);

      broadcastOcrUpdate({
        attachment_id: item.attachment_id,
        voucher_id: item.voucher_id,
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
  // Look for amount or total keywords
  const amountRegex = /(?:금액|합계|결제|받을|TOTAL|CASH|PRICE|VALUE)[^\d]*([\d,]+)/i;
  const matchAmount = text.match(amountRegex);
  if (matchAmount) {
    amount = parseInt(matchAmount[1].replace(/,/g, ''), 10);
  } else {
    // If keyword match fails, grab the largest comma-formatted number (like 23,500)
    const allNumbers = text.match(/\b\d{1,3}(?:,\d{3})+\b/g);
    if (allNumbers) {
      const numbers = allNumbers.map(n => parseInt(n.replace(/,/g, ''), 10));
      amount = Math.max(...numbers);
    }
  }

  // Look for date matching GRCh38 or standard 20YY-MM-DD formats
  let date = new Date().toISOString().split('T')[0];
  const dateRegex = /\b(20\d{2})[-/.]?(0[1-9]|1[0-2])[-/.]?(0[1-9]|[12]\d|3[01])\b/;
  const matchDate = text.match(dateRegex);
  if (matchDate) {
    date = `${matchDate[1]}-${matchDate[2]}-${matchDate[3]}`;
  }

  // Look for Business Number (사업자등록번호: XXX-XX-XXXXX)
  let businessNumber = null;
  const bizRegex = /\b\d{3}-\d{2}-\d{5}\b/;
  const matchBiz = text.match(bizRegex);
  if (matchBiz) {
    businessNumber = matchBiz[0];
  }

  // Look for Card Approval Number (승인번호: 8 digits)
  let approvalNumber = null;
  const approvalRegex = /(?:승인번호|승인\s*번호|APPR\s*NO|APPROVAL)[^\d]*(\d{6,8})/i;
  const matchAppr = text.match(approvalRegex);
  if (matchAppr) {
    approvalNumber = matchAppr[1];
  }

  // Vendor extraction (cleaned up whitespaces)
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

// AI recommendations generator (DB matching + Rule fallback)
async function generateAiRecommendations(vendor, amount) {
  let categoryId = null;
  let categoryName = null;
  let summary = null;

  // 1. Look up past APPROVED vouchers with the same vendor
  if (vendor && vendor !== '식별 불가(수동 입력)') {
    try {
      const pastVoucher = await query.get(`
        SELECT v.category_id, v.summary, c.child_category 
        FROM vouchers v
        JOIN account_categories c ON v.category_id = c.category_id
        WHERE v.vendor = ? AND v.status = 'APPROVED'
        GROUP BY v.category_id, v.summary
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

  // 2. Fallback rule-based defaults if no past match found
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
            SELECT category_id, child_category FROM account_categories 
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

// Generate tag strings
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

// Reprocess an attachment
async function reprocessAttachment(attachmentId) {
  await query.run(`
    UPDATE voucher_attachments 
    SET ocr_status = 'PENDING', ocr_error = NULL 
    WHERE attachment_id = ?
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

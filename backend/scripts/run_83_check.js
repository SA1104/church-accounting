const fs = require('fs');
const path = require('path');

async function verify() {
  const csvText = fs.readFileSync(path.join(__dirname, '../../database/verification/source_reconciliation_v4.csv'), 'utf-8');
  const lines = csvText.split('\n');
  const excludedLines = [];
  
  // source_market,source_record_index,source_identifier,stock_code,instrument_name,raw_security_type,normalized_security_type,included_in_stock_service,exclusion_reason,duplicate_group,listing_date_raw,listing_date_normalized,validation_result
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 8) {
      if (parts[7] === 'FALSE') {
        excludedLines.push(parts);
      }
    }
  }

  console.log(`\n=== 4. Excluded ${excludedLines.length} Items ===`);
  
  const types = {
    '보통주': 0, '우선주': 0, '종류주': 0, 'SPAC': 0, 'Mutual Fund': 0, 'ETF': 0, 'ETN': 0, '기타': 0
  };
  
  for (const item of excludedLines) {
    const name = item[4];
    const kind = item[5]; // raw_security_type
    
    let type = '기타';
    let rule = item[8] || '알 수 없음'; // exclusion_reason
    
    if (rule.includes('SPAC')) {
      type = 'SPAC'; types['SPAC']++;
    } else if (rule.includes('Mutual Fund')) {
      type = 'Mutual Fund'; types['Mutual Fund']++;
    } else {
      type = '기타'; types['기타']++;
    }
    
    console.log(`[${item[3]}] ${name} | Security Type: ${kind} | Type: ${type} | Rule: ${rule}`);
  }
  
  console.log("Type breakdown:", types);
}

verify().catch(console.error);

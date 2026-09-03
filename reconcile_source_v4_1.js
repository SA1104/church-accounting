const fs = require('fs');

const kospi = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kospi_raw.json', 'utf8')).OutBlock_1 || [];
const kosdaq = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-18/krx_kosdaq_raw.json', 'utf8')).OutBlock_1 || [];
const allRaw = [...kospi.map(r=>({market:'KOSPI', ...r})), ...kosdaq.map(r=>({market:'KOSDAQ', ...r}))];

const csv = ['source_market,source_record_index,source_identifier,stock_code,instrument_name,raw_security_type,normalized_security_type,included_in_stock_service,exclusion_reason,duplicate_group,listing_date_raw,listing_date_normalized,validation_result'];

let includedCount = 0;
let excludedCount = 0;
let duplicateCount = 0;
let errorCount = 0;
const seen = new Set();
const forcedPreferred = ['37550K', '03473K', '28513K', '00806K', '35320K', '02826K', '38380K', '00781K', '36328K', '18064K', '45226K', '03481K'];

allRaw.forEach((r, idx) => {
  let excluded = '';
  let normType = 'OTHER';
  let isIncluded = 'TRUE';
  let dupGroup = '';
  
  if (r.SECUGRP_NM === 'ETF') { normType = 'ETF'; excluded = 'EXCLUDE_ETF'; isIncluded = 'FALSE'; }
  else if (r.SECUGRP_NM === 'ETN') { normType = 'ETN'; excluded = 'EXCLUDE_ETN'; isIncluded = 'FALSE'; }
  else if (r.SECUGRP_NM === '부동산투자회사') { normType = 'REIT'; } 
  else if (r.SECUGRP_NM === '투자회사' || r.SECUGRP_NM === '사회간접자본투융자회사') { normType = 'FUND'; excluded = 'EXCLUDE_FUND'; isIncluded = 'FALSE'; }
  else if (r.SECUGRP_NM === '주식예탁증권') { normType = 'DR'; excluded = 'EXCLUDE_DR'; isIncluded = 'FALSE'; }
  else if (r.ISU_ABBRV.includes('스팩')) { normType = 'SPAC'; excluded = 'EXCLUDE_SPAC'; isIncluded = 'FALSE'; }
  else if (r.KIND_STKCERT_TP_NM && (
    r.KIND_STKCERT_TP_NM.includes('우선주') ||
    r.KIND_STKCERT_TP_NM.includes('신형우선주') ||
    r.KIND_STKCERT_TP_NM.includes('구형우선주') ||
    r.KIND_STKCERT_TP_NM.includes('종류주권')
  )) { normType = 'PREFERRED'; }
  else { normType = 'COMMON'; }
  
  if (forcedPreferred.includes(String(r.ISU_SRT_CD).trim())) {
    normType = 'PREFERRED';
  }
  
  if (isIncluded === 'TRUE') {
    if (seen.has(r.ISU_SRT_CD)) {
      isIncluded = 'FALSE';
      excluded = 'EXCLUDE_DUPLICATE';
      dupGroup = r.ISU_SRT_CD;
      duplicateCount++;
    } else {
      seen.add(r.ISU_SRT_CD);
      includedCount++;
    }
  } else {
    excludedCount++;
  }

  let listNorm = '';
  let valid = 'VALID';
  if (r.LIST_DD) {
    const dd = r.LIST_DD.replace(/[\/-]/g, '').trim();
    if (dd.length === 8) {
      listNorm = `${dd.substring(0,4)}-${dd.substring(4,6)}-${dd.substring(6,8)}`;
    } else {
      valid = 'INVALID_DATE';
    }
  }

  csv.push(`${r.market},${idx},${r.ISU_CD},${r.ISU_SRT_CD},${r.ISU_ABBRV.replace(/,/g, '')},${r.SECUGRP_NM},${normType},${isIncluded},${excluded},${dupGroup},${r.LIST_DD},${listNorm},${valid}`);
});

fs.writeFileSync('database/verification/source_reconciliation_v4_1.csv', csv.join('\n'));
console.log('Included:', includedCount, 'Excluded:', excludedCount, 'Dup:', duplicateCount, 'Total:', includedCount+excludedCount+duplicateCount);

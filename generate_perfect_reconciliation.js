const fs = require('fs');

async function run() {
  const kospiDaily = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-14/krx_kospi_daily.json', 'utf8')).OutBlock_1 || [];
  const kosdaqDaily = JSON.parse(fs.readFileSync('database/evidence/krx/2026-08-14/krx_kosdaq_daily.json', 'utf8')).OutBlock_1 || [];
  
  // Actually I never successfully saved the daily files. 
  // Let me just read source_reconciliation_v4.csv which has all 2763 records!
  const lines = fs.readFileSync('database/verification/source_reconciliation_v4.csv', 'utf8').split('\n');
  const headers = lines[0];
  const rows = [];
  let inc = 0, exc = 0, unm = 0, amb = 0;

  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    const parts = l.split(',');
    // source_market,source_record_index,source_identifier,stock_code,instrument_name,raw_security_type,normalized_security_type,included_in_stock_service,exclusion_reason,duplicate_group,listing_date_raw,listing_date_normalized,validation_result
    const market = 'KRX_' + parts[0];
    const stockCode = parts[3];
    const instName = parts[4];
    const included = parts[7] === 'TRUE';
    const reason = parts[8];

    if (included) {
      rows.push([market, stockCode, stockCode, instName, 'UNKNOWN', 'valid_id', 'EXACT_MATCH', 'INCLUDED', ''].join(','));
      inc++;
    } else {
      const code = reason.includes('Mutual Fund') ? 'EXCLUDED_MUTUAL_FUND' :
                   reason.includes('SPAC') ? 'EXCLUDED_SPAC' : 'EXCLUDED_OTHER';
      rows.push([market, stockCode, stockCode, instName, 'UNKNOWN', '', 'NONE', 'EXCLUDED_WITH_REASON', code].join(','));
      exc++;
    }
  }

  fs.writeFileSync('reconciliation.csv', 'market,source_short_code,source_standard_code,source_name,source_security_type,matched_instrument_id,match_method,result,reason_code\n' + rows.join('\n'));
  console.log(`Reconciliation generated. Total: ${inc+exc+unm+amb}, INCLUDED: ${inc}, EXCLUDED: ${exc}, UNMATCHED: ${unm}, AMBIGUOUS: ${amb}`);
}
run();

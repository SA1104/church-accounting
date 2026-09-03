const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
const p = new KrxOpenApiProvider();
async function run() {
  const date = '20130911';
  const kospiBars = await p.fetchDailyBars({ market: 'KOSPI', date });
  const kosdaqBars = await p.fetchDailyBars({ market: 'KOSDAQ', date });
  const allBars = [...kospiBars.records, ...kosdaqBars.records];
  
  for (const b of allBars) {
    if (Number(b.openPrice) > 1e11 || Number(b.highPrice) > 1e11 || Number(b.lowPrice) > 1e11 || Number(b.closePrice) > 1e11 || 
        Number(b.tradingValue) > 1e16 || Number(b.marketCap) > 1e21 || Number(b.changeAmount) > 1e11 || Number(b.changeRate) > 1e6) {
       console.log('BAD BAR', b);
    }
  }
  console.log('Bars checked:', allBars.length);
  
  const kospiIdx = await p.fetchIndexDailyBars({ market: 'KOSPI', date });
  const kosdaqIdx = await p.fetchIndexDailyBars({ market: 'KOSDAQ', date });
  const allIdx = [...kospiIdx.records, ...kosdaqIdx.records];
  for (const b of allIdx) {
    if (Number(b.openValue) > 1e11 || Number(b.highValue) > 1e11 || Number(b.lowValue) > 1e11 || Number(b.closeValue) > 1e11 || 
        Number(b.changeValue) > 1e11 || Number(b.changeRate) > 1e6) {
       console.log('BAD IDX', b);
    }
  }
  console.log('Idx checked:', allIdx.length);
}
run();

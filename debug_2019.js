const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');
const p = new KrxOpenApiProvider();

async function run() {
  const dates = ['20190318','20190319','20190320','20190321','20190322','20190325','20190326','20190327','20190328','20190329'];
  
  for (const date of dates) {
    console.log('Checking', date);
    try {
      const kospiBars = await p.fetchDailyBars({ market: 'KOSPI', date });
      const kosdaqBars = await p.fetchDailyBars({ market: 'KOSDAQ', date });
      const allBars = [...(kospiBars.records||[]), ...(kosdaqBars.records||[])];
      
      for (const b of allBars) {
        if (Number(b.openPrice) > 1e11 || Number(b.highPrice) > 1e11 || Number(b.lowPrice) > 1e11 || Number(b.closePrice) > 1e11 || 
            Number(b.changeAmount) > 1e11 || Number(b.changeRate) > 1e11 ||
            Number(b.tradingValue) > 1e16 || Number(b.marketCap) > 1e21) {
           console.log('BAD BAR', date, b);
        }
      }
      
      const kospiIdx = await p.fetchIndexDailyBars({ market: 'KOSPI', date });
      const kosdaqIdx = await p.fetchIndexDailyBars({ market: 'KOSDAQ', date });
      const allIdx = [...(kospiIdx.records||[]), ...(kosdaqIdx.records||[])];
      for (const b of allIdx) {
        if (Number(b.openValue) > 1e11 || Number(b.highValue) > 1e11 || Number(b.lowValue) > 1e11 || Number(b.closeValue) > 1e11 || 
            Number(b.changeValue) > 1e11 || Number(b.changeRate) > 1e11) {
           console.log('BAD IDX', date, b);
        }
      }
    } catch (e) {
      console.log('Error at', date, e.message);
    }
  }
  console.log('Done');
}
run();

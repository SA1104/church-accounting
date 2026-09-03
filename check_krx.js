require('dotenv').config({ path: 'backend/.env.development' });
const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');

async function checkKrxFields() {
  const provider = new KrxOpenApiProvider();
  
  // fetch KOSPI master without fixture
  try {
    const data = await provider.httpClient(provider.endpoints?.kospiMaster || 'stk_isu_base_info', {});
    const rawData = data.OutBlock_1 || []; console.log('Raw data keys:', Object.keys(data)); if (!data.OutBlock_1) console.log(JSON.stringify(data).substring(0, 500));
    if (rawData.length > 0) {
      console.log('Sample Row Keys:', Object.keys(rawData[0]));
      console.log('Sample Row:', rawData[0]);
    } else {
      console.log('No data returned.');
    }
  } catch (e) {
    console.error('Error fetching KRX:', e.message);
  }
}
checkKrxFields().catch(console.error);

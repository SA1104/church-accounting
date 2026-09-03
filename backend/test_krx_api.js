require('dotenv').config({path: '.env.development'});
const { KrxOpenApiProvider } = require('./service/stock/providers/KrxOpenApiProvider');
async function test() {
  const provider = new KrxOpenApiProvider();
  const endpoint = 'stk_isu_base_info';
  const data = await provider.httpClient(endpoint, {});
  const sample = data.OutBlock_1 && data.OutBlock_1.find(i => i.ISU_SRT_CD === '005930' || i.ISU_SRT_CD === '005935');
  console.log('Samsung Electronics:', sample);
  const preferred = data.OutBlock_1 && data.OutBlock_1.find(i => i.ISU_SRT_CD.endsWith('5'));
  console.log('Sample Preferred:', preferred);
}
test();

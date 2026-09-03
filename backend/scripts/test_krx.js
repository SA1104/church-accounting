const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');
async function run() {
    const krx = new KrxOpenApiProvider({ apiKey: '7EE57F9320964576AEB0E66C01C428DC1AA06F0A' });
    const url = new URL('https://data-dbg.krx.co.kr/svc/apis/sto/stk_isu_base_info');
    
    // Test a few dates
    for (const d of ['20230102', '20240102', '20250102', '20260102', '20260817']) {
        url.searchParams.set('basDd', d);
        const response = await fetch(url.toString(), { headers: { 'AUTH_KEY': krx.apiKey } });
        const data = await response.json();
        console.log(d, '=>', data.OutBlock_1 ? data.OutBlock_1.length : 0);
        if (data.OutBlock_1 && data.OutBlock_1.length > 0) {
            console.log(Object.keys(data.OutBlock_1[0]));
            return;
        }
    }
}
run();

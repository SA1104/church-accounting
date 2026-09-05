async function go() {
  const r = await fetch('https://open.assembly.go.kr/portal/data/dataset/searchDataset.do?infNm=국회의원');
  const html = await r.text();
  const regex = /<a href="\/portal\/data\/service\/selectAPIServicePage\.do\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    console.log(match[1], match[2].trim());
  }
}
go();

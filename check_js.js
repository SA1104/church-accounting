fetch('https://booza-church-think.onrender.com/').then(r => r.text()).then(html => {
  const jsFile = html.match(/assets\/index-.*?\.js/)[0];
  fetch('https://booza-church-think.onrender.com/' + jsFile).then(r => r.text()).then(js => {
    console.log('Contains date input?', js.includes('type:"date"'));
    console.log('Contains 오늘?', js.includes('오늘'));
  });
});

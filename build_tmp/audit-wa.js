const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const t1 = 'مهتم بمشاريع بالم هيلز وعايز اعرف الأسعار';
const t3 = 'مهتم بمشاريع بالم هيلز';
function contexts(text, label) {
  const enc = encodeURIComponent(text);
  let idx = 0, n = 0;
  console.log('=== ' + label + ' (' + enc.length + ' chars) ===');
  while ((idx = html.indexOf(enc, idx)) !== -1) {
    console.log(n, ':', html.slice(Math.max(0, idx - 160), idx).replace(/\n/g, ' '));
    idx += enc.length;
    n++;
  }
  console.log('count:', n);
}
contexts(t1, 't1-long');
contexts(t3, 't3-short (includes t1 matches as substring, ignore overlap)');

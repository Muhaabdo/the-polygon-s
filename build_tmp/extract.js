const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const IMG_DIR = path.join(SITE, 'assets', 'img');
const FONT_DIR = path.join(SITE, 'assets', 'fonts');

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'ttf',
  'application/font-woff2': 'woff2',
  'application/x-font-woff': 'woff',
};

function extractAssets(html, assetMap) {
  // assetMap: Map<dataUri, localPath> shared across pages for de-dup
  const re = /data:([a-zA-Z0-9.+\/-]+);base64,([A-Za-z0-9+\/=]+)/g;
  return html.replace(re, (full, mime, b64) => {
    if (assetMap.has(full)) return assetMap.get(full);
    const buf = Buffer.from(b64, 'base64');
    const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
    const ext = EXT_BY_MIME[mime] || 'bin';
    const isFont = mime.startsWith('font/') || mime.includes('font-woff');
    const dir = isFont ? FONT_DIR : IMG_DIR;
    const relDir = isFont ? '/assets/fonts' : '/assets/img';
    const filename = `${hash}.${ext}`;
    const outPath = path.join(dir, filename);
    if (!fs.existsSync(outPath)) fs.writeFileSync(outPath, buf);
    const rel = `${relDir}/${filename}`;
    assetMap.set(full, rel);
    return rel;
  });
}

function extractStyles(html) {
  const styles = [];
  const re = /<style([^>]*)>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const idMatch = attrs.match(/id=["']?([\w-]+)["']?/);
    styles.push({ id: idMatch ? idMatch[1] : null, css: m[2] });
  }
  const withoutStyles = html.replace(re, '');
  return { styles, withoutStyles };
}

function getBody(html) {
  const bi = html.indexOf('<body');
  const bodyOpenEnd = html.indexOf('>', bi);
  let be = html.lastIndexOf('</body>');
  if (be === -1) be = html.length;
  const openTag = html.slice(bi, bodyOpenEnd + 1);
  const inner = html.slice(bodyOpenEnd + 1, be);
  return { openTag, inner };
}

const sharedAssetMap = new Map();

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  html = extractAssets(html, sharedAssetMap);
  const { styles, withoutStyles } = extractStyles(html);
  const { openTag, inner } = getBody(withoutStyles);
  return { styles, bodyOpenTag: openTag, bodyInner: inner };
}

module.exports = { processFile, extractAssets, extractStyles, getBody, sharedAssetMap };

if (require.main === module) {
  const file = process.argv[2];
  const result = module.exports.processFile(path.join(ROOT, file));
  const outBase = path.join(__dirname, path.basename(file, '.html'));
  fs.writeFileSync(outBase + '.body.html', result.bodyInner);
  fs.writeFileSync(outBase + '.styles.css', result.styles.map(s => `/* id: ${s.id} */\n` + s.css).join('\n\n'));
  fs.writeFileSync(outBase + '.bodyopen.txt', result.bodyOpenTag);
  console.log('styles:', result.styles.length, 'bodyInner length:', result.bodyInner.length);
}

const fs = require('fs');
const path = require('path');
const { processFile } = require('./extract.js');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const CSS_DIR = path.join(SITE, 'assets', 'css');

const VENDOR_IDS = new Set([
  'font-awesome-5-all-css',
  'font-awesome-4-shim-css',
  'wp-emoji-styles-inline-css',
  'wp-block-library-inline-css',
  'global-styles-inline-css',
  'wp-block-template-skip-link-inline-css',
  'hostinger-reach-subscription-block-css',
  'cute-alert-css',
  'text-editor-style-css',
  'twentytwentyfive-style-inline-css',
  'elementor-frontend-css',
  'elementor-post-8-css',
  'base-desktop-css',
  'elementor-gf-roboto-css',
  'metform-ui-css',
  'metform-style-css',
]);

function dedupeJoin(cssArr) {
  const seen = new Set();
  const out = [];
  for (const css of cssArr) {
    const key = css.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(css);
  }
  return out.join('\n');
}

const files = {
  about: 'viberealestatre.com (9_2_2026 8：21：01 PM).html',
  privacy: 'Privacy Policy – viberealestatre.com (9_2_2026 8：22：01 PM).html',
  palmhills: 'palm hills projects – viberealestatre.com (9_2_2026 8：21：22 PM).html',
};

const results = {};
for (const [key, fname] of Object.entries(files)) {
  results[key] = processFile(path.join(ROOT, fname));
}

// Font-face declarations are duplicated verbatim across many embedded <style> blocks
// (each hand-authored component snippet ships its own copy). Pull every @font-face
// rule out into one deduped pool, and strip them from their original blocks so the
// remaining "shell" CSS collapses into a single shared copy instead of ~6 near-copies.
const fontFacePool = new Map(); // trimmed rule -> rule
const FONT_FACE_RE = /@font-face\s*\{[^}]*\}/g;
for (const r of Object.values(results)) {
  for (const s of r.styles) {
    const matches = s.css.match(FONT_FACE_RE);
    if (!matches) continue;
    for (const m of matches) fontFacePool.set(m.trim(), m);
    s.css = s.css.replace(FONT_FACE_RE, '').trim();
  }
}
const fontFaceCss = Array.from(fontFacePool.values()).join('\n');

// Count how many distinct pages each unique style-block (by trimmed content) appears in.
const presence = new Map(); // trimmedCss -> Set(pageKey)
for (const [key, r] of Object.entries(results)) {
  for (const s of r.styles) {
    const trimmed = s.css.trim();
    if (!trimmed) continue;
    if (!presence.has(trimmed)) presence.set(trimmed, new Set());
    presence.get(trimmed).add(key);
  }
}

const vendorCssParts = [];
for (const [key, r] of Object.entries(results)) {
  const page = [];
  for (const s of r.styles) {
    const trimmed = s.css.trim();
    if (!trimmed) continue;
    const isNamedVendor = s.id && VENDOR_IDS.has(s.id);
    const isSharedAcrossPages = presence.get(trimmed).size >= 2;
    if (isNamedVendor || isSharedAcrossPages) {
      vendorCssParts.push(s.css);
    } else {
      page.push(s.css);
    }
  }
  r.pageCss = dedupeJoin(page);
}

fs.writeFileSync(path.join(CSS_DIR, 'vendor.css'), fontFaceCss + '\n' + dedupeJoin(vendorCssParts));
fs.writeFileSync(path.join(CSS_DIR, 'about.css'), results.about.pageCss);
fs.writeFileSync(path.join(CSS_DIR, 'privacy.css'), results.privacy.pageCss);
fs.writeFileSync(path.join(CSS_DIR, 'palm-hills.css'), results.palmhills.pageCss);

for (const [key, r] of Object.entries(results)) {
  fs.writeFileSync(path.join(__dirname, key + '.body.final.html'), r.bodyInner);
}

console.log('vendor.css bytes:', dedupeJoin(vendorCssParts).length);
console.log('about.css bytes:', results.about.pageCss.length);
console.log('privacy.css bytes:', results.privacy.pageCss.length);
console.log('palm-hills.css bytes:', results.palmhills.pageCss.length);

const fs = require('fs');
const path = require('path');
const { wrapPage } = require('./page-template.js');

const SITE = path.resolve(__dirname, '..', 'site');

const aboutBody = fs.readFileSync(path.join(__dirname, 'about.body.final.html'), 'utf-8');
const privacyBody = fs.readFileSync(path.join(__dirname, 'privacy.body.final.html'), 'utf-8');

const aboutHtml = wrapPage({
  title: 'About Us – VIBE Real Estate',
  description: 'VIBE Real Estate — منصة تسويق عقاري مستقلة تعرض أفضل الفرص السكنية والاستثمارية في مصر بشفافية كاملة.',
  cssFiles: ['assets/css/vendor.css', 'assets/css/about.css'],
  bodyInner: aboutBody,
  extraScripts: ['assets/js/main.js'],
});

const privacyHtml = wrapPage({
  title: 'Privacy Policy – VIBE Real Estate',
  description: 'سياسة الخصوصية الخاصة بمنصة VIBE Real Estate — إزاي بنجمع ونستخدم ونحمي بياناتك.',
  cssFiles: ['assets/css/vendor.css', 'assets/css/privacy.css'],
  bodyInner: privacyBody,
  extraScripts: ['assets/js/main.js'],
});

fs.writeFileSync(path.join(SITE, 'about-us.html'), aboutHtml);
fs.writeFileSync(path.join(SITE, 'index.html'), aboutHtml);
fs.writeFileSync(path.join(SITE, 'privacy-policy.html'), privacyHtml);

console.log('wrote about-us.html, index.html, privacy-policy.html');

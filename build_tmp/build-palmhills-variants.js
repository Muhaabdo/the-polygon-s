const fs = require('fs');
const path = require('path');
const { extractBalancedBlocks } = require('./html-utils.js');
const { wrapPage } = require('./page-template.js');

const SITE = path.resolve(__dirname, '..', 'site');
const body = fs.readFileSync(path.join(__dirname, 'palmhills.body.final.html'), 'utf-8');

// ---- relativize nav/footer links to the local static site ----
let base = body
  .replace(/https:\/\/viberealestatre\.com\/about-us\//g, 'about-us.html')
  .replace(/https:\/\/viberealestatre\.com\/privacy-policy\//g, 'privacy-policy.html')
  .replace(/class="vnav-cta-mobile sf-hidden"/g, 'class="vnav-cta-mobile"')
  .replace(/class="vnav-burger sf-hidden"/g, 'class="vnav-burger"');

// ---- extract all project cards & gallery slides from the source ----
const cardBlocks = extractBalancedBlocks(base, /<article class="phs-card phs-in" data-zone=(\w+)>/g, 'article');
const cards = cardBlocks.map(b => ({
  zone: /data-zone=(\w+)/.exec(b.html)[1],
  name: /<h3 class=phs-name>([^<]+)<\/h3>/.exec(b.html)[1],
  downPayment: parseFloat(/<div class=phs-stat-value>([\d.]+)<span>%/.exec(b.html)[1]),
  years: parseFloat(/الأقساط[\s\S]*?<div class=phs-stat-value>([\d.]+)</.exec(b.html)[1]),
  price: parseInt(/<span class=phs-price-value>([\d,]+)/.exec(b.html)[1].replace(/,/g, ''), 10),
  html: b.html,
}));

const slideBlocks = extractBalancedBlocks(base, /<div class=phg-slide>/g, 'div');
const slides = slideBlocks.map(b => ({
  name: (/alt="([^"]+)"/.exec(b.html) || [])[1] || '',
  html: b.html,
}));

// The gallery track originally listed the same 7 projects in the same order as the
// cards grid, plus one trailing generic "villa" slide with no card counterpart — so
// build an explicit name->slide map once (rather than relying on that position match,
// which breaks the moment a card is added that wasn't part of the original export).
const slideByName = {};
cards.forEach((c, i) => { slideByName[c.name] = slides[i]; });
function slideForProject(projectName) {
  return slideByName[projectName];
}

// ---- Unit types shown as separate badges instead of one run-on sentence ----
const UNIT_TYPES = {
  'PX Compound': { types: ['شقق', 'تاون هاوس'] },
  'Palm Parks': { types: ['شقق'], note: 'غرفتين وثلاث غرف' },
  'Jirian': { types: ['شقق', 'فيلات مستقلة'] },
  'Palm Hills New Cairo': { types: ['شقق', 'فيلات مستقلة'] },
  'VDLC (New Capital)': { types: ['شقق', 'تاون هاوس', 'فيلات مستقلة'] },
  'Hacienda Ras El Hekma': { types: ['توين هاوس', 'شاليهات'], note: '1، 2 و3 غرف' },
  '97 Hills': { types: ['تاون هاوس', 'توين هاوس', 'فيلات مستقلة'] },
};

function typeBadgesHtml(info) {
  const badges = info.types.map(t => `<span class=phs-type-badge>${t}</span>`).join('\n ');
  const note = info.note ? `\n <p class=phs-type-note>${info.note}</p>` : '';
  return `<div class=phs-types>\n ${badges}\n </div>${note}`;
}

function injectTypeBadges(html, name) {
  const info = UNIT_TYPES[name];
  if (!info) return html;
  return html.replace(/<p class=phs-type>[\s\S]*?<\/p>/, typeBadgesHtml(info));
}

// WhatsApp's own message-preview rendering doesn't apply proper bidi isolation, so an
// English project name dropped into an Arabic sentence comes out visually scrambled
// once the link opens in the app. Keeping every wa.me message pure English sidesteps
// that entirely instead of patching direction marks that don't reliably survive it.
function waHref(text) {
  return `https://wa.me/201006140168?text=${encodeURIComponent(text)}`;
}
function cardWaMessage(name) {
  return `Hi, I'm interested in ${name} — please send me the prices and payment plans.`;
}

cards.forEach(c => {
  c.html = injectTypeBadges(c.html, c.name);
  // Names starting with a digit (e.g. "97 Hills") get bidi-reordered to "Hills 97"
  // inside the surrounding RTL page unless that text run is isolated. <bdi> fixes the
  // character order without touching the heading's own (right) alignment the way
  // setting dir=ltr on the block itself would.
  c.html = c.html.replace(`<h3 class=phs-name>${c.name}</h3>`, `<h3 class=phs-name><bdi>${c.name}</bdi></h3>`);
  c.html = c.html.replace(
    /href="https:\/\/wa\.me\/201006140168\?text=[^"]*"/,
    `href="${waHref(cardWaMessage(c.name))}"`
  );
});

// ---- Use freshly downloaded, clearly-named local copies of the real live-site images
// for West/East project cards + gallery (site/assets/img/palm-hills-projects/), fetched
// directly from https://viberealestatre.com/palm-hills-projects/. Hacienda Ras Al Hekma
// is being sourced separately later, so its image (img-30 / the extracted hash file) is
// intentionally left untouched here.
function relinkCardImage(name, oldSrc, newSrc) {
  const c = cards.find(c => c.name === name);
  if (c) c.html = c.html.split(oldSrc).join(newSrc);
  const s = slideByName[name];
  if (s) s.html = s.html.split(oldSrc).join(newSrc);
}
relinkCardImage('Palm Parks', 'assets/img/e60ee6e4b326.jpg', 'assets/img/palm-hills-projects/palm-parks.jpg');

const CSS_VAR_RELINK = {
  '--sf-img-24': 'assets/img/palm-hills-projects/px-compound.png', // PX Compound
  '--sf-img-26': 'assets/img/palm-hills-projects/jirian.jpg', // Jirian
  '--sf-img-28': 'assets/img/palm-hills-projects/palm-hills-new-cairo.jpg', // Palm Hills New Cairo
  '--sf-img-29': 'assets/img/palm-hills-projects/vdlc-new-capital.jpg', // VDLC (New Capital)
};
const palmHillsCssPath = path.join(SITE, 'assets', 'css', 'palm-hills.css');
let palmHillsCss = fs.readFileSync(palmHillsCssPath, 'utf-8');
for (const [varName, newPath] of Object.entries(CSS_VAR_RELINK)) {
  palmHillsCss = palmHillsCss.replace(
    new RegExp(`${varName}: url\\("[^"]*"\\)`),
    `${varName}: url("/${newPath}")`
  );
}
fs.writeFileSync(palmHillsCssPath, palmHillsCss);

// ---- New project: 97 Hills (New Cairo / East zone) — not part of the original export ----
function buildProjectCard({ name, zone, loc, imgSrc, downPayment, years, price }) {
  const badgesHtml = typeBadgesHtml(UNIT_TYPES[name]);
  return `<article class="phs-card phs-in" data-zone=${zone}>
 <div class=phs-media>
 <img decoding=async src="${imgSrc}" alt="${name} - Palm Hills ${loc}" loading=lazy>
 <span class=phs-loc><i class="fa-solid fa-location-dot"></i> ${loc}</span>
 </div>
 <div class=phs-body>
 <h3 class=phs-name><bdi>${name}</bdi></h3>
 ${badgesHtml}
 <div class=phs-stats>
 <div class=phs-stat>
 <div class=phs-stat-label>المقدم</div>
 <div class=phs-stat-value>${downPayment}<span>%</span></div>
 </div>
 <div class=phs-divider></div>
 <div class=phs-stat>
 <div class=phs-stat-label>الأقساط</div>
 <div class=phs-stat-value>${years}<span>سنوات</span></div>
 </div>
 </div>
 <div class=phs-price>
 <span class=phs-price-label>الأسعار تبدأ من</span>
 <span class=phs-price-value>${price.toLocaleString('en-US')} <small>جنيه</small></span>
 </div>
 <div class=phs-ctas>
 <a class=phs-btn-wa href="${waHref(cardWaMessage(name))}" target=_blank rel=noopener>
 <i class="fa-brands fa-whatsapp"></i> الأسعار وخطط السداد
 </a>
 <a class=phs-btn-call href=tel:01006140168 aria-label="اتصل الآن"><i class="fa-solid fa-phone"></i></a>
 </div>
 </div>
 </article>`;
}

function buildGallerySlide({ name, loc, imgSrc }) {
  return `<div class=phg-slide>
 <img decoding=async src="${imgSrc}" alt="${name} - ${loc}" loading=lazy>
 <div class=phg-caption><i class="fa-solid fa-location-dot"></i> ${name} — ${loc}</div>
 </div>`;
}

const hills97 = {
  zone: 'newcairo',
  name: '97 Hills',
  downPayment: 5,
  years: 10,
  price: 27705000,
};
hills97.html = buildProjectCard({
  name: hills97.name,
  zone: hills97.zone,
  loc: 'القاهرة الجديدة',
  imgSrc: 'assets/img/97-hills-1.png',
  downPayment: hills97.downPayment,
  years: hills97.years,
  price: hills97.price,
});
cards.push(hills97);
slideByName['97 Hills'] = {
  name: '97 Hills - القاهرة الجديدة',
  html: buildGallerySlide({ name: '97 Hills', loc: 'القاهرة الجديدة', imgSrc: 'assets/img/97-hills-2.png' }),
};

function buildDots(count) {
  let out = '<button class="phg-dot phg-dot-active" aria-label="صورة 1"></button>';
  for (let i = 2; i <= count; i++) out += `<button class=phg-dot aria-label="صورة ${i}"></button>`;
  return out;
}

function replaceFilters(html) {
  return html.replace(/\s*<div class=phs-filters[\s\S]*?<\/div>\s*\n/, '\n');
}

function replaceCardsGrid(html, keepCards) {
  const gridMatch = /(<div class=phs-grid>\n)([\s\S]*?)(\n\s*<\/div>\n\s*\n\s*<div class=phs-footcta>)/.exec(html);
  if (!gridMatch) throw new Error('phs-grid not found');
  const newInner = keepCards.map(c => ' \n' + c.html).join('\n');
  return html.slice(0, gridMatch.index) + gridMatch[1] + newInner + gridMatch[3] + html.slice(gridMatch.index + gridMatch[0].length);
}

function replaceGallerySlides(html, keepSlides) {
  const trackMatch = /(<div class=phg-track id=phgTrack>\n)([\s\S]*?)(\n\s*<\/div>\n\s*<div class=phg-dots id=phgDots>)([\s\S]*?)(<\/div>)/.exec(html);
  if (!trackMatch) throw new Error('phg-track not found');
  const newSlides = keepSlides.map(s => ' \n' + s.html).join('\n');
  const newDots = buildDots(keepSlides.length);
  return html.slice(0, trackMatch.index)
    + trackMatch[1] + newSlides + trackMatch[3] + newDots + trackMatch[5]
    + html.slice(trackMatch.index + trackMatch[0].length);
}

function fmtPrice(n) { return n.toLocaleString('en-US'); }

function replaceHeroCta(html) {
  const blocks = extractBalancedBlocks(html, /<a class=phs-hero-cta href="[^"]*"[^>]*>/g, 'a');
  if (!blocks.length) throw new Error('phs-hero-cta not found');
  const b = blocks[0];
  const replacement = '<a class=phs-scroll-down href=#phs-projects aria-label="انتقل إلى المشاريع المتاحة">\n <i class="fa-solid fa-chevron-down"></i>\n</a>';
  return html.slice(0, b.start) + replacement + html.slice(b.end);
}

function replaceWaMessages(html, waLong, waShort) {
  // oldShort is a literal prefix of oldLong (and stays a prefix once percent-encoded),
  // and waLong is deliberately built the same way — so naive sequential replacement
  // would re-match inside the text just inserted for oldLong. Route both through
  // placeholders first so the two substitutions can never interfere with each other.
  const oldLong = 'مهتم بمشاريع بالم هيلز وعايز اعرف الأسعار';
  const oldShort = 'مهتم بمشاريع بالم هيلز';
  return html
    .split(encodeURIComponent(oldLong)).join('%%WA_LONG%%')
    .split(encodeURIComponent(oldShort)).join('%%WA_SHORT%%')
    .split('%%WA_LONG%%').join(encodeURIComponent(waLong))
    .split('%%WA_SHORT%%').join(encodeURIComponent(waShort));
}

function replaceCookieBanner(html, bannerText) {
  const blocks = extractBalancedBlocks(html, /<div class="vck vck-hide" id=vck role=region aria-label="[^"]*">/g, 'div');
  if (!blocks.length) throw new Error('vck banner not found');
  const b = blocks[0];
  const replacement = `<div class="vck vck-hide" id=vck role=region aria-label="إشعار معلومات">
 <button class=vck-close id=vckClose aria-label=إغلاق><i class="fa-solid fa-xmark"></i></button>
 <div class=vck-top>
 <div class=vck-icon><i class="fa-solid fa-bullhorn"></i></div>
 <div class=vck-body>
 <div class=vck-title>أهلاً بيك في VIBE Real Estate 👋</div>
 <div class=vck-text>
 ${bannerText}
 <a href=about-us.html>تعرف أكتر علينا</a>.
 </div>
 </div>
 </div>
 <div class=vck-actions>
 <button class=vck-accept id=vckAccept>
 <i class="fa-solid fa-check"></i> تمام
 </button>
 </div>
 <div class="vck-progress vck-run" id=vckProgress></div>
</div>`;
  return html.slice(0, b.start) + replacement + html.slice(b.end);
}

function buildPbaSection() {
  return `<section class=pba-section id=phs-contact>
 <div class=pba-wrap>
 <div class=pba-header>
 <span class=pba-eyebrow>Budget Assistant</span>
 <h2 class=pba-title>مش عارف تختار أنهي مشروع؟</h2>
 <p class=pba-subtitle>قولنا ميزانيتك وهنرشحلك المشروع الأنسب من القائمة اللي فوق</p>
 </div>
 <div class=pba-card>
 <div class=pba-fields>
 <div class=pba-field>
 <label for=pbaDown>المقدم المتاح (جنيه)</label>
 <input type=text inputmode=numeric id=pbaDown placeholder="مثال: 500,000">
 </div>
 <div class=pba-field>
 <label for=pbaMonthly>القسط الشهري المناسب (جنيه)</label>
 <input type=text inputmode=numeric id=pbaMonthly placeholder="مثال: 25,000">
 </div>
 <div class=pba-field>
 <label for=pbaYears>مدة التقسيط (سنوات)</label>
 <input type=number inputmode=numeric id=pbaYears placeholder="مثال: 8">
 </div>
 </div>
 <button class=pba-btn id=pbaSubmit type=button disabled><i class="fa-solid fa-wand-magic-sparkles"></i> اقترح لي أنسب مشروع</button>
 <div class="pba-result sf-hidden" id=pbaResult>
 <div class=pba-result-label id=pbaResultLabel>الأنسب لإمكانياتك</div>
 <div class=pba-result-name id=pbaResultName></div>
 <div class=pba-result-meta id=pbaResultMeta></div>
 <a class=pba-result-wa id=pbaResultWa href=# target=_blank rel=noopener><i class="fa-brands fa-whatsapp"></i> اعرف تفاصيل المشروع ده</a>
 <button class=pba-another id=pbaAnother type=button>مش الاختيار المناسب؟ اقترح لي غيره</button>
 </div>
 </div>
 </div>
</section>`;
}

function replaceContactForm(html) {
  const blocks = extractBalancedBlocks(html, /<div class="elementor-element elementor-element-4d798ef[^"]*"[^>]*>/g, 'div');
  if (!blocks.length) throw new Error('contact form container not found');
  const b = blocks[0];
  const openTagEnd = html.indexOf('>', b.start) + 1;
  const replacement = html.slice(b.start, openTagEnd) + '\n' + buildPbaSection() + '\n</div>';
  return html.slice(0, b.start) + replacement + html.slice(b.end);
}

function buildPage({ zones, names, heroTitle, headerTitle, headerSubtitle, outFile, pageTitle, pageDescription, waLong, waShort, bannerText }) {
  let keepCards = cards.filter(c => zones.includes(c.zone));
  if (names) keepCards = keepCards.filter(c => names.includes(c.name));
  const keepSlides = keepCards.map(c => slideForProject(c.name)).filter(Boolean);

  let html = base;
  html = replaceFilters(html);
  html = replaceCardsGrid(html, keepCards);
  html = replaceGallerySlides(html, keepSlides);
  html = replaceHeroCta(html);
  html = replaceWaMessages(html, waLong, waShort);
  html = replaceCookieBanner(html, bannerText);
  html = replaceContactForm(html);

  // Hero heading + pill text
  const minDown = Math.min(...keepCards.map(c => c.downPayment));
  const maxYears = Math.max(...keepCards.map(c => c.years));
  const minPrice = Math.min(...keepCards.map(c => c.price));
  html = html.replace(
    /<h2 data-interaction-id=0689883 class=e-heading-base>Palm Hills Projects<\/h2>/,
    `<h2 data-interaction-id=0689883 class=e-heading-base>${heroTitle}</h2>`
  );
  html = html.replace(
    /<p>مقدم يبدأ من [\d.]+% فقط, قسط يصل الى \d+ سنه&nbsp;<br>اسعار تبدأ من [\d,]+ جنيه&nbsp;<\/p>/,
    `<p>مقدم يبدأ من ${minDown}% فقط, قسط يصل الى ${maxYears} سنة&nbsp;<br>اسعار تبدأ من ${fmtPrice(minPrice)} جنيه&nbsp;</p>`
  );

  // Projects section header
  html = html.replace(
    /<h2 class=phs-title>المشاريع المتاحة<\/h2>/,
    `<h2 class=phs-title>${headerTitle}</h2>`
  );
  html = html.replace(
    /<p class=phs-subtitle>7 مشاريع في القاهرة الجديدة، غرب القاهرة، العاصمة الإدارية والساحل الشمالي<\/p>/,
    `<p class=phs-subtitle>${headerSubtitle}</p>`
  );

  const out = wrapPage({
    title: pageTitle,
    description: pageDescription,
    cssFiles: ['assets/css/vendor.css', 'assets/css/palm-hills.css', 'assets/css/custom.css'],
    bodyInner: html,
    extraScripts: ['assets/js/main.js'],
  });
  fs.writeFileSync(path.join(SITE, outFile), out);
  console.log('wrote', outFile, '-', keepCards.length, 'cards,', keepSlides.length, 'slides');
}

buildPage({
  zones: ['west'],
  heroTitle: 'Palm Hills Projects West',
  headerTitle: 'مشاريع بالم هيلز غرب القاهرة',
  headerSubtitle: '3 مشاريع في أكتوبر وزايد الجديدة من بالم هيلز ديفلوبمنتس',
  outFile: 'palm-hills-projects-west.html',
  pageTitle: 'Palm Hills Projects West – VIBE Real Estate',
  pageDescription: 'مشاريع بالم هيلز في غرب القاهرة (أكتوبر وزايد الجديدة) — أسعار وخطط سداد ومعلومات المطور.',
  waLong: "Hi, I'm interested in Palm Hills West Cairo projects — please send me the prices and payment plans.",
  waShort: "Hi, I'm interested in Palm Hills West Cairo projects.",
  bannerText: 'منصتك لمقارنة أسعار وخطط سداد مشاريع بالم هيلز في غرب القاهرة بشفافية كاملة.',
});

buildPage({
  zones: ['newcairo', 'capital'],
  heroTitle: 'Palm Hills Projects East',
  headerTitle: 'مشاريع بالم هيلز شرق القاهرة',
  headerSubtitle: '3 مشاريع في القاهرة الجديدة والعاصمة الإدارية من بالم هيلز ديفلوبمنتس',
  outFile: 'palm-hills-projects-east.html',
  pageTitle: 'Palm Hills Projects East – VIBE Real Estate',
  pageDescription: 'مشاريع بالم هيلز شرق القاهرة (القاهرة الجديدة والعاصمة الإدارية) — أسعار وخطط سداد ومعلومات المطور.',
  waLong: "Hi, I'm interested in Palm Hills East Cairo projects — please send me the prices and payment plans.",
  waShort: "Hi, I'm interested in Palm Hills East Cairo projects.",
  bannerText: 'منصتك لمقارنة أسعار وخطط سداد مشاريع بالم هيلز في شرق القاهرة بشفافية كاملة.',
});

buildPage({
  zones: ['coast'],
  names: ['Hacienda Ras El Hekma'],
  heroTitle: 'Hacienda Ras Al Hekma',
  headerTitle: 'Hacienda Ras El Hekma',
  headerSubtitle: 'مشروع بالم هيلز في رأس الحكمة — الساحل الشمالي',
  outFile: 'hacienda-ras-al-hekma.html',
  pageTitle: 'Hacienda Ras Al Hekma – VIBE Real Estate',
  pageDescription: 'Hacienda Ras Al Hekma من بالم هيلز ديفلوبمنتس في رأس الحكمة — أسعار وخطط سداد.',
  waLong: "Hi, I'm interested in Hacienda Ras Al Hekma — please send me the prices and payment plans.",
  waShort: "Hi, I'm interested in Hacienda Ras Al Hekma.",
  bannerText: 'منصتك لمعرفة أسعار وخطط سداد Hacienda Ras Al Hekma بشفافية كاملة.',
});

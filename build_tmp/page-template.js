function wrapPage({ title, description, cssFiles, bodyInner, extraHead = '', extraScripts = [] }) {
  const cssLinks = cssFiles.map(f => `  <link rel="stylesheet" href="${f}">`).join('\n');
  const scriptTags = extraScripts.map(f => `  <script src="${f}" defer></script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
${cssLinks}
${extraHead}
</head>
<body>
${bodyInner}
${scriptTags}
</body>
</html>
`;
}

module.exports = { wrapPage };

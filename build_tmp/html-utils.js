// Extract balanced blocks of a given tag, e.g. all <article ...>...</article> or
// <div class=phg-slide>...</div>, by counting nested open/close tags of the same name.
function extractBalancedBlocks(html, openTagRegex, tagName) {
  const blocks = [];
  const openRe = new RegExp('<' + tagName + '(?=[\\s>])', 'gi');
  const closeTag = '</' + tagName + '>';
  let m;
  while ((m = openTagRegex.exec(html))) {
    const start = m.index;
    // find the matching close by counting nested opens/closes of tagName from start
    let depth = 0;
    let i = start;
    let end = -1;
    const scanRe = new RegExp('<' + tagName + '(?=[\\s>])|</' + tagName + '>', 'gi');
    scanRe.lastIndex = start;
    let sm;
    while ((sm = scanRe.exec(html))) {
      if (sm[0].toLowerCase() === closeTag) {
        depth--;
        if (depth === 0) { end = sm.index + closeTag.length; break; }
      } else {
        depth++;
      }
    }
    if (end === -1) throw new Error('Unbalanced tag ' + tagName + ' at ' + start);
    blocks.push({ start, end, html: html.slice(start, end) });
    openTagRegex.lastIndex = end;
  }
  return blocks;
}

module.exports = { extractBalancedBlocks };

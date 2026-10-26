// Consumer syntax belongs to the pinned CSS parser, never a hand-written escape lexer.
import { parse, walk } from 'css-tree';
import { failure } from './policy.mjs';
import postcss from 'postcss';
export const decodePercent = value => {
  try { return decodeURIComponent(value); } catch { return value; }
};
export function cssValues(source, context = 'stylesheet') {
  // PostCSS rejects incomplete syntax rather than applying CSS Syntax EOF recovery.
  // css-tree supplies the decoded value tree; neither boundary nor escape grammar is hand-written.
  try { postcss.parse(context === 'stylesheet' ? source : context === 'declarationList' ? `p{${source}}` : `p{content:${source}}`, { from: undefined }); }
  catch { throw failure('publication-decode'); }
  let invalid = false;
  const ast = parse(source, { context, parseCustomProperty: true, onParseError() { invalid = true; } });
  if (invalid) throw failure('publication-decode');
  const values = [];
  walk(ast, node => {
    if (node.type === 'String') values.push(node.value);
    if (node.type === 'Url') values.push(node.value, decodePercent(node.value));
    if (node.type === 'Value') {
      let strings = [];
      for (const child of node.children) {
        if (child.type === 'String') strings.push(child.value);
        else if (strings.length) { values.push(strings.join('')); strings = []; }
      }
      if (strings.length) values.push(strings.join(''));
    }
  });
  return values;
}

// Port of the design-system CSS decoder: six-digit escapes, optional whitespace and escaped string newlines.
// This lexer extracts publication values; it does not execute CSS or attempt browser error recovery.
function escape(source, index, string = false) {
  index += 1;
  if (index >= source.length) throw new Error('incomplete CSS escape');
  if (source[index] === '\n') {
    if (!string) throw new Error('newline in CSS identifier escape');
    return ['', index + 1];
  }
  const hex = /^[0-9a-f]{1,6}/iu.exec(source.slice(index));
  if (hex) {
    const value = Number.parseInt(hex[0], 16);
    const character = value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : '\ufffd';
    index += hex[0].length;
    if ([' ', '\t', '\n', '\f'].includes(source[index])) index += 1;
    return [character, index];
  }
  return [source[index], index + 1];
}
const wordCharacter = character => character !== undefined && (/[a-z0-9_\\-]/iu.test(character) || character.charCodeAt(0) >= 128);
const symbol = (token, value) => token?.kind === 'symbol' && token.value === value;

export function tokenize(source) {
  source = source.replace(/\r\n?|\f/gu, '\n').replaceAll('\0', '\ufffd');
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    let character = source[index];
    if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) throw new Error('unterminated CSS comment');
      index = end + 2;
    } else if (/\s/u.test(character)) {
      const start = index++;
      while (index < source.length && /\s/u.test(source[index])) index += 1;
      tokens.push({ kind: 'space', value: source.slice(start, index) });
    } else if (['"', "'"].includes(character)) {
      const quote = character;
      let value = '';
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\n') throw new Error('newline in CSS string');
        if (source[index] === '\\') [character, index] = escape(source, index, true);
        else character = source[index++];
        value += character;
      }
      if (index >= source.length) throw new Error('unterminated CSS string');
      index += 1;
      tokens.push({ kind: 'string', value });
    } else if (wordCharacter(character)) {
      let value = '';
      while (index < source.length && wordCharacter(source[index])) {
        if (source[index] === '\\') [character, index] = escape(source, index);
        else character = source[index++];
        value += character;
      }
      tokens.push({ kind: source[index] === '(' ? 'function' : 'word', value });
    } else tokens.push({ kind: 'symbol', value: source[index++] });
  }
  return tokens;
}

function serialize(tokens) {
  let output = '', previous;
  for (const token of tokens) {
    if (previous?.kind === 'word' && (['word', 'function'].includes(token.kind) || symbol(token, '('))) output += ' ';
    output += token.kind === 'string' ? '"' + token.value.replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"' : token.value;
    previous = token;
  }
  return output.trim();
}

// Like URL percent decoding, malformed escape text remains literal and invalid UTF-8 bytes become replacements.
export const decodePercent = value => value.replace(/(?:%[0-9a-f]{2})+/giu, bytes => Buffer.from(bytes.replaceAll('%', ''), 'hex').toString('utf8'));

export function cssValues(source) {
  const tokens = tokenize(source);
  const values = [serialize(tokens)];
  for (const [index, token] of tokens.entries()) {
    if (token.kind !== 'function' || token.value.toLowerCase() !== 'url') continue;
    let end = index + 2;
    while (end < tokens.length && !symbol(tokens[end], ')')) end += 1;
    const argument = tokens.slice(index + 2, end).filter(token => token.kind !== 'space');
    const value = argument.length === 1 && argument[0].kind === 'string' ? argument[0].value : serialize(argument);
    values.push(decodePercent(value));
  }
  let group = [];
  for (const token of tokens) {
    if (token.kind === 'string') group.push(token.value);
    else if (token.kind !== 'space' && group.length) { values.push(group.join('')); group = []; }
  }
  if (group.length) values.push(group.join(''));
  return values;
}

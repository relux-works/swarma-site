// Policy comparisons tolerate ordinary Unicode layout and invisible formatting, without decoding source syntax.
const invisible = /[\u00ad\u180e\u200b-\u200d\u2060\ufeff]/gu;
const whitespace = /[\s\p{Z}]+/gu;
const separator = /[\s\p{Z}\u00ad\u180e\u200b-\u200d\u2060\ufeff]/u;
export const normalizeText = value => String(value).replace(invisible, '').replace(whitespace, ' ').trim();
export const compactText = value => normalizeText(value).replaceAll(' ', '').toLowerCase();
export function includesToken(value, token) {
  const expected = compactText(token);
  return Boolean(expected) && compactText(value).includes(expected);
}

// Map the comparison back to original UTF-16 ranges so redaction removes formatting inside matching literals too.
export function tokenRanges(value, tokens) {
  const positions = [];
  let compact = '', offset = 0;
  for (const character of value) {
    const end = offset + character.length;
    if (!separator.test(character)) {
      const lower = character.toLowerCase();
      compact += character;
      for (let index = 0; index < lower.length; index += 1) positions.push([offset, end]);
    }
    offset = end;
  }
  compact = compact.toLowerCase();
  const ranges = [];
  for (const token of tokens) {
    const expected = compactText(token);
    if (!expected) continue;
    for (let start = compact.indexOf(expected); start !== -1; start = compact.indexOf(expected, start + 1)) {
      ranges.push([positions[start][0], positions[start + expected.length - 1][1]]);
    }
  }
  const merged = [];
  for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

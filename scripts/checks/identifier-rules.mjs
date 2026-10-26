// The policy patterns and planted controls are intentionally outside publication scan roots.
export const rules = [
  ['matrix-user', /@[A-Za-z0-9._=+\/-]+:[A-Za-z0-9.-]+/u],
  ['matrix-event', /\$[A-Za-z0-9_-]{20,}/u],
  ['matrix-room', /![A-Za-z0-9_-]{20,}(?::[A-Za-z0-9.-]+)?/u],
  ['board-id', /\b(?:TASK|STORY|BUG|EPIC)-\d{6}-[a-z0-9]{6}\b/u],
  ['workplace-name', /\b[\w-]+-(?:dev|rev)\d+\b|\b[\w-]+_(?:dev|rev|orch)\d*\b/iu],
  ['local-path', /\/Users\/|\/home\/[^\s/]+|~\/|C:\\Users/iu],
  ['session-link', /claude\.ai\/code\/session_|chatgpt\.com\/codex\//iu],
];

export function identifierRules(text, allowlist) {
  const found = rules.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  for (const match of text.matchAll(/github\.com\/relux-works\/([A-Za-z0-9_.-]+)/giu)) {
    const repo = match[1].replace(/\.git$/i, '');
    if (!allowlist.repositories.includes(repo)) found.push('private-repository');
  }
  for (const match of text.matchAll(/[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/gu)) {
    if (!allowlist.emails.includes(match[0])) found.push('email');
  }
  return [...new Set(found)];
}

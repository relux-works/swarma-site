import { attributes, cli, scanText, visibleText } from './lib.mjs';

const forbidden = /\bSwarm\s+(?:Runtime|Protocol|Chain|Keeper|Curator|Signer)\b|\bColony\b|\bSwarm\s+cell\b|(?<![\p{L}\p{N}_])(?:пасек[а-яё]*|улей|ульи|пч[её]л[а-яё]*|соты)(?![\p{L}\p{N}_])|\bApiary\b|\bslopcore\b|\bwaggle\b/iu;
export function nameRules(text) { return forbidden.test(text) ? ['canonical-name'] : []; }
export async function check(root) {
  return scanText(root, text => nameRules(`${text}\n${visibleText(text)}\n${attributes(text, { accessible: true })}`));
}
await cli(import.meta.url, check);

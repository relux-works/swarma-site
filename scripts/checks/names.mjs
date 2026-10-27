import { createHash } from 'node:crypto';
import { deploymentFiles } from './deployment.mjs';
import { relative } from 'node:path';
import { cli, scanFiles } from './lib.mjs';
import { publicationReader } from './publication-values.mjs';
import { readPublication } from './publication-reader.mjs';
import { normalizeText } from './publication/normalization.mjs';

const forbidden = /\bSwarm\s+(?:Runtime|Protocol|Chain|Keeper|Curator|Signer)\b|\bColony\b|\bSwarm\s+cell\b|(?<![\p{L}\p{N}_])(?:пасек[а-яё]*|улей|ульи|пч[её]л[а-яё]*|соты)(?![\p{L}\p{N}_])|\bApiary\b|\bslopcore\b|\bwaggle\b/iu;
export function nameRules(text) { return forbidden.test(normalizeText(text)) ? ['canonical-name'] : []; }
// Infrastructure products are replaced by their role in reader-facing content.
export const infrastructureProducts = ['Matrix', 'Synapse', 'Dendrite', 'Conduit', 'Element', 'Draupnir', 'Mautrix', 'Tailscale', 'Headscale', 'WireGuard', 'OpenVPN', 'ZeroTier', 'NetBird', 'Cloudflare', 'Vercel', 'Netlify', 'Hetzner', 'DigitalOcean', 'AWS', 'Amazon Web Services', 'Google Cloud', 'Azure', 'libp2p', 'IPFS', 'Hypercore', 'KVM', 'QEMU', 'Proxmox', 'VMware', 'VirtualBox', 'Docker', 'Podman', 'Kubernetes'];
export function infrastructureRules(text) {
  text = normalizeText(text);
  return infrastructureProducts.some(name => new RegExp(`(?<![\\p{L}\\p{N}_])${name}(?![\\p{L}\\p{N}_])`, 'iu').test(text)) ? ['infrastructure-product'] : [];
}
export async function check(root) {
  const reader = await publicationReader(root), errors = [];
  let pins;
  try {
    pins = await deploymentFiles(root);
    errors.push(...pins.errors);
  } catch (error) {
    if (error.code !== 'ENOENT') errors.push('deployment-config: invalid pinned files');
  }
  try {
    for (const file of await scanFiles(root)) {
      const path = relative(root, file);
      try {
        const { bytes, text, binary } = await readPublication(file);
        if (binary) continue;
        const { prose, values } = await reader.values(path, text);
        if ([text, ...prose, ...values].some(value => nameRules(value).length)) errors.push(`${path}: canonical-name`);
        if ((path.startsWith('src/content/') || (path.startsWith('dist/') && /\.html?$/u.test(path)))
          && [...prose, ...values].some(value => infrastructureRules(value).length)) errors.push(`${path}: infrastructure-product`);
        // Only these exact path/hash pairs admit protocol metadata; neighboring files remain scanned.
        const delegation = /^(?:public|dist)\/\.well-known\//u.test(path);
        const headers = ['public/_headers', 'dist/_headers'].includes(path);
        if (delegation || headers) {
          const pin = pins?.policy.allow.find(entry => entry.path === path);
          const approved = pin && createHash('sha256').update(bytes).digest('hex') === pin.sha256;
          if (!approved) {
            const lines = text.split(/\r?\n/u);
            const selector = pins?.policy.headerSelectors.find(entry => entry.paths.includes(path));
            const index = selector ? lines.indexOf(selector.line) : -1;
            // Remove one exact selector occurrence, so a duplicate or any second product line still rejects.
            if (index >= 0) lines.splice(index, 1);
            if (infrastructureRules(`${path}\n${lines.join('\n')}`).length) errors.push(`${path}: infrastructure-product`);
          }
        }
      } catch (error) { errors.push(`${path}: ${error.rule === 'publication-decode' ? error.rule : 'publication-decode'}`); }
    }
  } finally { await reader.close(); }
  return [...new Set(errors)];
}
await cli(import.meta.url, check);

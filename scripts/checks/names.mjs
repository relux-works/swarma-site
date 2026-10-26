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

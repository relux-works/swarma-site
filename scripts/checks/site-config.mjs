import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function publicConfig(root) {
  const read = name => JSON.parse(readFileSync(resolve(root, `config/${name}.json`), 'utf8'));
  const site = read('site'), repositories = read('repos');
  if (typeof site?.github_org !== 'string' || typeof site?.contact_email !== 'string'
    || !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/.test(site.github_org)
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contact_email)
    || !Array.isArray(repositories)
    || repositories.some(repo => typeof repo?.name !== 'string' || !/^[a-z\d][a-z\d._-]*$/.test(repo.name)
      || typeof repo.description_key !== 'string' || !repo.description_key
      || Object.keys(repo).some(key => !['name', 'description_key'].includes(key)))
    || new Set(repositories.map(repo => repo.name)).size !== repositories.length) throw new Error('identifier-allowlist: invalid configuration');
  return { site, repositories, allowlist: { repositories: repositories.map(repo => `https://github.com/${site.github_org}/${repo.name}`), emails: [site.contact_email] } };
}

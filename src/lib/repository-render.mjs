import site from '../../config/site.json' with { type: 'json' };
import repositories from '../../config/repos.json' with { type: 'json' };
import { repositoryDescriptions } from './repository-descriptions.mjs';
import { escape, renderStatus } from './status-render.mjs';

export function repositoryEntries(lang, options = {}) {
  const config = { site, repositories, ...options };
  return `<ul class="repository-list">${config.repositories.map(repo => {
    const description = repositoryDescriptions[repo.description_key]?.[lang];
    if (!description) throw new Error(`unknown-repository-description: ${repo.description_key}`);
    const prose = escape(description).replace(/`([^`]+)`/g, '<code>$1</code>');
    const url = `https://github.com/${config.site.github_org}/${repo.name}`;
    const status = repo.status_rows.length ? renderStatus({ ids: repo.status_rows, lang, idPrefix: `status-excerpt-repo-${repo.name}`, labelledBy: `repo-${repo.name}` }) : '';
    return `<li class="repository-row"><div class="repository-summary"><a id="repo-${escape(repo.name)}" class="repository-name" dir="ltr" href="${escape(url)}">${escape(repo.name)}</a><p>${prose}</p></div>${status}</li>`;
  }).join('')}</ul>`;
}

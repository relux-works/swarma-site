import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import conventions from './src/lib/markdown-conventions.mjs';
// Markdown output depends on versioned data as well as page text; config moves must invalidate it.
const renderingFiles = ['config/site.json', 'config/repos.json',
  ...['markdown-conventions', 'content-data', 'repository-render', 'repository-descriptions', 'strings'].map(name => `src/lib/${name}.mjs`),
  ...['book-chapters', 'publications', 'figures'].map(name => `src/data/${name}.json`),
  ...['three-layers', 'protocol-topology', 'sublayers'].map(name => `src/assets/book-figures/${name}.svg`),
];
const revision = createHash('sha256');
for (const path of renderingFiles) revision.update(readFileSync(new URL(path, import.meta.url)));
const renderingRevision = revision.digest('hex').slice(0, 16);
const figures = process.env.SWARMA_BOOK_FIGURES === '1';

export default defineConfig({
  output: 'static',
  // Isolate the content store: switching figures must never reuse a private rendering.
  cacheDir: `./.temp/astro-cache/${figures ? 'figures-on' : 'figures-off'}-${renderingRevision}/`,
  trailingSlash: 'always',
  markdown: { processor: unified({ smartypants: false, remarkPlugins: [[conventions, { figures }]] }) },
});

import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import conventions from './src/lib/markdown-conventions.mjs';
import { validateStatusSources } from './src/lib/status-safety.mjs';
validateStatusSources(new URL('./src/lib/', import.meta.url));
const figures = process.env.SWARMA_BOOK_FIGURES === '1';

export default defineConfig({
  output: 'static',
  // Isolate the content store: switching figures must never reuse a private rendering.
  cacheDir: figures ? './.temp/astro-cache/figures-on/' : './.temp/astro-cache/figures-off/',
  trailingSlash: 'always',
  markdown: { processor: unified({ smartypants: false, remarkPlugins: [[conventions, { figures }]] }) },
});

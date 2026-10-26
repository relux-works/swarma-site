import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pageSchema, pageId } from './lib/page-schema.mjs';

const pages = defineCollection({
  loader: glob({ pattern: '{ru,en}/**/*.md', base: './src/content/pages', generateId: pageId }),
  schema: pageSchema,
});

export const collections = { pages };

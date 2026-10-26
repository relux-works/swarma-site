import { z } from 'zod';

export const pageId = ({ entry }) => entry.replace(/\.md$/, '');

export const pageSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  order: z.number().finite(),
  nav: z.boolean(),
}).strict();

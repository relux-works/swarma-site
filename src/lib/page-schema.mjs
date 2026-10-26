import { z } from 'zod';

export const pageId = ({ entry }) => entry.replace(/\.md$/, '');

export const pageSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  order: z.number().finite(),
  nav: z.boolean(),
  status_rows: z.array(z.string().min(1)).min(1).optional(),
  status_table: z.literal('full').optional(),
}).strict().refine(data => !(data.status_rows && data.status_table), { message: 'Choose status_rows or status_table' });

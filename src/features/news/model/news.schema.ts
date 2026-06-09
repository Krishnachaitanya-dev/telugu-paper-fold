import { z } from 'zod';

export const newsUpdateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  image_url: z.string().nullable(),
  source_url: z.string().nullable(),
  source_name: z.string().nullable(),
  created_at: z.string(),
  reporter_id: z.string().nullable().optional(),
  reporter_name: z.string().nullable().optional(),
  reporter_avatar_url: z.string().nullable().optional(),
  fact_check_status: z.enum(['verified', 'developing', 'unverified', 'factcheck']).nullable().optional(),
});

export type NewsUpdate = z.infer<typeof newsUpdateSchema>;

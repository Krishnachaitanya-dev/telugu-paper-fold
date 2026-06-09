import { z } from 'zod';

export const reporterProfileSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ReporterProfile = z.infer<typeof reporterProfileSchema>;

export const REPORTER_NEWS_IMAGES_BUCKET = 'reporter-news-images';

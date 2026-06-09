import { z } from 'zod';

export const reelSchema = z.object({
  id: z.string(),
  video_id: z.string(),
  title: z.string(),
  channel: z.string(),
  tag: z.string().nullable(),
  category: z.string().nullable().optional(),
  source_url: z.string().nullable(),
  sort_order: z.number().nullable(),
  created_at: z.string().optional(),
  is_short: z.boolean().nullable().optional(),
  aspect_ratio: z.string().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  reporter_id: z.string().nullable().optional(),
  reporter_name: z.string().nullable().optional(),
  reporter_avatar_url: z.string().nullable().optional(),
});

export type Reel = z.infer<typeof reelSchema>;

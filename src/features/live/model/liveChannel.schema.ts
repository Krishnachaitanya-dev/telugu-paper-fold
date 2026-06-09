import { z } from 'zod';

export const liveChannelSchema = z.object({
  id: z.string(),
  channel_name: z.string(),
  badge: z.string().nullable(),
  description: z.string().nullable(),
  video_id: z.string().nullable(),
  official_url: z.string().nullable(),
  logo_url: z.string().nullable(),
  is_active: z.boolean().nullable(),
  sort_order: z.number().nullable(),
});

export type LiveChannel = z.infer<typeof liveChannelSchema>;

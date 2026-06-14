import { z } from 'zod'
import { sourceTypeEnum } from './enums'

/**
 * Schema validasi untuk video source (input pipeline).
 * URL harus valid URI, durasi minimal 60 detik.
 */
export const sourceSchema = z.object({
  source_id: z.string().optional(),
  url: z.string().url('URL harus valid URI'),
  type: sourceTypeEnum,
  duration_seconds: z.number().min(60, 'Video minimal 60 detik'),
  language: z.string().default('id'),
  creator: z.string().optional(),
  episode_title: z.string().optional(),
  published_at: z.string().datetime().optional(),
})

export type Source = z.infer<typeof sourceSchema>

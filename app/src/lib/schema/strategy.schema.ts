import { z } from 'zod'
import { hookTypeEnum, emotionEnum, nicheEnum, platformEnum } from './enums'

/**
 * Schema untuk satu klip hasil analisis AI.
 * Format clip_id: clip_XXX (tiga digit angka)
 * Durasi: 7-90 detik
 * Virality score: 0-100
 */
export const clipSchema = z.object({
  clip_id: z.string().regex(/^clip_[0-9]{3}$/, 'Format clip_id: clip_XXX'),
  start_time: z.number().min(0),
  end_time: z.number(),
  duration: z.number().min(7, 'Minimal 7 detik').max(90, 'Maksimal 90 detik'),
  hook_type: hookTypeEnum,
  virality_score: z
    .number()
    .min(0, 'Virality score minimal 0')
    .max(100, 'Virality score maksimal 100'),
  emotion_trigger: emotionEnum.optional(),
  transcript_snippet: z.string().max(500, 'Maksimal 500 karakter').optional(),
  ai_suggested_title: z.string().max(100).optional(),
  ai_reasoning: z.string().optional(),
  human_approved: z.boolean().default(false),
  b_roll_url: z.string().url().optional(),
  // Score breakdown per dimensi (0-10)
  score_breakdown: z
    .object({
      hook_strength: z.number().min(0).max(10),
      emotional_impact: z.number().min(0).max(10),
      quotability: z.number().min(0).max(10),
      optimal_duration: z.number().min(0).max(10),
    })
    .optional(),
})

/**
 * Schema untuk strategy.json — output utama AI Analyzer.
 * Berisi metadata konten dan array klip terpilih.
 */
export const strategySchema = z.object({
  strategy_id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  niche: nicheEnum,
  target_platform: z.array(platformEnum).min(1),
  clips: z.array(clipSchema).min(1).max(20),
})

export type Clip = z.infer<typeof clipSchema>
export type Strategy = z.infer<typeof strategySchema>

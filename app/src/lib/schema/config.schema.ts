import { z } from 'zod'
import { hookTypeEnum, emotionEnum, nicheEnum, platformEnum } from './enums'

/**
 * Konfigurasi parameter analisis AI.
 * Semua nilai ini dapat diubah melalui UI Settings.
 */
export const analysisConfigSchema = z
  .object({
    model: z
      .enum(['gemini-2.5-flash', 'gemini-2.5-pro'])
      .default('gemini-2.5-flash'),
    min_clips: z.number().min(1).max(5).default(3),
    max_clips: z.number().min(5).max(20).default(7),
    min_duration_seconds: z.number().min(7).max(30).default(15),
    max_duration_seconds: z.number().min(30).max(90).default(60),
    virality_threshold: z.number().min(50).max(95).default(70),
    preferred_hook_types: z
      .array(hookTypeEnum)
      .default(['bold_claim', 'story_arc', 'contrarian']),
    target_emotions: z
      .array(emotionEnum)
      .default(['inspiration', 'curiosity', 'surprise']),
    niche: nicheEnum.default('motivation'),
    source_language: z.string().default('id'),
    target_platforms: z.array(platformEnum).default(['tiktok', 'youtube_shorts']),
    require_human_approval: z.boolean().default(true),
    thinking_depth: z
      .enum(['minimal', 'low', 'medium', 'high'])
      .default('low'),
  })
  .refine((data) => data.min_clips <= data.max_clips, {
    message: 'min_clips harus <= max_clips',
    path: ['min_clips'],
  })

/**
 * Konfigurasi render video output.
 * Semua nilai ini dapat diubah melalui UI Settings.
 */
export const renderConfigSchema = z.object({
  resolution: z.enum(['1080x1920', '720x1280']).default('1080x1920'),
  aspect_ratio: z.enum(['9:16', '1:1', '16:9']).default('9:16'),
  caption_enabled: z.boolean().default(true),
  caption_font_size: z.number().min(32).max(72).default(48),
  caption_position: z.enum(['top', 'middle', 'bottom']).default('bottom'),
  caption_style: z
    .enum(['word_by_word', 'full_line'])
    .default('full_line'),
  caption_bg_color: z.string().default('#000000'),
  caption_text_color: z.string().default('#FFFFFF'),
  contrast: z.number().min(-50).max(50).default(10),
  brightness: z.number().min(-50).max(50).default(0),
  saturation: z.number().min(-50).max(50).default(12),
})

/**
 * Konfigurasi API Key Manager.
 */
export const keyManagerConfigSchema = z.object({
  api_keys: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      enabled: z.boolean().default(true),
    })
  ),
  rotation_strategy: z
    .enum(['round_robin', 'least_used', 'random'])
    .default('round_robin'),
  cooldown_seconds: z.number().min(30).max(300).default(60),
  max_retries: z.number().min(1).max(10).default(3),
})

export type AnalysisConfig = z.infer<typeof analysisConfigSchema>
export type RenderConfig = z.infer<typeof renderConfigSchema>
export type KeyManagerConfig = z.infer<typeof keyManagerConfigSchema>

// Pre-parsed default configs
export const defaultAnalysisConfig = analysisConfigSchema.parse({})
export const defaultRenderConfig = renderConfigSchema.parse({})

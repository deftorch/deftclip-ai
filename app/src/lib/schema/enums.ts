import { z } from 'zod'

// ─── Enums (shared across schemas) ───────────────────────────────────────────

export const hookTypeEnum = z.enum([
  'bold_claim',
  'contrarian',
  'preview_hook',
  'question_hook',
  'story_arc',
  'punchline',
])

export const emotionEnum = z.enum([
  'surprise',
  'curiosity',
  'anger',
  'inspiration',
  'humor',
  'fear',
  'joy',
])

export const nicheEnum = z.enum([
  'motivation',
  'finance',
  'gaming',
  'comedy',
  'education',
  'politics',
  'sports',
  'lifestyle',
  'tech',
])

export const platformEnum = z.enum([
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
])

export const sourceTypeEnum = z.enum([
  'podcast',
  'stream',
  'interview',
  'seminar',
  'sports',
  'news',
  'comedy',
  'faceless',
])

export type HookType = z.infer<typeof hookTypeEnum>
export type Emotion = z.infer<typeof emotionEnum>
export type Niche = z.infer<typeof nicheEnum>
export type Platform = z.infer<typeof platformEnum>
export type SourceType = z.infer<typeof sourceTypeEnum>

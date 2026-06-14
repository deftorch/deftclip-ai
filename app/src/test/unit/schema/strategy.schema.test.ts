import { describe, it, expect } from 'vitest'
import { clipSchema, strategySchema } from '@/lib/schema/strategy.schema'

describe('clipSchema', () => {
  const validClip = {
    clip_id: 'clip_001',
    start_time: 100,
    end_time: 131,
    duration: 31,
    hook_type: 'bold_claim' as const,
    virality_score: 85,
    emotion_trigger: 'inspiration' as const,
    transcript_snippet: 'Test snippet',
    ai_suggested_title: 'Test title',
    human_approved: false,
  }

  it('harus accept clip yang valid', () => {
    expect(() => clipSchema.parse(validClip)).not.toThrow()
  })

  it('harus reject duration < 7 detik', () => {
    expect(() => clipSchema.parse({ ...validClip, duration: 3 })).toThrow()
  })

  it('harus reject duration = 6 (batas bawah)', () => {
    expect(() => clipSchema.parse({ ...validClip, duration: 6 })).toThrow()
  })

  it('harus accept duration = 7 (batas minimum)', () => {
    expect(() => clipSchema.parse({ ...validClip, duration: 7 })).not.toThrow()
  })

  it('harus reject duration > 90 detik', () => {
    expect(() => clipSchema.parse({ ...validClip, duration: 100 })).toThrow()
  })

  it('harus accept duration = 90 (batas maksimum)', () => {
    expect(() => clipSchema.parse({ ...validClip, duration: 90 })).not.toThrow()
  })

  it('harus reject virality_score < 0', () => {
    expect(() => clipSchema.parse({ ...validClip, virality_score: -1 })).toThrow()
  })

  it('harus reject virality_score > 100', () => {
    expect(() => clipSchema.parse({ ...validClip, virality_score: 101 })).toThrow()
  })

  it('harus accept virality_score = 0 dan 100 (batas)', () => {
    expect(() => clipSchema.parse({ ...validClip, virality_score: 0 })).not.toThrow()
    expect(() => clipSchema.parse({ ...validClip, virality_score: 100 })).not.toThrow()
  })

  it('harus reject hook_type tidak valid', () => {
    expect(() => clipSchema.parse({ ...validClip, hook_type: 'funny' })).toThrow()
  })

  it('harus accept semua hook_type yang valid', () => {
    const hooks = ['bold_claim', 'contrarian', 'preview_hook', 'question_hook', 'story_arc', 'punchline']
    hooks.forEach((hook_type) => {
      expect(() => clipSchema.parse({ ...validClip, hook_type })).not.toThrow()
    })
  })

  it('harus reject clip_id tidak sesuai pattern (format salah)', () => {
    expect(() => clipSchema.parse({ ...validClip, clip_id: 'clip-1' })).toThrow()
  })

  it('harus reject clip_id tanpa prefix clip_', () => {
    expect(() => clipSchema.parse({ ...validClip, clip_id: '001' })).toThrow()
  })

  it('harus reject clip_id dengan huruf setelah clip_', () => {
    expect(() => clipSchema.parse({ ...validClip, clip_id: 'clip_abc' })).toThrow()
  })

  it('harus set human_approved default false', () => {
    const result = clipSchema.parse({ ...validClip, human_approved: undefined })
    expect(result.human_approved).toBe(false)
  })

  it('harus reject transcript_snippet > 500 karakter', () => {
    const longText = 'a'.repeat(501)
    expect(() => clipSchema.parse({ ...validClip, transcript_snippet: longText })).toThrow()
  })

  it('harus accept transcript_snippet = 500 karakter (batas)', () => {
    const text = 'a'.repeat(500)
    expect(() => clipSchema.parse({ ...validClip, transcript_snippet: text })).not.toThrow()
  })

  it('harus accept score_breakdown opsional', () => {
    const withBreakdown = {
      ...validClip,
      score_breakdown: {
        hook_strength: 8,
        emotional_impact: 9,
        quotability: 7,
        optimal_duration: 8,
      },
    }
    expect(() => clipSchema.parse(withBreakdown)).not.toThrow()
  })
})

describe('strategySchema', () => {
  const validClip = {
    clip_id: 'clip_001',
    start_time: 100,
    end_time: 131,
    duration: 31,
    hook_type: 'bold_claim' as const,
    virality_score: 85,
  }

  const validStrategy = {
    niche: 'motivation' as const,
    target_platform: ['tiktok' as const],
    clips: [validClip],
  }

  it('harus accept strategy yang valid', () => {
    expect(() => strategySchema.parse(validStrategy)).not.toThrow()
  })

  it('harus require niche, target_platform, clips', () => {
    expect(() => strategySchema.parse({})).toThrow()
  })

  it('harus reject clips kosong (minItems: 1)', () => {
    expect(() => strategySchema.parse({ ...validStrategy, clips: [] })).toThrow()
  })

  it('harus reject lebih dari 20 clips', () => {
    const manyClips = Array.from({ length: 21 }, (_, i) => ({
      ...validClip,
      clip_id: `clip_${String(i + 1).padStart(3, '0')}`,
    }))
    expect(() => strategySchema.parse({ ...validStrategy, clips: manyClips })).toThrow()
  })

  it('harus accept tepat 20 clips (batas maksimum)', () => {
    const maxClips = Array.from({ length: 20 }, (_, i) => ({
      ...validClip,
      clip_id: `clip_${String(i + 1).padStart(3, '0')}`,
    }))
    expect(() => strategySchema.parse({ ...validStrategy, clips: maxClips })).not.toThrow()
  })

  it('harus reject target_platform kosong', () => {
    expect(() => strategySchema.parse({ ...validStrategy, target_platform: [] })).toThrow()
  })

  it('harus reject niche yang tidak valid', () => {
    expect(() => strategySchema.parse({ ...validStrategy, niche: 'cooking' })).toThrow()
  })
})

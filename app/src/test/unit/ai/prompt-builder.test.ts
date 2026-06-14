import { describe, it, expect } from 'vitest'
import { buildAnalysisPrompt } from '@/lib/ai/prompt-builder'
import { defaultAnalysisConfig } from '@/lib/schema/config.schema'

describe('buildAnalysisPrompt', () => {
  it('harus include niche dalam prompt', () => {
    const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, niche: 'finance' })
    expect(prompt.toLowerCase()).toContain('finance')
  })

  it('harus include target_platforms dalam prompt', () => {
    const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, target_platforms: ['tiktok'] })
    expect(prompt.toLowerCase()).toContain('tiktok')
  })

  it('harus include multiple platforms dalam prompt', () => {
    const prompt = buildAnalysisPrompt({
      ...defaultAnalysisConfig,
      target_platforms: ['tiktok', 'youtube_shorts'],
    })
    expect(prompt.toLowerCase()).toContain('tiktok')
    expect(prompt.toLowerCase()).toContain('youtube_shorts')
  })

  it('harus include virality_threshold dalam prompt', () => {
    const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, virality_threshold: 80 })
    expect(prompt).toContain('80')
  })

  it('harus include min_duration dalam prompt', () => {
    const prompt = buildAnalysisPrompt({
      ...defaultAnalysisConfig,
      min_duration_seconds: 15,
    })
    expect(prompt).toContain('15')
  })

  it('harus include max_duration dalam prompt', () => {
    const prompt = buildAnalysisPrompt({
      ...defaultAnalysisConfig,
      max_duration_seconds: 60,
    })
    expect(prompt).toContain('60')
  })

  it('harus include instruksi Bahasa Indonesia jika source_language = id', () => {
    const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, source_language: 'id' })
    expect(prompt.toLowerCase()).toContain('indonesia')
  })

  it('harus include preferred_hook_types dalam prompt', () => {
    const prompt = buildAnalysisPrompt({
      ...defaultAnalysisConfig,
      preferred_hook_types: ['bold_claim', 'contrarian'],
    })
    expect(prompt).toContain('bold_claim')
    expect(prompt).toContain('contrarian')
  })

  it('harus include target_emotions dalam prompt', () => {
    const prompt = buildAnalysisPrompt({
      ...defaultAnalysisConfig,
      target_emotions: ['inspiration', 'curiosity'],
    })
    expect(prompt).toContain('inspiration')
    expect(prompt).toContain('curiosity')
  })

  it('harus menghasilkan prompt berbeda untuk config berbeda (niche)', () => {
    const prompt1 = buildAnalysisPrompt({ ...defaultAnalysisConfig, niche: 'motivation' })
    const prompt2 = buildAnalysisPrompt({ ...defaultAnalysisConfig, niche: 'gaming' })
    expect(prompt1).not.toBe(prompt2)
  })

  it('harus menghasilkan prompt berbeda untuk virality_threshold berbeda', () => {
    const prompt1 = buildAnalysisPrompt({ ...defaultAnalysisConfig, virality_threshold: 70 })
    const prompt2 = buildAnalysisPrompt({ ...defaultAnalysisConfig, virality_threshold: 85 })
    expect(prompt1).not.toBe(prompt2)
  })

  it('harus include instruksi bahasa lain jika source_language bukan id', () => {
    const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, source_language: 'en' })
    expect(prompt.toLowerCase()).toContain('en')
  })

  it('harus include min dan max clips dalam prompt', () => {
    const prompt = buildAnalysisPrompt({
      ...defaultAnalysisConfig,
      min_clips: 3,
      max_clips: 10,
    })
    expect(prompt).toContain('3')
    expect(prompt).toContain('10')
  })

  it('harus return string yang tidak kosong', () => {
    const prompt = buildAnalysisPrompt(defaultAnalysisConfig)
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('harus include format JSON dalam prompt', () => {
    const prompt = buildAnalysisPrompt(defaultAnalysisConfig)
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('clip_001')
  })
})

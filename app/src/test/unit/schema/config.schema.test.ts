import { describe, it, expect } from 'vitest'
import { analysisConfigSchema, renderConfigSchema, defaultAnalysisConfig, defaultRenderConfig } from '@/lib/schema/config.schema'

describe('analysisConfigSchema', () => {
  it('harus accept config default yang valid (semua nilai default)', () => {
    expect(() => analysisConfigSchema.parse({})).not.toThrow()
  })

  it('harus memiliki nilai default yang benar', () => {
    const config = analysisConfigSchema.parse({})
    expect(config.model).toBe('gemini-2.5-flash')
    expect(config.min_clips).toBe(3)
    expect(config.max_clips).toBe(7)
    expect(config.virality_threshold).toBe(70)
    expect(config.niche).toBe('motivation')
    expect(config.thinking_depth).toBe('low')
    expect(config.require_human_approval).toBe(true)
  })

  it('harus reject min_clips > max_clips (refine validation)', () => {
    expect(() =>
      analysisConfigSchema.parse({ min_clips: 8, max_clips: 5 })
    ).toThrow()
  })

  it('harus accept min_clips = max_clips', () => {
    expect(() =>
      analysisConfigSchema.parse({ min_clips: 5, max_clips: 5 })
    ).not.toThrow()
  })

  it('harus reject virality_threshold < 50', () => {
    expect(() =>
      analysisConfigSchema.parse({ virality_threshold: 49 })
    ).toThrow()
  })

  it('harus reject virality_threshold > 95', () => {
    expect(() =>
      analysisConfigSchema.parse({ virality_threshold: 96 })
    ).toThrow()
  })

  it('harus accept virality_threshold di rentang 50-95', () => {
    expect(() => analysisConfigSchema.parse({ virality_threshold: 50 })).not.toThrow()
    expect(() => analysisConfigSchema.parse({ virality_threshold: 95 })).not.toThrow()
    expect(() => analysisConfigSchema.parse({ virality_threshold: 75 })).not.toThrow()
  })

  it('harus reject thinking_depth selain valid enum', () => {
    expect(() =>
      analysisConfigSchema.parse({ thinking_depth: 'ultra' })
    ).toThrow()
  })

  it('harus accept semua thinking_depth yang valid', () => {
    const depths = ['minimal', 'low', 'medium', 'high']
    depths.forEach((thinking_depth) => {
      expect(() => analysisConfigSchema.parse({ thinking_depth })).not.toThrow()
    })
  })

  it('harus accept preferred_hook_types kosong (opsional / default)', () => {
    const config = analysisConfigSchema.parse({ preferred_hook_types: [] })
    expect(config.preferred_hook_types).toEqual([])
  })
})

describe('renderConfigSchema', () => {
  it('harus accept config default yang valid', () => {
    expect(() => renderConfigSchema.parse({})).not.toThrow()
  })

  it('harus memiliki nilai default yang benar', () => {
    const config = renderConfigSchema.parse({})
    expect(config.resolution).toBe('1080x1920')
    expect(config.aspect_ratio).toBe('9:16')
    expect(config.caption_enabled).toBe(true)
    expect(config.caption_font_size).toBe(48)
    expect(config.caption_position).toBe('bottom')
    expect(config.contrast).toBe(10)
    expect(config.brightness).toBe(0)
    expect(config.saturation).toBe(12)
  })

  it('harus reject caption_font_size < 32', () => {
    expect(() => renderConfigSchema.parse({ caption_font_size: 31 })).toThrow()
  })

  it('harus reject caption_font_size > 72', () => {
    expect(() => renderConfigSchema.parse({ caption_font_size: 73 })).toThrow()
  })

  it('harus accept caption_font_size di rentang 32-72', () => {
    expect(() => renderConfigSchema.parse({ caption_font_size: 32 })).not.toThrow()
    expect(() => renderConfigSchema.parse({ caption_font_size: 72 })).not.toThrow()
  })

  it('harus reject contrast di luar -50 sampai 50', () => {
    expect(() => renderConfigSchema.parse({ contrast: -51 })).toThrow()
    expect(() => renderConfigSchema.parse({ contrast: 51 })).toThrow()
  })

  it('harus accept contrast di batas -50 dan 50', () => {
    expect(() => renderConfigSchema.parse({ contrast: -50 })).not.toThrow()
    expect(() => renderConfigSchema.parse({ contrast: 50 })).not.toThrow()
  })

  it('harus reject brightness di luar -50 sampai 50', () => {
    expect(() => renderConfigSchema.parse({ brightness: -51 })).toThrow()
    expect(() => renderConfigSchema.parse({ brightness: 51 })).toThrow()
  })

  it('harus reject saturation di luar -50 sampai 50', () => {
    expect(() => renderConfigSchema.parse({ saturation: -51 })).toThrow()
    expect(() => renderConfigSchema.parse({ saturation: 51 })).toThrow()
  })
})

describe('defaultConfigs', () => {
  it('defaultAnalysisConfig harus tersedia', () => {
    expect(defaultAnalysisConfig).toBeDefined()
    expect(defaultAnalysisConfig.model).toBe('gemini-2.5-flash')
  })

  it('defaultRenderConfig harus tersedia', () => {
    expect(defaultRenderConfig).toBeDefined()
    expect(defaultRenderConfig.resolution).toBe('1080x1920')
  })
})

import { describe, it, expect } from 'vitest'
import { sourceSchema } from '@/lib/schema/source.schema'

describe('sourceSchema', () => {
  const validSource = {
    source_id: 'src_001',
    url: 'https://youtube.com/watch?v=abc123',
    type: 'podcast' as const,
    duration_seconds: 3600,
    language: 'id',
    creator: 'Test Creator',
  }

  it('harus accept source yang valid', () => {
    expect(() => sourceSchema.parse(validSource)).not.toThrow()
  })

  it('harus reject URL yang bukan valid URI', () => {
    expect(() => sourceSchema.parse({ ...validSource, url: 'youtube.com' })).toThrow()
  })

  it('harus reject URL yang tidak ada protokol', () => {
    expect(() => sourceSchema.parse({ ...validSource, url: 'www.youtube.com/watch?v=abc' })).toThrow()
  })

  it('harus reject duration_seconds < 60', () => {
    expect(() => sourceSchema.parse({ ...validSource, duration_seconds: 30 })).toThrow()
  })

  it('harus reject duration_seconds = 59', () => {
    expect(() => sourceSchema.parse({ ...validSource, duration_seconds: 59 })).toThrow()
  })

  it('harus accept duration_seconds = 60 (batas minimum)', () => {
    expect(() => sourceSchema.parse({ ...validSource, duration_seconds: 60 })).not.toThrow()
  })

  it('harus reject type yang tidak ada di enum', () => {
    expect(() => sourceSchema.parse({ ...validSource, type: 'vlog' })).toThrow()
  })

  it('harus require field url dan type', () => {
    expect(() => sourceSchema.parse({ duration_seconds: 100 })).toThrow()
  })

  it('harus set default language ke id', () => {
    const result = sourceSchema.parse({
      url: 'https://youtube.com/watch?v=abc123',
      type: 'podcast',
      duration_seconds: 3600,
    })
    expect(result.language).toBe('id')
  })

  it('harus accept semua type yang valid', () => {
    const types = ['podcast', 'stream', 'interview', 'seminar', 'sports', 'news', 'comedy', 'faceless']
    types.forEach((type) => {
      expect(() => sourceSchema.parse({ ...validSource, type })).not.toThrow()
    })
  })
})

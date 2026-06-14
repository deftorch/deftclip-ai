# 🛠️ RENCANA IMPLEMENTASI TEKNIS — AI Auto Clip System
**Versi:** 1.0.0  
**Tanggal:** 2026-06-14  
**Metode:** Test-Driven Development (TDD) — Red → Green → Refactor  
**Stack:** Next.js 15 · Vercel AI SDK 6 · Gemini · Drizzle ORM · Neon Postgres · FFmpeg.wasm · Vitest · Playwright

> **Cara baca dokumen ini:** Setiap item `[ ]` adalah satu unit kerja yang bisa dikerjakan AI dalam satu sesi. Kerjakan **urut dari atas ke bawah**. Jangan skip. Centang `[x]` setelah selesai dan update CHANGELOG.

---

## 📦 FASE 0 — INISIALISASI PROYEK
> Target: Proyek berjalan di localhost dengan semua tooling siap

### 0.1 Scaffold Proyek

- [ ] **0.1.1** Buat proyek Next.js 15 dengan TypeScript
  ```bash
  npx create-next-app@latest ai-auto-clip \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*"
  ```

- [ ] **0.1.2** Install dependencies core
  ```bash
  # AI & Schema
  npm install ai @ai-sdk/google zod

  # Database
  npm install drizzle-orm @neondatabase/serverless
  npm install -D drizzle-kit

  # Storage
  npm install @vercel/blob

  # UI
  npx shadcn@latest init
  # Pilih: Dark mode, CSS variables, zinc base color

  # Komponen shadcn yang dibutuhkan
  npx shadcn@latest add button card badge slider select
  npx shadcn@latest add progress toast tabs separator
  npx shadcn@latest add input label textarea switch
  npx shadcn@latest add dropdown-menu tooltip skeleton

  # Theme
  npm install next-themes

  # Video
  npm install @ffmpeg/ffmpeg @ffmpeg/util

  # Utilities
  npm install lucide-react clsx tailwind-merge
  ```

- [ ] **0.1.3** Install dependencies dev & testing
  ```bash
  npm install -D vitest @vitest/ui
  npm install -D @testing-library/react @testing-library/user-event
  npm install -D @testing-library/jest-dom jsdom
  npm install -D @playwright/test
  npx playwright install chromium
  ```

- [ ] **0.1.4** Buat file konfigurasi Vitest
  ```ts
  // vitest.config.ts
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        exclude: ['node_modules/', '.next/', 'e2e/'],
      },
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  })
  ```

- [ ] **0.1.5** Buat file setup test
  ```ts
  // src/test/setup.ts
  import '@testing-library/jest-dom'
  ```

- [ ] **0.1.6** Buat konfigurasi Playwright
  ```ts
  // playwright.config.ts
  import { defineConfig, devices } from '@playwright/test'
  export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
      command: 'npm run build && npm run start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  })
  ```

- [ ] **0.1.7** Update `package.json` scripts
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest run --coverage",
      "test:e2e": "playwright test",
      "test:all": "vitest run && playwright test",
      "db:generate": "drizzle-kit generate",
      "db:migrate": "drizzle-kit migrate",
      "db:studio": "drizzle-kit studio"
    }
  }
  ```

- [ ] **0.1.8** Buat `.env.local` dari `.env.example`
  ```bash
  # .env.local
  # Gemini API Keys (isi semua yang kamu punya)
  GEMINI_KEY_01=""
  GEMINI_KEY_02=""
  # ... sampai 12

  # Database (dari Neon dashboard)
  DATABASE_URL=""
  DATABASE_URL_UNPOOLED=""

  # Storage (dari Vercel dashboard)
  BLOB_READ_WRITE_TOKEN=""

  # App
  NEXT_PUBLIC_APP_URL="http://localhost:3000"
  ```

- [ ] **0.1.9** Konfigurasi FFmpeg.wasm headers di Next.js
  ```ts
  // next.config.ts
  import type { NextConfig } from 'next'
  const nextConfig: NextConfig = {
    async headers() {
      return [{
        // Wajib untuk FFmpeg.wasm SharedArrayBuffer
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      }]
    },
  }
  export default nextConfig
  ```

- [ ] **0.1.10** Setup ThemeProvider untuk dark mode
  ```tsx
  // src/components/providers/theme-provider.tsx
  "use client"
  import { ThemeProvider as NextThemesProvider } from 'next-themes'
  export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    )
  }
  ```

- [ ] **0.1.11** Verifikasi: `npm run dev` berjalan tanpa error di localhost:3000

---

### 0.2 Setup Database (Drizzle + Neon)

- [ ] **0.2.1** Buat akun Neon (neon.tech) dan copy connection string ke `.env.local`

- [ ] **0.2.2** Buat file koneksi database
  ```ts
  // src/lib/db/client.ts
  import { neon } from '@neondatabase/serverless'
  import { drizzle } from 'drizzle-orm/neon-http'
  import * as schema from './schema'

  const sql = neon(process.env.DATABASE_URL!)
  export const db = drizzle(sql, { schema })
  ```

- [ ] **0.2.3** Tulis schema Drizzle (dari blueprint database schema)
  ```ts
  // src/lib/db/schema.ts
  import {
    pgTable, text, boolean, integer,
    numeric, jsonb, timestamp, serial
  } from 'drizzle-orm/pg-core'

  export const pipelines = pgTable('pipelines', {
    id: text('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    status: text('status').notNull().default('pending'),
    sourceUrl: text('source_url').notNull(),
    sourceType: text('source_type'),
    sourceTitle: text('source_title'),
    configSnapshot: jsonb('config_snapshot'),
    strategyJson: jsonb('strategy_json'),
    aiModelUsed: text('ai_model_used'),
    apiKeyIndexUsed: integer('api_key_index_used'),
    tokenUsageInput: integer('token_usage_input'),
    tokenUsageOutput: integer('token_usage_output'),
    analysisDurationMs: integer('analysis_duration_ms'),
    errorMessage: text('error_message'),
  })

  export const clips = pgTable('clips', {
    id: text('id').primaryKey(),
    pipelineId: text('pipeline_id').references(() => pipelines.id),
    createdAt: timestamp('created_at').defaultNow(),
    startTime: numeric('start_time').notNull(),
    endTime: numeric('end_time').notNull(),
    duration: numeric('duration').notNull(),
    hookType: text('hook_type').notNull(),
    viralityScore: integer('virality_score').notNull(),
    emotionTrigger: text('emotion_trigger'),
    transcriptSnippet: text('transcript_snippet'),
    aiSuggestedTitle: text('ai_suggested_title'),
    aiReasoning: text('ai_reasoning'),
    humanApproved: boolean('human_approved').default(false),
    humanRejected: boolean('human_rejected').default(false),
    userEditedTitle: text('user_edited_title'),
    reviewedAt: timestamp('reviewed_at'),
    renderStatus: text('render_status'),
    outputFileUrl: text('output_file_url'),
    renderedAt: timestamp('rendered_at'),
  })

  export const userConfig = pgTable('user_config', {
    id: text('id').primaryKey().default('default'),
    updatedAt: timestamp('updated_at').defaultNow(),
    config: jsonb('config').notNull(),
  })
  ```

- [ ] **0.2.4** Buat konfigurasi drizzle-kit
  ```ts
  // drizzle.config.ts
  import { defineConfig } from 'drizzle-kit'
  export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  })
  ```

- [ ] **0.2.5** Generate dan jalankan migrasi pertama
  ```bash
  npm run db:generate
  npm run db:migrate
  ```

- [ ] **0.2.6** Verifikasi tabel berhasil dibuat di Neon dashboard

---

## 🧱 FASE 1 — SCHEMAS & TYPES (TDD Start)
> Target: Semua Zod schema tervalidasi dengan unit test

### 1.1 Zod Schema — Source

- [ ] **1.1.1** 🔴 RED — Tulis test dulu
  ```ts
  // src/test/unit/schema/source.schema.test.ts
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
    it('harus reject duration_seconds < 60', () => {
      expect(() => sourceSchema.parse({ ...validSource, duration_seconds: 30 })).toThrow()
    })
    it('harus reject type yang tidak ada di enum', () => {
      expect(() => sourceSchema.parse({ ...validSource, type: 'vlog' })).toThrow()
    })
    it('harus require field url dan type', () => {
      expect(() => sourceSchema.parse({ duration_seconds: 100 })).toThrow()
    })
  })
  ```

- [ ] **1.1.2** Jalankan test → pastikan FAIL (RED): `npm test`

- [ ] **1.1.3** 🟢 GREEN — Implementasi schema
  ```ts
  // src/lib/schema/source.schema.ts
  import { z } from 'zod'

  export const sourceSchema = z.object({
    source_id: z.string().optional(),
    url: z.string().url('URL harus valid URI'),
    type: z.enum(['podcast','stream','interview','seminar','sports','news','comedy','faceless']),
    duration_seconds: z.number().min(60, 'Minimum 60 detik'),
    language: z.string().default('id'),
    creator: z.string().optional(),
    episode_title: z.string().optional(),
    published_at: z.string().datetime().optional(),
  })

  export type Source = z.infer<typeof sourceSchema>
  ```

- [ ] **1.1.4** Jalankan test → pastikan PASS (GREEN)

---

### 1.2 Zod Schema — Strategy

- [ ] **1.2.1** 🔴 RED — Tulis test dulu
  ```ts
  // src/test/unit/schema/strategy.schema.test.ts
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
    it('harus reject duration > 90 detik', () => {
      expect(() => clipSchema.parse({ ...validClip, duration: 100 })).toThrow()
    })
    it('harus reject virality_score < 0', () => {
      expect(() => clipSchema.parse({ ...validClip, virality_score: -1 })).toThrow()
    })
    it('harus reject virality_score > 100', () => {
      expect(() => clipSchema.parse({ ...validClip, virality_score: 101 })).toThrow()
    })
    it('harus reject hook_type tidak valid', () => {
      expect(() => clipSchema.parse({ ...validClip, hook_type: 'funny' })).toThrow()
    })
    it('harus reject clip_id tidak sesuai pattern', () => {
      expect(() => clipSchema.parse({ ...validClip, clip_id: 'clip-1' })).toThrow()
    })
    it('harus set human_approved default false', () => {
      const result = clipSchema.parse({ ...validClip, human_approved: undefined })
      expect(result.human_approved).toBe(false)
    })
    it('harus reject transcript_snippet > 500 karakter', () => {
      const longText = 'a'.repeat(501)
      expect(() => clipSchema.parse({ ...validClip, transcript_snippet: longText })).toThrow()
    })
  })

  describe('strategySchema', () => {
    it('harus require niche, target_platform, clips')
    it('harus reject clips kosong (minItems: 1)')
    it('harus reject lebih dari 20 clips')
  })
  ```

- [ ] **1.2.2** Jalankan test → FAIL (RED)

- [ ] **1.2.3** 🟢 GREEN — Implementasi
  ```ts
  // src/lib/schema/strategy.schema.ts
  import { z } from 'zod'

  export const hookTypeEnum = z.enum([
    'bold_claim','contrarian','preview_hook',
    'question_hook','story_arc','punchline'
  ])

  export const emotionEnum = z.enum([
    'surprise','curiosity','anger',
    'inspiration','humor','fear','joy'
  ])

  export const clipSchema = z.object({
    clip_id: z.string().regex(/^clip_[0-9]{3}$/, 'Format: clip_XXX'),
    start_time: z.number().min(0),
    end_time: z.number(),
    duration: z.number().min(7).max(90),
    hook_type: hookTypeEnum,
    virality_score: z.number().min(0).max(100),
    emotion_trigger: emotionEnum.optional(),
    transcript_snippet: z.string().max(500).optional(),
    ai_suggested_title: z.string().max(100).optional(),
    ai_reasoning: z.string().optional(),
    human_approved: z.boolean().default(false),
  })

  export const strategySchema = z.object({
    niche: z.enum(['motivation','finance','gaming','comedy',
                   'education','politics','sports','lifestyle','tech']),
    target_platform: z.array(
      z.enum(['tiktok','instagram_reels','youtube_shorts'])
    ).min(1),
    clips: z.array(clipSchema).min(1).max(20),
  })

  export type Clip = z.infer<typeof clipSchema>
  export type Strategy = z.infer<typeof strategySchema>
  ```

- [ ] **1.2.4** Jalankan test → PASS (GREEN)

---

### 1.3 Zod Schema — Config (UI-Configurable)

- [ ] **1.3.1** 🔴 RED — Tulis test
  ```ts
  // src/test/unit/schema/config.schema.test.ts
  import { describe, it, expect } from 'vitest'
  import { analysisConfigSchema, renderConfigSchema } from '@/lib/schema/config.schema'

  describe('analysisConfigSchema', () => {
    it('harus accept config default yang valid')
    it('harus reject min_clips > max_clips')
    it('harus reject virality_threshold di luar 50-95')
    it('harus reject thinking_depth selain minimal/low/medium/high')
    it('harus accept preferred_hook_types kosong (opsional)')
  })

  describe('renderConfigSchema', () => {
    it('harus accept config default yang valid')
    it('harus reject caption_font_size di luar 32-72')
    it('harus reject contrast di luar -50 sampai 50')
  })
  ```

- [ ] **1.3.2** Jalankan test → FAIL (RED)

- [ ] **1.3.3** 🟢 GREEN — Implementasi
  ```ts
  // src/lib/schema/config.schema.ts
  import { z } from 'zod'

  export const analysisConfigSchema = z.object({
    model: z.enum(['gemini-2.5-flash','gemini-3-flash','gemini-2.5-pro'])
           .default('gemini-2.5-flash'),
    min_clips: z.number().min(1).max(5).default(3),
    max_clips: z.number().min(5).max(20).default(7),
    min_duration_seconds: z.number().min(7).max(30).default(15),
    max_duration_seconds: z.number().min(30).max(90).default(60),
    virality_threshold: z.number().min(50).max(95).default(70),
    preferred_hook_types: z.array(
      z.enum(['bold_claim','contrarian','preview_hook','question_hook','story_arc','punchline'])
    ).default(['bold_claim','story_arc','contrarian']),
    target_emotions: z.array(
      z.enum(['surprise','curiosity','anger','inspiration','humor','fear','joy'])
    ).default(['inspiration','curiosity','surprise']),
    niche: z.enum(['motivation','finance','gaming','comedy',
                   'education','politics','sports','lifestyle','tech'])
           .default('motivation'),
    source_language: z.string().default('id'),
    target_platforms: z.array(
      z.enum(['tiktok','instagram_reels','youtube_shorts'])
    ).default(['tiktok','youtube_shorts']),
    require_human_approval: z.boolean().default(true),
    thinking_depth: z.enum(['minimal','low','medium','high']).default('low'),
  }).refine(
    (data) => data.min_clips <= data.max_clips,
    { message: 'min_clips harus <= max_clips', path: ['min_clips'] }
  )

  export const renderConfigSchema = z.object({
    resolution: z.enum(['1080x1920','720x1280']).default('1080x1920'),
    aspect_ratio: z.enum(['9:16','1:1','16:9']).default('9:16'),
    caption_enabled: z.boolean().default(true),
    caption_font_size: z.number().min(32).max(72).default(48),
    caption_position: z.enum(['top','middle','bottom']).default('bottom'),
    caption_style: z.enum(['word_by_word','full_line']).default('full_line'),
    caption_bg_color: z.string().default('#000000'),
    caption_text_color: z.string().default('#FFFFFF'),
    contrast: z.number().min(-50).max(50).default(10),
    brightness: z.number().min(-50).max(50).default(0),
    saturation: z.number().min(-50).max(50).default(12),
  })

  export type AnalysisConfig = z.infer<typeof analysisConfigSchema>
  export type RenderConfig = z.infer<typeof renderConfigSchema>

  export const defaultAnalysisConfig = analysisConfigSchema.parse({})
  export const defaultRenderConfig = renderConfigSchema.parse({})
  ```

- [ ] **1.3.4** Jalankan test → PASS (GREEN)

- [ ] **1.3.5** 🔵 REFACTOR — Cek apakah ada duplikasi enum, extract ke `src/lib/schema/enums.ts`

---

## 🔑 FASE 2 — KEY MANAGER (TDD)
> Target: Rotasi 12 API key dengan cooldown otomatis

### 2.1 KeyManager

- [ ] **2.1.1** 🔴 RED — Tulis test lengkap
  ```ts
  // src/test/unit/ai/key-manager.test.ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { KeyManager } from '@/lib/ai/key-manager'

  describe('KeyManager', () => {
    let manager: KeyManager

    beforeEach(() => {
      manager = new KeyManager({
        keys: [
          { key: 'key-1', label: 'Akun 1', enabled: true },
          { key: 'key-2', label: 'Akun 2', enabled: true },
          { key: 'key-3', label: 'Akun 3', enabled: true },
        ],
        rotation_strategy: 'round_robin',
        cooldown_seconds: 60,
        max_retries: 3,
      })
    })

    it('harus return key pertama saat pertama dipanggil', () => {
      const result = manager.getAvailableKey()
      expect(result?.key).toBe('key-1')
    })

    it('harus rotasi ke key berikutnya (round robin)', () => {
      manager.getAvailableKey() // key-1
      const result = manager.getAvailableKey()
      expect(result?.key).toBe('key-2')
    })

    it('harus skip key yang sedang cooldown', () => {
      const first = manager.getAvailableKey()! // key-1
      manager.markRateLimited(first.index)
      const second = manager.getAvailableKey()
      expect(second?.key).toBe('key-2')
    })

    it('harus return null jika semua key cooldown', () => {
      manager.markRateLimited(0)
      manager.markRateLimited(1)
      manager.markRateLimited(2)
      expect(manager.getAvailableKey()).toBeNull()
    })

    it('harus reset cooldown setelah waktu habis', async () => {
      vi.useFakeTimers()
      manager.markRateLimited(0)
      expect(manager.getAvailableKey()?.key).toBe('key-2')
      vi.advanceTimersByTime(61_000) // 61 detik
      // key-1 harusnya sudah available lagi
      const statuses = manager.getKeyStatuses()
      expect(statuses[0].isLimited).toBe(false)
      vi.useRealTimers()
    })

    it('harus skip key yang disabled', () => {
      const managerWithDisabled = new KeyManager({
        keys: [
          { key: 'key-1', label: 'Akun 1', enabled: false },
          { key: 'key-2', label: 'Akun 2', enabled: true },
        ],
        rotation_strategy: 'round_robin',
        cooldown_seconds: 60,
        max_retries: 3,
      })
      const result = managerWithDisabled.getAvailableKey()
      expect(result?.key).toBe('key-2')
    })

    it('harus return status semua key', () => {
      const statuses = manager.getKeyStatuses()
      expect(statuses).toHaveLength(3)
      expect(statuses[0]).toMatchObject({
        label: 'Akun 1',
        enabled: true,
        isLimited: false,
      })
    })

    it('harus catat waktu cooldown yang benar', () => {
      vi.useFakeTimers()
      const now = Date.now()
      manager.markRateLimited(0)
      const statuses = manager.getKeyStatuses()
      expect(statuses[0].cooldownUntil).toBeGreaterThan(now)
      vi.useRealTimers()
    })
  })
  ```

- [ ] **2.1.2** Jalankan test → FAIL (RED)

- [ ] **2.1.3** 🟢 GREEN — Implementasi
  ```ts
  // src/lib/ai/key-manager.ts
  interface ApiKeyConfig {
    key: string
    label: string
    enabled: boolean
  }

  interface KeyManagerConfig {
    keys: ApiKeyConfig[]
    rotation_strategy: 'round_robin' | 'least_used' | 'random'
    cooldown_seconds: number
    max_retries: number
  }

  interface KeyStatus {
    index: number
    label: string
    enabled: boolean
    isLimited: boolean
    cooldownUntil: number | null
    useCount: number
  }

  interface AvailableKey {
    key: string
    index: number
    label: string
  }

  export class KeyManager {
    private config: KeyManagerConfig
    private statuses: KeyStatus[]
    private currentIndex = 0

    constructor(config: KeyManagerConfig) {
      this.config = config
      this.statuses = config.keys.map((k, i) => ({
        index: i,
        label: k.label,
        enabled: k.enabled,
        isLimited: false,
        cooldownUntil: null,
        useCount: 0,
      }))
    }

    getAvailableKey(): AvailableKey | null {
      const now = Date.now()
      // Reset expired cooldowns
      this.statuses.forEach((s) => {
        if (s.isLimited && s.cooldownUntil && now > s.cooldownUntil) {
          s.isLimited = false
          s.cooldownUntil = null
        }
      })

      // Round robin: cari key yang available mulai dari currentIndex
      for (let attempt = 0; attempt < this.config.keys.length; attempt++) {
        const idx = (this.currentIndex + attempt) % this.config.keys.length
        const status = this.statuses[idx]
        if (status.enabled && !status.isLimited) {
          this.currentIndex = (idx + 1) % this.config.keys.length
          status.useCount++
          return {
            key: this.config.keys[idx].key,
            index: idx,
            label: status.label,
          }
        }
      }
      return null
    }

    markRateLimited(index: number): void {
      this.statuses[index].isLimited = true
      this.statuses[index].cooldownUntil =
        Date.now() + this.config.cooldown_seconds * 1000
    }

    getKeyStatuses(): KeyStatus[] {
      return [...this.statuses]
    }
  }
  ```

- [ ] **2.1.4** Jalankan test → PASS (GREEN)

- [ ] **2.1.5** 🔵 REFACTOR — Tambah method `getStats()` untuk dashboard transparansi

---

## 🤖 FASE 3 — AI ANALYZER (TDD)
> Target: Prompt builder + Gemini client dengan key rotation

### 3.1 Prompt Builder

- [ ] **3.1.1** 🔴 RED — Tulis test
  ```ts
  // src/test/unit/ai/prompt-builder.test.ts
  import { describe, it, expect } from 'vitest'
  import { buildAnalysisPrompt } from '@/lib/ai/prompt-builder'
  import { defaultAnalysisConfig } from '@/lib/schema/config.schema'

  describe('buildAnalysisPrompt', () => {
    it('harus include niche dalam prompt', () => {
      const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, niche: 'finance' })
      expect(prompt.toLowerCase()).toContain('finance')
    })
    it('harus include target_platforms', () => {
      const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, target_platforms: ['tiktok'] })
      expect(prompt.toLowerCase()).toContain('tiktok')
    })
    it('harus include virality_threshold', () => {
      const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, virality_threshold: 80 })
      expect(prompt).toContain('80')
    })
    it('harus include min/max duration', () => {
      const prompt = buildAnalysisPrompt({
        ...defaultAnalysisConfig,
        min_duration_seconds: 15,
        max_duration_seconds: 60
      })
      expect(prompt).toContain('15')
      expect(prompt).toContain('60')
    })
    it('harus include instruksi Bahasa Indonesia jika source_language = id', () => {
      const prompt = buildAnalysisPrompt({ ...defaultAnalysisConfig, source_language: 'id' })
      expect(prompt.toLowerCase()).toContain('indonesia')
    })
    it('harus menghasilkan prompt berbeda untuk config berbeda', () => {
      const prompt1 = buildAnalysisPrompt({ ...defaultAnalysisConfig, niche: 'motivation' })
      const prompt2 = buildAnalysisPrompt({ ...defaultAnalysisConfig, niche: 'gaming' })
      expect(prompt1).not.toBe(prompt2)
    })
  })
  ```

- [ ] **3.1.2** Jalankan test → FAIL (RED)

- [ ] **3.1.3** 🟢 GREEN — Implementasi
  ```ts
  // src/lib/ai/prompt-builder.ts
  import type { AnalysisConfig } from '@/lib/schema/config.schema'

  export function buildAnalysisPrompt(config: AnalysisConfig): string {
    const langInstruction = config.source_language === 'id'
      ? 'Konten dalam Bahasa Indonesia. Prioritaskan momen yang akan viral di audiens Indonesia.'
      : `Content in language: ${config.source_language}.`

    return `Kamu adalah AI content strategist spesialis konten viral untuk platform short-form.

${langInstruction}

TUGAS: Analisis video/audio ini dan identifikasi ${config.min_clips}–${config.max_clips} momen terbaik untuk dijadikan short clip viral.

PARAMETER:
- Niche konten: ${config.niche}
- Platform target: ${config.target_platforms.join(', ')}
- Durasi klip: ${config.min_duration_seconds}–${config.max_duration_seconds} detik
- Minimum virality score: ${config.virality_threshold}/100 (buang yang di bawah ini)
- Hook yang diprioritaskan: ${config.preferred_hook_types.join(', ')}
- Emotion target: ${config.target_emotions.join(', ')}

KRITERIA PEMILIHAN MOMEN:
1. Hook kuat di 3 detik pertama
2. Ada emotional trigger yang jelas: ${config.target_emotions.join(' / ')}
3. Satu ide utama, tuntas dalam durasi
4. Quotable / shareable
5. Relevan untuk audiens ${config.niche} di ${config.target_platforms[0]}

UNTUK SETIAP KLIP, berikan:
- clip_id (format: clip_001, clip_002, dst)
- start_time dan end_time dalam DETIK (bukan MM:SS)
- duration dalam detik
- hook_type: pilih dari [bold_claim, contrarian, preview_hook, question_hook, story_arc, punchline]
- virality_score: 0-100 (hanya tampilkan yang >= ${config.virality_threshold})
- emotion_trigger: pilih dari [surprise, curiosity, anger, inspiration, humor, fear, joy]
- transcript_snippet: kutipan persis dari video (max 500 karakter)
- ai_suggested_title: judul pendek untuk platform ${config.target_platforms[0]} (max 100 karakter)
- ai_reasoning: penjelasan singkat MENGAPA momen ini dipilih dan kenapa akan viral

Output harus berupa JSON yang valid sesuai schema yang diberikan.`
  }
  ```

- [ ] **3.1.4** Jalankan test → PASS (GREEN)

---

### 3.2 Gemini Client dengan Key Rotation

- [ ] **3.2.1** Buat Gemini client wrapper
  ```ts
  // src/lib/ai/gemini-client.ts
  import { createGoogleGenerativeAI } from '@ai-sdk/google'
  import { generateObject } from 'ai'
  import { KeyManager } from './key-manager'
  import { buildAnalysisPrompt } from './prompt-builder'
  import { strategySchema } from '@/lib/schema/strategy.schema'
  import type { AnalysisConfig } from '@/lib/schema/config.schema'

  // Baca semua key dari env
  function loadApiKeys() {
    const keys = []
    for (let i = 1; i <= 12; i++) {
      const key = process.env[`GEMINI_KEY_${String(i).padStart(2, '0')}`]
      if (key) {
        keys.push({ key, label: `Akun Gmail ${i}`, enabled: true })
      }
    }
    if (keys.length === 0) throw new Error('Tidak ada GEMINI_KEY yang dikonfigurasi')
    return keys
  }

  // Singleton KeyManager (per-process)
  let keyManagerInstance: KeyManager | null = null
  export function getKeyManager(): KeyManager {
    if (!keyManagerInstance) {
      keyManagerInstance = new KeyManager({
        keys: loadApiKeys(),
        rotation_strategy: 'round_robin',
        cooldown_seconds: 60,
        max_retries: 3,
      })
    }
    return keyManagerInstance
  }

  export class GeminiRateLimitError extends Error {
    constructor(public keyIndex: number) {
      super(`API key ${keyIndex} kena rate limit`)
      this.name = 'GeminiRateLimitError'
    }
  }

  export class AllKeysExhaustedError extends Error {
    constructor() {
      super('Semua API key sedang rate limited. Coba lagi dalam 60 detik.')
      this.name = 'AllKeysExhaustedError'
    }
  }

  export async function analyzeVideoWithRetry(
    videoUrl: string,
    config: AnalysisConfig,
    onKeyUsed?: (keyLabel: string, keyIndex: number) => void
  ) {
    const manager = getKeyManager()
    const prompt = buildAnalysisPrompt(config)
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 0; attempt < 12; attempt++) {
      const available = manager.getAvailableKey()
      if (!available) throw new AllKeysExhaustedError()

      onKeyUsed?.(available.label, available.index)

      try {
        const google = createGoogleGenerativeAI({ apiKey: available.key })
        const model = google(config.model, {
          // Thinking depth untuk Gemini 3
          ...(config.model.startsWith('gemini-3') && {
            providerOptions: {
              google: {
                thinkingConfig: { thinkingBudget: config.thinking_depth }
              }
            }
          })
        })

        const { object, usage } = await generateObject({
          model,
          schema: strategySchema,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'file', data: new URL(videoUrl), mimeType: 'video/mp4' }
            ]
          }]
        })

        return {
          strategy: object,
          tokenUsageInput: usage?.promptTokens ?? 0,
          tokenUsageOutput: usage?.completionTokens ?? 0,
          durationMs: Date.now() - startTime,
          keyIndexUsed: available.index,
          modelUsed: config.model,
        }

      } catch (error: any) {
        const isRateLimit =
          error?.status === 429 ||
          error?.message?.includes('RESOURCE_EXHAUSTED') ||
          error?.message?.includes('quota')

        if (isRateLimit) {
          manager.markRateLimited(available.index)
          lastError = new GeminiRateLimitError(available.index)
          continue // coba key berikutnya
        }
        throw error // error lain langsung throw
      }
    }

    throw lastError ?? new AllKeysExhaustedError()
  }
  ```

- [ ] **3.2.2** 🔴 RED — Tulis integration test (dengan mock)
  ```ts
  // src/test/unit/ai/gemini-client.test.ts
  import { describe, it, expect, vi } from 'vitest'
  // Test akan mock generateObject untuk tidak hit real API
  it('harus retry dengan key lain jika kena 429')
  it('harus throw AllKeysExhaustedError jika semua key limited')
  it('harus return usage token yang benar')
  ```

- [ ] **3.2.3** Implementasi mock dan test (GREEN)

---

## 🌐 FASE 4 — API ROUTES (TDD)
> Target: Semua endpoint berfungsi dan ter-test

### 4.1 Route: Create Pipeline

- [ ] **4.1.1** 🔴 RED — Tulis test
  ```ts
  // src/test/integration/api/pipeline.test.ts
  import { describe, it, expect } from 'vitest'

  describe('POST /api/pipeline/create', () => {
    it('harus return 400 jika URL tidak ada')
    it('harus return 400 jika URL tidak valid')
    it('harus return 201 dengan pipeline_id jika valid')
    it('harus simpan pipeline ke database dengan status pending')
  })
  ```

- [ ] **4.1.2** Implementasi route
  ```ts
  // src/app/api/pipeline/create/route.ts
  import { NextRequest, NextResponse } from 'next/server'
  import { z } from 'zod'
  import { db } from '@/lib/db/client'
  import { pipelines } from '@/lib/db/schema'
  import { nanoid } from 'nanoid' // npm install nanoid

  const createPipelineSchema = z.object({
    url: z.string().url(),
    type: z.string().optional(),
  })

  export async function POST(req: NextRequest) {
    try {
      const body = await req.json()
      const { url, type } = createPipelineSchema.parse(body)

      const pipelineId = `pipeline_${nanoid(8)}`
      await db.insert(pipelines).values({
        id: pipelineId,
        sourceUrl: url,
        sourceType: type,
        status: 'pending',
      })

      return NextResponse.json({ pipeline_id: pipelineId }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 })
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  ```

- [ ] **4.1.3** Test → PASS (GREEN)

---

### 4.2 Route: Analyze Pipeline

- [ ] **4.2.1** 🔴 RED — Tulis test
  ```ts
  // Route: POST /api/pipeline/[id]/analyze
  it('harus return 404 jika pipeline tidak ditemukan')
  it('harus return 202 dan mulai analisis')
  it('harus update status pipeline menjadi analyzing')
  it('harus return 503 jika semua key exhausted')
  ```

- [ ] **4.2.2** Implementasi route dengan streaming response
  ```ts
  // src/app/api/pipeline/[id]/analyze/route.ts
  // Gunakan streamObject untuk real-time progress di UI
  import { streamObject } from 'ai'
  import { createGoogleGenerativeAI } from '@ai-sdk/google'
  ```

- [ ] **4.2.3** Test → PASS (GREEN)

---

### 4.3 Route: Approve / Reject Clip

- [ ] **4.3.1** 🔴 RED → 🟢 GREEN
  ```ts
  // POST /api/clips/[id]/approve
  it('harus set human_approved = true')
  it('harus return 404 jika clip tidak ada')
  it('harus catat reviewed_at timestamp')

  // POST /api/clips/[id]/reject
  it('harus set human_rejected = true')
  it('harus set human_approved = false')
  ```

---

### 4.4 Route: Get/Update Config

- [ ] **4.4.1** 🔴 RED → 🟢 GREEN
  ```ts
  // GET /api/config — return config tersimpan atau default
  // PUT /api/config — validasi dan simpan config baru
  it('harus return default config jika belum ada config tersimpan')
  it('harus reject config tidak valid')
  it('harus simpan dan return config yang diupdate')
  ```

---

## 🎨 FASE 5 — UI COMPONENTS
> Target: Semua komponen utama siap dengan dark mode

### 5.1 Layout & Navigation

- [ ] **5.1.1** Buat root layout dengan ThemeProvider dan sidebar nav
  ```tsx
  // src/app/layout.tsx
  // Sidebar: Dashboard | Settings | Riwayat
  ```

- [ ] **5.1.2** Buat halaman Dashboard (daftar pipeline + tombol buat baru)

- [ ] **5.1.3** Buat komponen `PipelineStatusBadge` (pending/analyzing/review/done/error)

---

### 5.2 Form Input Pipeline

- [ ] **5.2.1** Buat `PipelineForm` — input URL + preview config aktif
  ```tsx
  // src/components/pipeline/PipelineForm.tsx
  // - Input URL YouTube
  // - Tampilkan ringkasan config aktif (model, niche, platform)
  // - Link ke Settings untuk ubah config
  // - Tombol "Mulai Analisis"
  ```

- [ ] **5.2.2** Buat `PipelineStatus` — real-time status dengan streaming
  ```tsx
  // Gunakan useObject() dari 'ai/react' untuk streaming strategy
  // Tampilkan:
  // - Step yang sedang berjalan
  // - Key mana yang aktif digunakan
  // - Estimasi token usage dan biaya
  // - Progress bar
  ```

---

### 5.3 Review Clips

- [ ] **5.3.1** Buat `ClipCard` — kartu per klip dengan semua info
  ```tsx
  // src/components/review/ClipCard.tsx
  // Props: clip, onApprove, onReject, onEditTitle
  // Tampilkan:
  // - clip_id, waktu (start → end), durasi
  // - transcript_snippet
  // - hook_type badge
  // - viralityScore progress bar dengan warna (merah/kuning/hijau)
  // - emotion_trigger dengan emoji
  // - ai_suggested_title (editable)
  // - Tombol Approve / Edit / Reject
  ```

- [ ] **5.3.2** Buat `TransparencyPanel` — panel penjelasan AI
  ```tsx
  // src/components/review/TransparencyPanel.tsx
  // Tampilkan:
  // - ai_reasoning dalam bahasa Indonesia
  // - ScoreBreakdown dengan bar per dimensi
  // - hook_type explanation
  // - emotion_trigger explanation
  ```

- [ ] **5.3.3** Buat `ScoreBreakdown` — visualisasi virality score
  ```tsx
  // src/components/review/ScoreBreakdown.tsx
  // Progress bar per dimensi:
  // - Kekuatan hook
  // - Emotional impact
  // - Quotability
  // - Durasi optimal
  // Warna: merah < 50, kuning 50-70, hijau > 70
  ```

- [ ] **5.3.4** Buat halaman Review (`/pipeline/[id]/review`)
  - List semua ClipCard dengan TransparencyPanel
  - Counter: X approved / Y rejected / Z pending
  - Tombol "Lanjut ke Render" (aktif jika ada min. 1 approved)
  - Download strategy.json

---

### 5.4 Settings — Konfigurasi UI

- [ ] **5.4.1** Buat `AnalysisConfigPanel`
  ```tsx
  // src/components/config/AnalysisConfigPanel.tsx
  // Komponen untuk setiap field dari analysisConfigSchema:
  // - Model: Select dropdown
  // - Min/Max clips: dual Slider
  // - Min/Max duration: dual Slider
  // - Virality threshold: Slider dengan preview angka
  // - Preferred hook types: multi-select Checkbox group
  // - Target emotions: multi-select icon grid
  // - Niche: Select dropdown
  // - Source language: Input text
  // - Target platforms: multi-select toggle
  // - Require human approval: Switch
  // - Thinking depth: Radio group (minimal/low/medium/high)
  ```

- [ ] **5.4.2** Buat `KeyManagerPanel`
  ```tsx
  // src/components/config/KeyManagerPanel.tsx
  // - List semua key dengan label
  // - Status per key (ready/cooldown/disabled)
  // - Toggle enable/disable per key
  // - Tambah key baru
  // - Cooldown countdown timer
  ```

- [ ] **5.4.3** Buat `RenderConfigPanel`
  ```tsx
  // src/components/config/RenderConfigPanel.tsx
  // - Resolution: Select
  // - Caption settings: Switch + Slider + ColorPicker
  // - Color grade: 3 Sliders (contrast/brightness/saturation)
  // - Preview perubahan real-time
  ```

- [ ] **5.4.4** Buat halaman Settings (`/settings`) yang gabungkan semua panel

---

## 🎬 FASE 6 — VIDEO RENDER (FFmpeg.wasm)
> Target: Output .mp4 dari klip yang di-approve

### 6.1 FFmpeg Wrapper

- [ ] **6.1.1** 🔴 RED — Tulis test (dengan mock FFmpeg)
  ```ts
  // src/test/unit/render/ffmpeg-wrapper.test.ts
  it('harus trim video sesuai start_time dan end_time')
  it('harus tambah caption teks dari transcript_snippet')
  it('harus output resolusi yang benar sesuai config')
  it('harus report progress melalui callback')
  it('harus handle error FFmpeg dengan pesan yang jelas')
  ```

- [ ] **6.1.2** 🟢 GREEN — Implementasi (Client Component)
  ```ts
  // src/lib/render/ffmpeg-browser.ts
  // "use client" — ini berjalan di browser
  import { FFmpeg } from '@ffmpeg/ffmpeg'
  import { fetchFile, toBlobURL } from '@ffmpeg/util'

  export async function renderClip(params: {
    videoUrl: string
    startTime: number
    endTime: number
    captionText: string
    config: RenderConfig
    onProgress: (progress: number) => void
  }): Promise<Blob> {
    const ffmpeg = new FFmpeg()

    // Load FFmpeg.wasm (lazy load)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpeg.on('progress', ({ progress }) => params.onProgress(progress * 100))

    // Download video sumber
    await ffmpeg.writeFile('input.mp4', await fetchFile(params.videoUrl))

    // Build FFmpeg command
    const [width, height] = params.config.resolution.split('x')
    const captionFilter = params.config.caption_enabled
      ? `,drawtext=text='${params.captionText}':fontsize=${params.config.caption_font_size}:fontcolor=${params.config.caption_text_color}:box=1:boxcolor=${params.config.caption_bg_color}@0.8:x=(w-text_w)/2:y=h-th-40`
      : ''

    const colorFilter = `eq=contrast=${1 + params.config.contrast/100}:brightness=${params.config.brightness/100}:saturation=${1 + params.config.saturation/100}`

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', String(params.startTime),
      '-to', String(params.endTime),
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,${colorFilter}${captionFilter}`,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'fast',
      'output.mp4'
    ])

    const data = await ffmpeg.readFile('output.mp4')
    return new Blob([data], { type: 'video/mp4' })
  }
  ```

- [ ] **6.1.3** Buat halaman Render (`/pipeline/[id]/render`)
  - List klip yang di-approve
  - Tombol render per klip atau batch
  - Progress bar per klip
  - Preview video hasil
  - Tombol download per klip

---

## 🧪 FASE 7 — E2E TESTS (Playwright)
> Target: User flow utama ter-cover

- [ ] **7.1** Tulis E2E test: Submit URL dan mulai analisis
  ```ts
  // e2e/pipeline-flow.spec.ts
  test('user bisa submit URL YouTube dan memulai analisis', async ({ page }) => {
    await page.goto('/')
    await page.fill('[data-testid="url-input"]', 'https://youtube.com/watch?v=test')
    await page.click('[data-testid="analyze-button"]')
    await expect(page.locator('[data-testid="pipeline-status"]')).toContainText('Sedang menganalisis')
  })
  ```

- [ ] **7.2** Tulis E2E test: Review flow (approve dan reject)
  ```ts
  test('user bisa approve dan reject klip', async ({ page }) => {
    // Mock API response agar tidak hit real Gemini
    await page.route('/api/pipeline/*/analyze', async (route) => {
      await route.fulfill({ json: mockStrategyResponse })
    })
    // ... test approve/reject
  })
  ```

- [ ] **7.3** Tulis E2E test: Settings tersimpan dan digunakan

- [ ] **7.4** Tulis E2E test: Download strategy.json berhasil

- [ ] **7.5** Jalankan semua E2E: `npm run test:e2e`

---

## ✅ FASE 8 — QA & DEPLOYMENT
> Target: Deploy ke Vercel dan berjalan stabil

### 8.1 Quality Checks

- [ ] **8.1.1** Jalankan semua unit test: `npm run test:coverage`
  - Target coverage: ≥ 80% untuk `src/lib/`
  
- [ ] **8.1.2** Jalankan semua E2E test: `npm run test:e2e`

- [ ] **8.1.3** Jalankan TypeScript check: `npx tsc --noEmit`

- [ ] **8.1.4** Jalankan ESLint: `npm run lint`

- [ ] **8.1.5** Build production test: `npm run build`

---

### 8.2 Deploy ke Vercel

- [ ] **8.2.1** Push ke GitHub repository

- [ ] **8.2.2** Connect repository ke Vercel

- [ ] **8.2.3** Setup environment variables di Vercel dashboard
  - Semua `GEMINI_KEY_XX`
  - `DATABASE_URL` dan `DATABASE_URL_UNPOOLED` dari Neon
  - `BLOB_READ_WRITE_TOKEN` dari Vercel Blob

- [ ] **8.2.4** Jalankan migrasi database di production
  ```bash
  npm run db:migrate
  ```

- [ ] **8.2.5** Verifikasi semua fitur berjalan di production URL

- [ ] **8.2.6** Test end-to-end dengan video YouTube asli

---

## 📊 RINGKASAN DEPENDENCIES FINAL

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ai": "^6.0.0",
    "@ai-sdk/google": "latest",
    "zod": "^3.0.0",
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest",
    "@vercel/blob": "latest",
    "@ffmpeg/ffmpeg": "^0.12.0",
    "@ffmpeg/util": "^0.12.0",
    "next-themes": "latest",
    "lucide-react": "latest",
    "nanoid": "^5.0.0",
    "clsx": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "latest",
    "@vitest/coverage-v8": "latest",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "latest",
    "@testing-library/jest-dom": "latest",
    "jsdom": "latest",
    "@playwright/test": "^1.44.0",
    "drizzle-kit": "latest"
  }
}
```

---

## 🔖 CATATAN TEKNIS PENTING

### Next.js 15 — Breaking Changes yang Perlu Diperhatikan
- `params` di page components sekarang adalah **Promise**, harus di-`await`
- Caching default berubah — fetch tidak cache by default lagi
- `"use client"` hanya untuk komponen yang butuh hooks/events, jangan berlebihan

### FFmpeg.wasm — Setup Wajib
- **Dua header HTTP wajib** di `next.config.ts`:
  `Cross-Origin-Opener-Policy: same-origin`
  `Cross-Origin-Embedder-Policy: require-corp`
- Tanpa header ini, `SharedArrayBuffer` tidak tersedia dan FFmpeg.wasm gagal
- Load FFmpeg **lazy** (hanya saat user klik render), bukan saat halaman load

### Drizzle ORM — Best Practice
- Gunakan `push` untuk dev lokal, `generate + migrate` untuk production
- Connection pooling sudah ditangani Neon, tidak perlu pgBouncer manual
- Gunakan `DATABASE_URL_UNPOOLED` untuk migrasi dan seeding

### Vercel AI SDK 6 — useObject untuk Streaming
- `useObject` dari `'ai/react'` untuk stream structured output ke client
- User lihat klip muncul satu per satu saat AI masih analisis
- Jauh lebih baik UX daripada menunggu semua klip selesai

### shadcn/ui CLI v4 (2026)
- Gunakan `npx shadcn@latest` (bukan `npx shadcn-ui@latest`)
- `--dry-run` untuk preview sebelum install komponen
- `--diff` untuk cek update komponen yang sudah diinstall

---

## 📝 CHANGELOG IMPLEMENTASI

```
[2026-06-14] v1.0.0 — Rencana Implementasi dibuat
  STATUS: Siap dikerjakan mulai Fase 0
  NEXT: Mulai dari 0.1.1 — scaffold proyek
```

---

*Update checklist ini setiap kali menyelesaikan satu item. AI yang melanjutkan harus membaca CHANGELOG sebelum mulai.*

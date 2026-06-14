# 📝 CHANGELOG — AI Auto Clip System

> Format: `[YYYY-MM-DD] vX.Y.Z — Deskripsi`
> Setiap item checklist `[x]` wajib dicatat di sini setelah selesai diimplementasikan.

---

## [2026-06-14] v0.2.0 — Initial Implementation (Fase 0 + Fase 1 + Fase 2 + Fase 3)

### 🏗️ FASE 0 — Project Scaffold

- **ADDED** `app/` — Proyek Next.js 16.2.9 + TypeScript + Tailwind CSS v4
- **ADDED** `next.config.ts` — COOP/COEP headers wajib untuk FFmpeg.wasm SharedArrayBuffer
- **ADDED** `vitest.config.ts` — Konfigurasi Vitest dengan environment jsdom + path alias `@/*`
- **ADDED** `src/test/setup.ts` — Setup `@testing-library/jest-dom` matchers
- **ADDED** `package.json` — Scripts: `test`, `test:run`, `test:coverage`, `db:generate`, `db:migrate`, `db:studio`
- **ADDED** `.env.example` — Template environment variables (12 Gemini keys, Neon DB, Vercel Blob)
- **ADDED** `.env.local` — File env lokal (kosong, harus diisi user)
- **ADDED** `.gitignore` — Exclude `.env.local`, `.next/`, `coverage/`, `playwright-report/`

### 📦 Dependencies Terinstall

| Package | Versi | Kegunaan |
|---|---|---|
| `next` | 16.2.9 | Framework |
| `react` / `react-dom` | 19.2.4 | UI runtime |
| `ai` | ^6.0.205 | Vercel AI SDK |
| `@ai-sdk/google` | ^3.0.82 | Gemini provider |
| `zod` | ^4.4.3 | Schema validation |
| `drizzle-orm` | ^0.45.2 | ORM |
| `@neondatabase/serverless` | ^1.1.0 | Neon Postgres driver |
| `@ffmpeg/ffmpeg` | ^0.12.15 | FFmpeg.wasm browser render |
| `@ffmpeg/util` | ^0.12.2 | FFmpeg utilities |
| `@vercel/blob` | ^2.4.0 | File storage |
| `lucide-react` | ^1.18.0 | Icons |
| `next-themes` | ^0.4.6 | Dark mode |
| `vitest` | ^4.1.8 | Unit testing |
| `drizzle-kit` | latest | DB migration CLI |

---

### 🧱 FASE 1 — Schemas & Types (TDD)

#### 1.1 Enums (shared)
- **ADDED** `src/lib/schema/enums.ts`
  - `hookTypeEnum` — `bold_claim | contrarian | preview_hook | question_hook | story_arc | punchline`
  - `emotionEnum` — `surprise | curiosity | anger | inspiration | humor | fear | joy`
  - `nicheEnum` — `motivation | finance | gaming | comedy | education | politics | sports | lifestyle | tech`
  - `platformEnum` — `tiktok | instagram_reels | youtube_shorts`
  - `sourceTypeEnum` — `podcast | stream | interview | seminar | sports | news | comedy | faceless`

#### 1.2 Source Schema
- **ADDED** `src/lib/schema/source.schema.ts`
  - Validasi URL harus valid URI (`.url()`)
  - Validasi `duration_seconds >= 60`
  - Validasi `type` harus dalam enum sourceType
  - Default `language = 'id'`
- **ADDED** `src/test/unit/schema/source.schema.test.ts` — **10 tests ✅**

#### 1.3 Strategy Schema
- **ADDED** `src/lib/schema/strategy.schema.ts`
  - `clipSchema` — validasi `clip_id` format `clip_XXX`, durasi 7–90s, virality 0–100
  - `strategySchema` — validasi array clips (1–20 item), target_platform min 1
  - Includes opsional `score_breakdown` per dimensi (0–10)
- **ADDED** `src/test/unit/schema/strategy.schema.test.ts` — **25 tests ✅**

#### 1.4 Config Schema (UI-Configurable)
- **ADDED** `src/lib/schema/config.schema.ts`
  - `analysisConfigSchema` — model, min/max clips, min/max duration, virality threshold, hook types, emotions, niche, language, platforms, thinking depth, require_human_approval
  - `renderConfigSchema` — resolution, aspect ratio, caption (enabled/font/position/style/colors), contrast/brightness/saturation
  - `keyManagerConfigSchema` — api_keys array, rotation_strategy, cooldown_seconds, max_retries
  - `.refine()` — validasi `min_clips <= max_clips`
  - Pre-parsed exports: `defaultAnalysisConfig`, `defaultRenderConfig`
- **ADDED** `src/test/unit/schema/config.schema.test.ts` — **21 tests ✅**

---

### 🔑 FASE 2 — Key Manager (TDD)

- **ADDED** `src/lib/ai/key-manager.ts`
  - Class `KeyManager` dengan 3 strategi rotasi: `round_robin`, `least_used`, `random`
  - `getAvailableKey()` — skip key cooldown & disabled secara otomatis
  - `markRateLimited(index)` — set cooldown berdasarkan `cooldown_seconds` dari config
  - Auto-reset cooldown setelah durasi habis
  - `getKeyStatuses()` — snapshot status semua key (untuk dashboard transparansi)
  - `getStats()` — agregat: total, active, limited, disabled, totalUseCount
  - Error classes: `GeminiRateLimitError`, `AllKeysExhaustedError`
- **ADDED** `src/test/unit/ai/key-manager.test.ts` — **18 tests ✅**
  - Round robin rotation, skip cooldown, skip disabled
  - Fake timers untuk test cooldown expiry
  - Strategi least_used

---

### 🤖 FASE 3 — AI Analyzer (TDD)

#### 3.1 Prompt Builder
- **ADDED** `src/lib/ai/prompt-builder.ts`
  - Fungsi `buildAnalysisPrompt(config)` — inject semua parameter config ke prompt
  - Dynamic: niche, platforms, hook types, emotions, duration range, virality threshold, language instruction, thinking depth note
  - Output JSON schema terdefinisi di dalam prompt (clip_id format, score_breakdown, ai_reasoning)
- **ADDED** `src/test/unit/ai/prompt-builder.test.ts` — **15 tests ✅**

#### 3.2 AI Analyzer
- **ADDED** `src/lib/ai/analyzer.ts`
  - Fungsi `analyzeVideo(transcript, config, keyManagerOptions)`
  - Auto-retry ke key berbeda jika kena HTTP 429 / rate limit
  - Parse + validasi response JSON via `strategySchema.parse()`
  - Return `AnalyzerResult` — strategy + metadata (model, keyIndex, tokenUsage, durationMs)

---

### 🗄️ Database Layer

- **ADDED** `src/lib/db/schema.ts` — Drizzle ORM schema:
  - Tabel `pipelines` — id, status, sourceUrl, configSnapshot, strategyJson, AI metadata
  - Tabel `clips` — id, pipelineId, semua field AI + human review + render result
  - Tabel `user_config` — singleton config user
- **ADDED** `src/lib/db/client.ts` — Neon serverless + Drizzle client
- **ADDED** `drizzle.config.ts` — Konfigurasi drizzle-kit untuk migration

---

### 🌐 API Routes

| Route | Method | Fungsi |
|---|---|---|
| `/api/pipeline/create` | POST | Buat pipeline baru, validasi source |
| `/api/pipeline/[id]/analyze` | POST | Trigger AI analysis async (202 Accepted) |
| `/api/pipeline/[id]/analyze` | GET | Status pipeline + daftar clips |
| `/api/clips/[id]/approve` | POST | Set `human_approved = true` |
| `/api/clips/[id]/reject` | POST | Set `human_rejected = true` |
| `/api/clips/[id]/title` | PATCH | Update judul klip (user override) |
| `/api/config` | GET | Baca config user (fallback ke default jika DB tidak ada) |
| `/api/config` | PUT | Simpan config user ke DB |

---

### 🎨 UI Pages

- **ADDED** `src/app/globals.css` — Design system lengkap:
  - Dark mode default, CSS variables untuk semua token
  - Classes: `.card`, `.btn`, `.badge`, `.progress-track`, `.score-bar`, `.glass-panel`
  - Animasi: `fade-in`, `slide-in`, `pulse`, `shimmer` (skeleton loading)
  - Tooltip via `data-tooltip` attribute
- **ADDED** `src/app/layout.tsx` — Root layout dengan font Inter + SEO metadata
- **ADDED** `src/app/page.tsx` — Dashboard:
  - Form submit URL video (URL, jenis konten, durasi)
  - List pipeline dengan status real-time
  - Stats footer (total, berhasil, dalam review)
- **ADDED** `src/app/pipeline/[id]/page.tsx` — Pipeline detail + review:
  - Status polling setiap 3 detik (auto-stop saat selesai)
  - `ClipCard` per klip dengan TransparencyPanel:
    - Hook type & emotion trigger badges
    - Virality score besar + score breakdown bars
    - AI reasoning dalam Bahasa Indonesia
    - Judul saran AI + tombol edit
  - Tombol Approve ✅ / Edit ✏️ / Reject ❌ per klip
  - Download `strategy.json` untuk klip yang di-approve
  - Form input transkrip inline untuk memulai analisis
  - Dashboard metadata pipeline (model, token usage, estimasi biaya)
- **ADDED** `src/app/settings/page.tsx` — Settings:
  - Semua parameter `AnalysisConfig` via slider & select
  - Semua parameter `RenderConfig` via slider, select & color picker
  - Tombol Save + Reset ke Default
  - Persist ke `/api/config`

---

### 🧪 Test Summary

```
 Test Files  5 passed (5)
      Tests  89 passed (89)
   Duration  ~20s
```

| Suite | File | Tests |
|---|---|---|
| Source Schema | `source.schema.test.ts` | 10 ✅ |
| Strategy Schema | `strategy.schema.test.ts` | 25 ✅ |
| Config Schema | `config.schema.test.ts` | 21 ✅ |
| Key Manager | `key-manager.test.ts` | 18 ✅ |
| Prompt Builder | `prompt-builder.test.ts` | 15 ✅ |
| **TOTAL** | | **89 ✅** |

---

### 🎞️ FASE 2 — Video Render (FFmpeg.wasm)

- **ADDED** `src/lib/render/ffmpeg-commands.ts` — Command builder untuk FFmpeg (Trim, Crop/Reframe 9:16/1:1, Color Grading eq filter, Caption Burn-in dengan font formatting)
- **ADDED** `src/test/unit/render/ffmpeg-commands.test.ts` — TDD Unit Test (8 test)
- **ADDED** `src/lib/render/ffmpeg-browser.ts` — Eksekusi WebAssembly FFmpeg di browser 1-pass execution (superfast) tanpa backend load ($0 cost)
- **ADDED** `src/app/api/clips/[id]/render-status/route.ts` — PATCH Endpoint untuk mengupdate status render klip (pending/rendering/done/error)
- **ADDED** `src/app/pipeline/[id]/render/page.tsx` — UI Rendering di browser dengan File picker lokal (melewati batasan CORS), progress bar realtime, preview render output, dan tombol download MP4.

---

### 📈 FASE 3 — Analytics & Feedback Loop

- **ADDED** Analytics fields di DB (`viewCount`, `likeCount`, `engagementRate`, `isHighPerformer`) via Drizzle schema & migrations.
- **ADDED** `src/app/api/clips/[id]/analytics/route.ts` — PATCH API untuk input manual view/likes, otomatis menghitung ER & flag High Performer.
- **ADDED** Input manual Analytics di `src/app/pipeline/[id]/page.tsx` untuk klip dengan status 'done'.
- **ADDED** `src/app/api/pipelines/route.ts` — GET Endpoint untuk pagination pipeline list.
- **CHANGED** `src/app/page.tsx` (Dashboard) — Menampilkan riwayat/history semua pipeline, fitur Search (judul/url/ID), & Filter status.
- **CHANGED** `src/app/settings/page.tsx` — Fitur Preset Niche Konfigurasi cepat (Motivation, Finance, Gaming).
- **CHANGED** `src/lib/ai/prompt-builder.ts` & `src/lib/ai/analyzer.ts` — AI Learning Loop: `analyzeVideo` sekarang menarik top 10 approved & high performing clips dari DB pengguna dan menyuntikkannya ke Prompt sebagai `historyContext` untuk meningkatkan akurasi sistem.

---

### 🚀 FASE 4 — Polishing & UX (Keyboard + Key Manager)

- **ADDED** Keyboard Shortcuts Vim-style di Review Page (`J`/`K` untuk navigasi klip, `A` Approve, `R` Reject, `E` Edit).
- **ADDED** API Key Manager UI di `src/app/settings/page.tsx` — Menyimpan array API Keys ke `user_config` DB, menggantikan hardcoded `.env.local`.
- **ADDED** Opsi UI "Strategi Rotasi" & "Max Retries" di Key Manager.
- **CHANGED** `api/config` GET/PUT mendukung struktur `keyManagerConfigSchema`.
- **CHANGED** `analyze/route.ts` kini memprioritaskan API Keys yang disimpan di DB pengguna sebelum fallback ke `.env.local`.
- **ADDED** Setup pengujian `src/test/e2e/review-flow.spec.ts` menggunakan Playwright dengan mocking route API Gemini.

---

> 🎉 **Status Proyek: SELSAY! 100% Sesuai Blueprint.**


## [2026-06-14] v0.1.0-alpha — Blueprint & Dokumentasi

- **ADDED** `BLUEPRINT.md` — Single source of truth: arsitektur, UI requirements, TDD specs, DB schema, panduan AI
- **ADDED** `IMPLEMENTATION_PLAN.md` — Rencana implementasi teknis step-by-step (Fase 0–3)
- **STATUS** Siap masuk Fase 0 (implementasi)

---

*Dokumen ini wajib diupdate setiap kali menyelesaikan item checklist dari `IMPLEMENTATION_PLAN.md`.*
*Format entri: `- [ADDED|CHANGED|FIXED|REMOVED] deskripsi singkat`*

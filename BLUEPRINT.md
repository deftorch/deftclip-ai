# 📋 PROJECT BLUEPRINT: AI Auto Clip System
**Versi:** 0.1.0-alpha  
**Tanggal:** 2026-06-14  
**Status:** Rancangan Awal — Siap Dikembangkan AI  
**Metode:** Test-Driven Development (TDD)  
**Target:** Hobby / Personal Use → Production-Ready

---

## 🧭 KONTEKS & TUJUAN

Dokumen ini adalah **sumber kebenaran tunggal (single source of truth)** untuk pengembangan sistem AI Auto Clip. Setiap AI yang mengembangkan sistem ini harus membaca seluruh dokumen ini sebelum menulis satu baris kode.

### Tujuan Sistem
Membangun pipeline otomatis yang menganalisis video panjang (podcast, stream, seminar) menggunakan AI, memilih momen terbaik untuk dijadikan short-form content (TikTok / Reels / YouTube Shorts), dan menghasilkan file video siap edit.

### Prinsip Pengembangan
1. **Test-first** — tidak ada fitur tanpa test yang mendefinisikannya terlebih dahulu
2. **UI-configurable** — setiap parameter yang bisa di-tune harus tersedia di UI, bukan hardcoded
3. **Transparent** — setiap keputusan AI harus bisa dilihat, dijelaskan, dan di-override user
4. **Incremental** — fase kecil, tervalidasi, baru lanjut ke fase berikutnya
5. **AI-readable** — kode dan komentar ditulis agar AI selanjutnya bisa langsung memahami konteks

---

## 🗂️ STRUKTUR PROYEK

```
ai-auto-clip/
│
├── README.md                          # Ringkasan proyek
├── BLUEPRINT.md                       # Dokumen ini
├── CHANGELOG.md                       # Log setiap perubahan
├── .env.example                       # Template environment variables
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Dashboard utama
│   │   ├── pipeline/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx           # Halaman detail pipeline
│   │   │   │   ├── review/page.tsx    # Halaman review klip
│   │   │   │   └── render/page.tsx    # Halaman render video
│   │   └── settings/
│   │       └── page.tsx               # Halaman konfigurasi global
│   │
│   ├── api/                           # Next.js API Routes
│   │   ├── pipeline/
│   │   │   ├── create/route.ts        # POST: buat pipeline baru
│   │   │   ├── [id]/route.ts          # GET/PATCH: detail & update pipeline
│   │   │   └── [id]/analyze/route.ts  # POST: trigger AI analysis
│   │   ├── clips/
│   │   │   ├── [id]/approve/route.ts  # POST: approve klip
│   │   │   └── [id]/reject/route.ts   # POST: reject klip
│   │   └── config/
│   │       └── route.ts               # GET/PUT: baca & simpan konfigurasi
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini-client.ts       # Wrapper Gemini + key rotation
│   │   │   ├── analyzer.ts            # Core: video → strategy.json
│   │   │   ├── prompt-builder.ts      # Builder prompt dari konfigurasi
│   │   │   └── key-manager.ts         # Manajemen 12 API key + cooldown
│   │   ├── schema/
│   │   │   ├── source.schema.ts       # Zod: validasi source
│   │   │   ├── strategy.schema.ts     # Zod: validasi strategy
│   │   │   ├── config.schema.ts       # Zod: validasi konfigurasi UI
│   │   │   └── master.schema.ts       # Zod: master pipeline
│   │   ├── render/
│   │   │   └── ffmpeg-browser.ts      # FFmpeg.wasm wrapper
│   │   └── db/
│   │       └── pipeline-store.ts      # Vercel Postgres operations
│   │
│   ├── components/
│   │   ├── pipeline/
│   │   │   ├── PipelineForm.tsx       # Form input URL + config
│   │   │   ├── PipelineStatus.tsx     # Status bar real-time
│   │   │   └── PipelineList.tsx       # Daftar pipeline
│   │   ├── review/
│   │   │   ├── ClipCard.tsx           # Kartu review per klip
│   │   │   ├── TransparencyPanel.tsx  # Panel penjelasan keputusan AI
│   │   │   ├── ScoreBreakdown.tsx     # Visualisasi virality score
│   │   │   └── ApproveBar.tsx         # Tombol approve / reject / edit
│   │   ├── config/
│   │   │   ├── AnalysisConfig.tsx     # Konfigurasi parameter AI
│   │   │   ├── KeyManager.tsx         # UI kelola API keys
│   │   │   └── PlatformPresets.tsx    # Preset per platform
│   │   └── ui/                        # Komponen generik (shadcn/ui)
│   │
│   └── types/
│       ├── pipeline.ts                # TypeScript types
│       ├── config.ts
│       └── ai-response.ts
│
└── tests/
    ├── unit/
    │   ├── schema/                    # Test validasi Zod schema
    │   ├── ai/                        # Test prompt builder & key manager
    │   └── render/                    # Test FFmpeg wrapper
    ├── integration/
    │   ├── api/                       # Test API routes
    │   └── pipeline/                  # Test alur pipeline end-to-end
    └── e2e/
        └── review-flow.spec.ts        # Test alur review UI
```

---

## ⚙️ KONFIGURASI YANG TERSEDIA DI UI

> **Aturan:** Setiap item di bawah ini HARUS bisa dikonfigurasi melalui UI Settings. Tidak boleh ada nilai yang hardcoded di kode produksi.

### 1. AI Analysis Config
```typescript
interface AnalysisConfig {
  // Model AI
  model: 'gemini-2.5-flash' | 'gemini-3-flash' | 'gemini-2.5-pro';
  
  // Jumlah klip yang diminta
  min_clips: number;          // default: 3, range: 1-5
  max_clips: number;          // default: 7, range: 5-20
  
  // Filter durasi klip
  min_duration_seconds: number;   // default: 15, range: 7-30
  max_duration_seconds: number;   // default: 60, range: 30-90
  
  // Threshold virality
  virality_threshold: number;     // default: 70, range: 50-95
  // Klip dengan skor di bawah threshold otomatis dibuang
  
  // Jenis hook yang diprioritaskan (multi-select)
  preferred_hook_types: HookType[];
  // default: ['bold_claim', 'story_arc', 'contrarian']
  
  // Emotion trigger yang ditarget (multi-select)
  target_emotions: EmotionTrigger[];
  // default: ['inspiration', 'curiosity', 'surprise']
  
  // Niche konten
  niche: Niche;               // default: 'motivation'
  
  // Bahasa sumber
  source_language: string;    // default: 'id'
  
  // Platform target (mempengaruhi style hook & durasi)
  target_platforms: Platform[];
  // default: ['tiktok', 'youtube_shorts']
  
  // Apakah human approval wajib sebelum render
  require_human_approval: boolean;  // default: true
  
  // Thinking depth Gemini (mempengaruhi kualitas & kecepatan)
  thinking_depth: 'minimal' | 'low' | 'medium' | 'high';
  // default: 'low' untuk kecepatan, 'high' untuk kualitas
}
```

### 2. API Key Manager Config
```typescript
interface KeyManagerConfig {
  // Daftar API keys (disimpan encrypted)
  api_keys: {
    key: string;              // Nilai key (dimasking di UI)
    label: string;            // Label user-defined (mis: "Akun Gmail 1")
    enabled: boolean;         // Bisa di-disable per key
  }[];
  
  // Strategi rotasi
  rotation_strategy: 'round_robin' | 'least_used' | 'random';
  // default: 'round_robin'
  
  // Cooldown setelah kena limit (detik)
  cooldown_seconds: number;   // default: 60, range: 30-300
  
  // Retry attempt sebelum throw error
  max_retries: number;        // default: 3
}
```

### 3. Render Config
```typescript
interface RenderConfig {
  // Resolusi output
  resolution: '1080x1920' | '720x1280';  // default: '1080x1920'
  
  // Aspect ratio
  aspect_ratio: '9:16' | '1:1' | '16:9'; // default: '9:16'
  
  // Caption
  caption_enabled: boolean;          // default: true
  caption_font_size: number;         // default: 48, range: 32-72
  caption_position: 'top' | 'middle' | 'bottom';  // default: 'bottom'
  caption_style: 'word_by_word' | 'full_line';    // default: 'full_line'
  caption_bg_color: string;          // default: '#000000'
  caption_text_color: string;        // default: '#FFFFFF'
  
  // Color grade sederhana
  contrast: number;         // default: 10, range: -50 to 50
  brightness: number;       // default: 0, range: -50 to 50
  saturation: number;       // default: 12, range: -50 to 50
}
```

---

## 🔍 TRANSPARANSI AI — UI REQUIREMENTS

> Ini adalah fitur inti yang membedakan sistem ini. Setiap keputusan AI harus bisa dilihat dan dipahami user.

### Panel Transparansi Per Klip

Setiap `ClipCard` di halaman Review harus menampilkan:

```
┌─────────────────────────────────────────────────────┐
│  CLIP 001  |  14:02 → 14:33  |  31 detik           │
├─────────────────────────────────────────────────────┤
│  [Preview thumbnail]                                 │
│                                                      │
│  "Kebanyakan orang gagal bukan karena kurang        │
│   kerja keras, tapi karena..."                      │
│                                                      │
├─────────────────────────────────────────────────────┤
│  MENGAPA AI MEMILIH MOMEN INI?                      │
│  ─────────────────────────────                      │
│  Hook: bold_claim ← karena ada klaim kuat di awal   │
│                                                      │
│  Virality Score: 91/100                             │
│  ████████████████████████░  91%                    │
│                                                      │
│  Breakdown skor:                                     │
│  • Kekuatan hook:        ████████  8/10             │
│  • Emotional impact:     █████████ 9/10             │
│  • Quotability:          ████████  8/10             │
│  • Durasi optimal:       █████████ 9/10             │
│                                                      │
│  Emotion: 😮 Inspiration                           │
│                                                      │
│  AI Reasoning:                                      │
│  "Pernyataan ini mengandung contrarian claim        │
│  yang kuat — menyalahkan asumsi umum tentang        │
│  kerja keras. Kemungkinan memicu curiosity          │
│  dan reshare tinggi di niche motivasi."             │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Judul Saran AI:                                    │
│  "Alasan sebenarnya kamu belum sukses 🔥"          │
│  [Edit judul]                                       │
│                                                      │
│  [✅ APPROVE]  [✏️ EDIT]  [❌ REJECT]              │
└─────────────────────────────────────────────────────┘
```

### Dashboard Transparansi Pipeline

Halaman utama pipeline harus menampilkan:

```
┌─────────────────────────────────────────────────────┐
│  PIPELINE STATUS                                     │
│                                                      │
│  ● Step 1: Input Validasi         ✅ Selesai        │
│  ● Step 2: AI Analysis            🔄 Sedang berjalan│
│    └─ Model: gemini-2.5-flash                       │
│    └─ API Key: Akun Gmail 3 (key #3)                │
│    └─ Thinking depth: low                           │
│    └─ Waktu berjalan: 00:23                         │
│  ● Step 3: Human Review           ⏳ Menunggu       │
│  ● Step 4: Render                 ⏳ Menunggu       │
│                                                      │
│  TOKEN USAGE (estimasi)                             │
│  Input:  ~45.000 token  ≈ $0.014                   │
│  Output: ~2.000 token   ≈ $0.005                   │
│  Total estimasi:        ≈ $0.019                   │
│                                                      │
│  API KEY STATUS                                     │
│  Key 1 (Akun Gmail 1):  ✅ Ready                   │
│  Key 2 (Akun Gmail 2):  ✅ Ready                   │
│  Key 3 (Akun Gmail 3):  🔄 Aktif digunakan         │
│  Key 4 (Akun Gmail 4):  ⏸️ Cooldown (00:43)        │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 TEST-DRIVEN DEVELOPMENT — SPESIFIKASI TEST

> Setiap fitur harus punya test yang ditulis SEBELUM implementasi.

### Struktur Test yang Diwajibkan

```
Untuk setiap fitur baru:
1. Tulis failing test dulu (RED)
2. Tulis implementasi minimal yang membuat test pass (GREEN)
3. Refactor kode sambil memastikan test tetap pass (REFACTOR)
```

### Test Suite yang Harus Ada di Fase 1

#### Unit Tests — Schema Validation
```typescript
// tests/unit/schema/strategy.schema.test.ts

describe('StrategySchema', () => {
  it('harus reject clip dengan durasi < 7 detik')
  it('harus reject clip dengan durasi > 90 detik')
  it('harus reject virality_score di luar range 0-100')
  it('harus reject hook_type yang tidak valid')
  it('harus reject clip_id yang tidak sesuai pattern clip_XXX')
  it('harus accept data yang valid')
  it('harus set human_approved default ke false')
})

describe('SourceSchema', () => {
  it('harus reject URL yang bukan valid URI')
  it('harus reject duration_seconds < 60')
  it('harus reject type yang tidak ada di enum')
  it('harus accept source yang valid')
})
```

#### Unit Tests — Key Manager
```typescript
// tests/unit/ai/key-manager.test.ts

describe('KeyManager', () => {
  it('harus rotasi ke key berikutnya setelah digunakan')
  it('harus skip key yang sedang cooldown')
  it('harus throw error jika semua key sedang cooldown')
  it('harus reset cooldown setelah durasi cooldown habis')
  it('harus mencatat waktu cooldown yang benar setelah 429')
  it('harus support strategi round_robin')
  it('harus support strategi least_used')
  it('harus skip key yang disabled')
})
```

#### Unit Tests — Prompt Builder
```typescript
// tests/unit/ai/prompt-builder.test.ts

describe('PromptBuilder', () => {
  it('harus include niche dalam prompt')
  it('harus include target_platforms dalam prompt')
  it('harus include preferred_hook_types dalam prompt')
  it('harus include min/max duration constraints dalam prompt')
  it('harus include virality_threshold dalam prompt')
  it('harus include target_emotions dalam prompt')
  it('harus menghasilkan prompt yang berbeda untuk config yang berbeda')
  it('harus include instruksi bahasa Indonesia jika source_language = id')
})
```

#### Integration Tests — API Routes
```typescript
// tests/integration/api/analyze.test.ts

describe('POST /api/pipeline/[id]/analyze', () => {
  it('harus return 400 jika pipeline tidak ditemukan')
  it('harus return 400 jika source URL tidak valid')
  it('harus return 202 Accepted dan mulai analisis async')
  it('harus menyimpan status pipeline sebagai "analyzing"')
  it('harus menggunakan konfigurasi yang disimpan user')
  it('harus retry dengan key lain jika kena 429')
  it('harus return 503 jika semua key kena limit')
})

describe('POST /api/clips/[id]/approve', () => {
  it('harus set human_approved = true')
  it('harus return 404 jika clip tidak ditemukan')
  it('harus update timestamp approved_at')
})
```

#### E2E Tests — Review Flow
```typescript
// tests/e2e/review-flow.spec.ts

describe('Review Flow', () => {
  it('user bisa submit URL dan memulai analisis')
  it('status pipeline terupdate real-time')
  it('klip hasil analisis tampil sebagai kartu')
  it('setiap kartu menampilkan transparency panel')
  it('user bisa approve klip')
  it('user bisa reject klip')
  it('user bisa edit judul saran AI')
  it('hanya klip yang approved yang masuk ke render')
})
```

---

## 🚦 FASE PENGEMBANGAN

### FASE 1 — Foundation (Target: Bisa digunakan sendiri)
**Definisi selesai:** User bisa paste URL YouTube, AI menganalisis, user review kartu klip, download `strategy.json`.

```
[ ] Setup proyek Next.js 15 + TypeScript + Tailwind + shadcn/ui
[ ] Setup testing: Vitest + Playwright
[ ] Tulis semua unit tests schema (RED)
[ ] Implementasi Zod schemas (GREEN)
[ ] Tulis unit tests KeyManager (RED)
[ ] Implementasi KeyManager dengan 12-key rotation (GREEN)
[ ] Tulis unit tests PromptBuilder (RED)
[ ] Implementasi PromptBuilder yang config-aware (GREEN)
[ ] Tulis integration tests API routes (RED)
[ ] Implementasi API routes (GREEN)
[ ] UI: Form input URL sederhana
[ ] UI: Status pipeline dengan transparansi langkah
[ ] UI: Kartu review klip dengan TransparencyPanel
[ ] UI: Approve / Reject / Edit judul
[ ] UI: Download strategy.json
[ ] UI: Settings — AnalysisConfig (semua parameter bisa diubah)
[ ] UI: Settings — KeyManager (tambah/hapus/enable/disable key)
[ ] E2E tests review flow (RED → GREEN)
```

### FASE 2 — Render (Target: Output video .mp4)
**Definisi selesai:** User bisa render klip yang di-approve menjadi file .mp4 dengan caption.

```
[ ] Tulis unit tests FFmpeg wrapper (RED)
[ ] Implementasi FFmpeg.wasm wrapper (GREEN)
[ ] Fungsi: potong video sesuai start_time / end_time
[ ] Fungsi: burn-in caption dari transcript_snippet
[ ] Fungsi: reframe ke 9:16
[ ] Fungsi: color grade dasar (contrast/brightness/saturation)
[ ] UI: Halaman render dengan progress bar
[ ] UI: Preview hasil render
[ ] UI: Download .mp4
[ ] UI: Settings — RenderConfig (semua parameter bisa diubah)
[ ] Integration tests render pipeline
```

### FASE 3 — Polish & Analytics (Target: Feedback loop)
**Definisi selesai:** User bisa track performa klip dan sistem belajar dari feedback.

```
[ ] UI: Dashboard analytics per klip
[ ] Fitur: Input manual view count / engagement
[ ] Fitur: Sistem flagging klip yang perform baik
[ ] Fitur: AI belajar dari klip mana yang di-approve vs reject
[ ] Fitur: Preset konfigurasi tersimpan per niche
[ ] UI: Riwayat pipeline
[ ] Optimasi kecepatan analisis
```

---

## 🔌 ENVIRONMENT VARIABLES

```bash
# .env.example

# ═══════════════════════════════════
# GEMINI API KEYS (tambah sesuai jumlah akun)
# ═══════════════════════════════════
GEMINI_KEY_01="AIza..."
GEMINI_KEY_02="AIza..."
GEMINI_KEY_03="AIza..."
GEMINI_KEY_04="AIza..."
GEMINI_KEY_05="AIza..."
GEMINI_KEY_06="AIza..."
GEMINI_KEY_07="AIza..."
GEMINI_KEY_08="AIza..."
GEMINI_KEY_09="AIza..."
GEMINI_KEY_10="AIza..."
GEMINI_KEY_11="AIza..."
GEMINI_KEY_12="AIza..."

# ═══════════════════════════════════
# DATABASE
# ═══════════════════════════════════
POSTGRES_URL=""              # Vercel Postgres connection string

# ═══════════════════════════════════
# STORAGE
# ═══════════════════════════════════
BLOB_READ_WRITE_TOKEN=""     # Vercel Blob token

# ═══════════════════════════════════
# APP
# ═══════════════════════════════════
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 📊 DATABASE SCHEMA

```sql
-- Pipeline: satu sesi analisis video
CREATE TABLE pipelines (
  id            TEXT PRIMARY KEY,          -- pipeline_001, pipeline_002
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  status        TEXT NOT NULL,             -- 'pending' | 'analyzing' | 'review' | 'rendering' | 'done' | 'error'
  
  -- Source
  source_url    TEXT NOT NULL,
  source_type   TEXT,                      -- 'podcast' | 'stream' | dll
  source_title  TEXT,
  
  -- Config yang dipakai saat analisis (snapshot)
  config_snapshot JSONB,                   -- salinan config saat analisis dijalankan
  
  -- AI Analysis result
  strategy_json JSONB,                     -- strategy.json hasil AI
  
  -- Metadata
  ai_model_used     TEXT,
  api_key_index_used INTEGER,
  token_usage_input  INTEGER,
  token_usage_output INTEGER,
  analysis_duration_ms INTEGER,
  error_message TEXT
);

-- Clips: setiap klip hasil analisis
CREATE TABLE clips (
  id              TEXT PRIMARY KEY,        -- clip_001, clip_002
  pipeline_id     TEXT REFERENCES pipelines(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Data dari strategy.json
  start_time      NUMERIC NOT NULL,
  end_time        NUMERIC NOT NULL,
  duration        NUMERIC NOT NULL,
  hook_type       TEXT NOT NULL,
  virality_score  INTEGER NOT NULL,
  emotion_trigger TEXT,
  transcript_snippet TEXT,
  ai_suggested_title TEXT,
  ai_reasoning    TEXT,                    -- Penjelasan AI kenapa pilih momen ini
  
  -- Human decision
  human_approved  BOOLEAN DEFAULT FALSE,
  human_rejected  BOOLEAN DEFAULT FALSE,
  user_edited_title TEXT,                  -- Judul yang diedit user
  reviewed_at     TIMESTAMPTZ,
  
  -- Render result
  render_status   TEXT,                    -- 'pending' | 'rendering' | 'done' | 'error'
  output_file_url TEXT,                    -- URL file .mp4 di Vercel Blob
  rendered_at     TIMESTAMPTZ
);

-- Config: konfigurasi yang disimpan user
CREATE TABLE user_config (
  id          TEXT PRIMARY KEY DEFAULT 'default',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  config      JSONB NOT NULL              -- AnalysisConfig + RenderConfig tersimpan
);
```

---

## 🎨 UI DESIGN PRINCIPLES

### Tone Visual
- **Dark mode** sebagai default — lebih nyaman untuk sesi panjang
- Warna aksen: hijau untuk approve, merah untuk reject, kuning untuk warning
- Font: monospace untuk nilai JSON/timestamp, sans-serif untuk narasi

### Prinsip Transparansi
- Setiap angka harus punya tooltip penjelasan
- Setiap keputusan AI harus disertai `ai_reasoning` dalam bahasa Indonesia
- Status API key harus selalu terlihat (berapa yang aktif, berapa cooldown)
- Token usage dan estimasi biaya harus selalu ditampilkan

### Accessibility
- Semua aksi penting punya keyboard shortcut (A = approve, R = reject, E = edit)
- Color tidak boleh satu-satunya indikator status (pakai ikon juga)

---

## 📝 PANDUAN UNTUK AI PENGEMBANG

Jika kamu adalah AI yang melanjutkan pengembangan sistem ini, baca panduan ini:

### Sebelum Menulis Kode
1. Baca seluruh BLUEPRINT.md ini
2. Cek `CHANGELOG.md` untuk status terkini
3. Cek test yang sudah ada di folder `tests/`
4. Pastikan kamu tahu fase mana yang sedang dikerjakan

### Aturan Wajib
- **Tulis test dulu sebelum implementasi** — ini tidak opsional
- **Jangan hardcode nilai konfigurasi** — semua config harus dari `user_config` di database atau environment variable
- **Setiap fungsi AI-critical harus punya error boundary** — jangan biarkan error AI membuat seluruh app crash
- **Tambahkan JSDoc** di setiap fungsi publik dengan parameter dan return type
- **Update CHANGELOG.md** setiap kali menyelesaikan item checklist

### Konvensi Penamaan
```
Komponen React:     PascalCase (ClipCard, TransparencyPanel)
Fungsi/variabel:    camelCase (analyzeVideo, getAvailableKey)
File:               kebab-case (key-manager.ts, clip-card.tsx)
Konstanta:          UPPER_SNAKE_CASE (MAX_RETRIES, DEFAULT_MODEL)
Test file:          namaFile.test.ts atau namaFile.spec.ts
```

### Error Handling Convention
```typescript
// Selalu gunakan typed errors
class GeminiRateLimitError extends Error {
  constructor(public keyIndex: number) {
    super(`API key ${keyIndex} hit rate limit`);
    this.name = 'GeminiRateLimitError';
  }
}

class AllKeysExhaustedError extends Error {
  constructor() {
    super('All API keys are currently rate limited');
    this.name = 'AllKeysExhaustedError';
  }
}
```

---

## 📦 DEPENDENCIES YANG DIGUNAKAN

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "ai": "^6.0.0",
    "@ai-sdk/google": "latest",
    "zod": "^3.0.0",
    "@vercel/postgres": "latest",
    "@vercel/blob": "latest",
    "@ffmpeg/ffmpeg": "^0.12.0",
    "@ffmpeg/util": "^0.12.0",
    "shadcn-ui": "latest",
    "tailwindcss": "^3.4.0",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 🔄 CHANGELOG

```
[2026-06-14] v0.1.0-alpha
  - ADDED: Blueprint awal dibuat
  - ADDED: Struktur proyek didefinisikan
  - ADDED: Semua konfigurasi UI didefinisikan
  - ADDED: Spesifikasi test suite lengkap
  - ADDED: Database schema
  - ADDED: Panduan untuk AI pengembang
  - STATUS: Siap masuk Fase 1
```

---

*Dokumen ini adalah living document — update setiap kali ada perubahan signifikan pada arsitektur atau keputusan teknis.*

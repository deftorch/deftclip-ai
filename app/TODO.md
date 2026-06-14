# ✅ TODO — AI Auto Clip System

> Daftar item yang belum selesai diimplementasikan.
> Centang `[x]` dan pindahkan ke `CHANGELOG.md` setelah selesai.
> Kerjakan **urut dari atas ke bawah** sesuai urutan fase.

---

## 🔧 Fase 0 — Setup (Tersisa)

- [x] **0.2.1** Buat akun Neon di [neon.tech](https://neon.tech) dan isi `DATABASE_URL` + `DATABASE_URL_UNPOOLED` di `.env.local`
- [x] **0.2.5** Jalankan migrasi database pertama:
  ```bash
  npm run db:generate
  npm run db:migrate
  ```
- [x] **0.2.6** Verifikasi tabel `pipelines`, `clips`, `user_config` berhasil dibuat di Neon dashboard
- [x] **0.1.3** Install Playwright dan browser:
  ```bash
  npm install -D @playwright/test
  npx playwright install chromium
  ```
- [x] **0.1.6** Tambah `playwright.config.ts`
- [x] Isi minimal 1 Gemini API key di `.env.local` (`GEMINI_KEY_01`)

---

## 🎬 Fase 2 Blueprint — Video Render (FFmpeg.wasm)

> **Definisi selesai:** User bisa render klip yang di-approve menjadi file `.mp4` dengan caption.

- [x] Tulis unit tests FFmpeg wrapper (RED):
  - [x] Test fungsi potong video (`trimVideo`)
  - [x] Test burn-in caption (`burnCaption`)
  - [x] Test reframe ke 9:16 (`reframe`)
  - [x] Test color grade (`applyColorGrade`)

- [x] **Implementasi** `src/lib/render/ffmpeg-browser.ts`:
  - [x] Load FFmpeg.wasm dari CDN
  - [x] `trimVideo(inputUrl, startTime, endTime)` — potong sesuai `start_time/end_time`
  - [x] `burnCaption(text, position, style, fontSize, bgColor, textColor)` — burn-in dari `transcript_snippet`
  - [x] `reframe(aspectRatio)` — reframe ke 9:16 / 1:1 / 16:9
  - [x] `applyColorGrade(contrast, brightness, saturation)` — color grade dasar

- [x] **UI** `src/app/pipeline/[id]/render/page.tsx`:
  - [x] Halaman render dengan list klip yang di-approve
  - [x] Progress bar per klip saat rendering
  - [x] Preview hasil render (video element)
  - [x] Tombol download `.mp4`
  - [x] Integrasi `RenderConfig` dari Settings

- [x] **API** `src/app/api/clips/[id]/render-status/route.ts`:
  - [x] Simpan output file URL ke kolom `output_file_url` di tabel `clips`
  - [x] Update `render_status` per klip

- [ ] Integration tests render pipeline (GREEN)
- [ ] Update `CHANGELOG.md` saat selesai

---

## 📊 Fase 3 Blueprint — Analytics & Feedback Loop

> **Definisi selesai:** User bisa track performa klip dan sistem belajar dari feedback.

- [x] **UI** Dashboard analytics per klip:
  - [x] Input manual view count / like count / engagement rate
  - [x] Grafik performa sederhana per pipeline

- [x] **Fitur** sistem flagging klip perform baik:
  - [x] Tandai klip dengan engagement tinggi
  - [x] Filter klip berdasarkan performa

- [x] **Fitur** AI learning dari history:
  - [x] Simpan pola klip yang di-approve vs reject per user
  - [x] Kirim context history ke prompt saat analisis berikutnya

- [x] **Fitur** Preset konfigurasi per niche:
  - [x] UI simpan/load preset di Settings
  - [x] Preset bawaan untuk niche populer (motivation, finance, gaming)

- [x] **UI** Riwayat pipeline:
  - [x] Pagination di halaman dashboard
  - [x] Filter berdasarkan status & niche
  - [x] Search berdasarkan URL / judul

- [ ] Optimasi kecepatan analisis (caching transkrip, streaming response)
- [ ] Update `CHANGELOG.md` saat selesai

---

## 🔐 Fase 4 — Key Manager UI (tersisa dari Blueprint)

- [x] **UI** `src/components/config/KeyManager.tsx`:
  - [x] Tambah API key baru (masked input)
  - [x] Hapus / disable key
  - [x] Label per key (mis. "Akun Gmail 1")
  - [x] Lihat status real-time (aktif / cooldown countdown / disabled)
  - [x] Pilih strategi rotasi dari UI

- [x] Simpan daftar key ke database (encrypted) — saat ini hanya dari env

---

## 🧪 E2E Tests (Playwright)

- [x] `e2e/review-flow.spec.ts`:
  - [x] User bisa submit URL dan memulai analisis
  - [x] Status pipeline terupdate real-time
  - [x] Klip hasil analisis tampil sebagai kartu
  - [x] Setiap kartu menampilkan transparency panel
  - [x] User bisa approve klip (`A`)
  - [x] User bisa reject klip (`R`)
  - [x] User bisa edit judul saran AI (`E`)
  - [x] Hanya klip yang approved yang masuk ke render

---

## ⌨️ Keyboard Shortcuts

- [x] Implementasi keyboard handler di `pipeline/[id]/page.tsx`:
  - [x] `A` → Approve klip yang sedang fokus
  - [x] `R` → Reject klip yang sedang fokus
  - [x] `E` → Edit judul klip yang sedang fokus
  - [x] `J/K` → Navigasi antar klip (vim-style)

---

*Update file ini setiap sesi kerja. Pindahkan item selesai ke `CHANGELOG.md`.*

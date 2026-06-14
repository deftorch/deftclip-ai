# ✅ TODO — AI Auto Clip System

> Daftar item yang belum selesai diimplementasikan.
> Centang `[x]` dan pindahkan ke `CHANGELOG.md` setelah selesai.
> Kerjakan **urut dari atas ke bawah** sesuai urutan fase.

---

## 🔧 Fase 0 — Setup (Tersisa)

- [ ] **0.2.1** Buat akun Neon di [neon.tech](https://neon.tech) dan isi `DATABASE_URL` + `DATABASE_URL_UNPOOLED` di `.env.local`
- [ ] **0.2.5** Jalankan migrasi database pertama:
  ```bash
  npm run db:generate
  npm run db:migrate
  ```
- [ ] **0.2.6** Verifikasi tabel `pipelines`, `clips`, `user_config` berhasil dibuat di Neon dashboard
- [ ] **0.1.3** Install Playwright dan browser:
  ```bash
  npm install -D @playwright/test
  npx playwright install chromium
  ```
- [ ] **0.1.6** Tambah `playwright.config.ts`
- [ ] Isi minimal 1 Gemini API key di `.env.local` (`GEMINI_KEY_01`)

---

## 🎬 Fase 2 Blueprint — Video Render (FFmpeg.wasm)

> **Definisi selesai:** User bisa render klip yang di-approve menjadi file `.mp4` dengan caption.

- [ ] Tulis unit tests FFmpeg wrapper (RED):
  - [ ] Test fungsi potong video (`trimVideo`)
  - [ ] Test burn-in caption (`burnCaption`)
  - [ ] Test reframe ke 9:16 (`reframe`)
  - [ ] Test color grade (`applyColorGrade`)

- [ ] **Implementasi** `src/lib/render/ffmpeg-browser.ts`:
  - [ ] Load FFmpeg.wasm dari CDN
  - [ ] `trimVideo(inputUrl, startTime, endTime)` — potong sesuai `start_time/end_time`
  - [ ] `burnCaption(text, position, style, fontSize, bgColor, textColor)` — burn-in dari `transcript_snippet`
  - [ ] `reframe(aspectRatio)` — reframe ke 9:16 / 1:1 / 16:9
  - [ ] `applyColorGrade(contrast, brightness, saturation)` — color grade dasar

- [ ] **UI** `src/app/pipeline/[id]/render/page.tsx`:
  - [ ] Halaman render dengan list klip yang di-approve
  - [ ] Progress bar per klip saat rendering
  - [ ] Preview hasil render (video element)
  - [ ] Tombol download `.mp4`
  - [ ] Integrasi `RenderConfig` dari Settings

- [ ] **API** `src/app/api/pipeline/[id]/render/route.ts`:
  - [ ] Simpan output file URL ke kolom `output_file_url` di tabel `clips`
  - [ ] Update `render_status` per klip

- [ ] Integration tests render pipeline (GREEN)
- [ ] Update `CHANGELOG.md` saat selesai

---

## 📊 Fase 3 Blueprint — Analytics & Feedback Loop

> **Definisi selesai:** User bisa track performa klip dan sistem belajar dari feedback.

- [ ] **UI** Dashboard analytics per klip:
  - [ ] Input manual view count / like count / engagement rate
  - [ ] Grafik performa sederhana per pipeline

- [ ] **Fitur** sistem flagging klip perform baik:
  - [ ] Tandai klip dengan engagement tinggi
  - [ ] Filter klip berdasarkan performa

- [ ] **Fitur** AI learning dari history:
  - [ ] Simpan pola klip yang di-approve vs reject per user
  - [ ] Kirim context history ke prompt saat analisis berikutnya

- [ ] **Fitur** Preset konfigurasi per niche:
  - [ ] UI simpan/load preset di Settings
  - [ ] Preset bawaan untuk niche populer (motivation, finance, gaming)

- [ ] **UI** Riwayat pipeline:
  - [ ] Pagination di halaman dashboard
  - [ ] Filter berdasarkan status & niche
  - [ ] Search berdasarkan URL / judul

- [ ] Optimasi kecepatan analisis (caching transkrip, streaming response)
- [ ] Update `CHANGELOG.md` saat selesai

---

## 🔐 Fase 4 — Key Manager UI (tersisa dari Blueprint)

- [ ] **UI** `src/components/config/KeyManager.tsx`:
  - [ ] Tambah API key baru (masked input)
  - [ ] Hapus / disable key
  - [ ] Label per key (mis. "Akun Gmail 1")
  - [ ] Lihat status real-time (aktif / cooldown countdown / disabled)
  - [ ] Pilih strategi rotasi dari UI

- [ ] Simpan daftar key ke database (encrypted) — saat ini hanya dari env

---

## 🧪 E2E Tests (Playwright)

- [ ] `e2e/review-flow.spec.ts`:
  - [ ] User bisa submit URL dan memulai analisis
  - [ ] Status pipeline terupdate real-time
  - [ ] Klip hasil analisis tampil sebagai kartu
  - [ ] Setiap kartu menampilkan transparency panel
  - [ ] User bisa approve klip (`A`)
  - [ ] User bisa reject klip (`R`)
  - [ ] User bisa edit judul saran AI (`E`)
  - [ ] Hanya klip yang approved yang masuk ke render

---

## ⌨️ Keyboard Shortcuts

- [ ] Implementasi keyboard handler di `pipeline/[id]/page.tsx`:
  - `A` → Approve klip yang sedang fokus
  - `R` → Reject klip yang sedang fokus
  - `E` → Edit judul klip yang sedang fokus
  - `J/K` → Navigasi antar klip (vim-style)

---

*Update file ini setiap sesi kerja. Pindahkan item selesai ke `CHANGELOG.md`.*

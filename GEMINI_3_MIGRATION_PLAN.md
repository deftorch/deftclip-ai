# 🚀 Blueprint: Gemini 3.5 & Agentic Workflow Migration

Dokumen ini merangkum peta jalan (*roadmap*) pengembangan **Fase 5** untuk sistem AI Auto Clip, berfokus pada integrasi teknologi Google Gemini generasi ke-3 (edisi 2026). Fokus utama adalah efisiensi biaya, skalabilitas menggunakan *Context Caching*, dan penalaran kontekstual tingkat lanjut menggunakan video utuh (*Native Multimodality*).

---

## 🎯 Objektif Utama
1. **Migrasi Model**: Mengganti model `gemini-2.5-flash` menjadi `gemini-3.5-flash` untuk mendapatkan logika agen cerdas dengan kecepatan lebih tinggi.
2. **Optimalisasi Biaya API**: Menggunakan **Context Caching** untuk menyimpan instruksi sistem yang tebal dan *User History Context* agar tidak ditagih penuh berulang kali.
3. **Analisis Video Langsung (Multimodal)**: Tidak lagi hanya bergantung pada teks transkrip; AI akan mampu "menonton" dan "mendengarkan" intonasi emosi langsung dari berkas video/audio.
4. **Agentic Workflows**: Agen otomatis yang bisa berinteraksi dengan API eksternal (misal: otomatis mencari *B-Roll* dari Pexels berdasarkan transkrip klip).

---

## 🗺️ Peta Jalan Implementasi (Phase 5)

### Tahap 1: Persiapan & Konfigurasi (Quick Wins)
- [x] **Update Config Schema**: 
  - Edit `src/lib/schema/config.schema.ts` untuk menambahkan `gemini-3.5-flash` dan `gemini-3.1-pro` ke dalam opsi model.
  - Setel `gemini-3.5-flash` sebagai default baru di sistem UI.
- [x] **SDK Upgrade**: 
  - Pastikan Vercel AI SDK dan `@ai-sdk/google` berada pada versi terbaru yang sepenuhnya mendukung rilis Gemini Mei/Juni 2026.
  - Periksa *backward compatibility* pada `strategySchema` agar *Structured Outputs* JSON tetap absolut.

### Tahap 2: Context Caching untuk "User History"
*Saat ini, kita melampirkan sejarah klip sukses ke dalam setiap prompt. Seiring bertambah besarnya history, ini akan mahal secara jumlah token.*
- [x] **Implementasi Cache API**:
  - Buat utilitas khusus di `src/lib/ai/caching.ts` untuk memanggil Gemini Cache API.
  - Kumpulkan instruksi sistem, penjabaran target *niche*, dan teks panjang dari *historyContext* (klip High Performer) menjadi satu objek *Cache*.
- [x] **Manajemen Lifecycle Cache**:
  - Cache Gemini kedaluwarsa secara default. Buat logika untuk memperbarui (*refresh*) atau membuat ulang *cache* jika terdapat klip High Performer baru di *database*.
- [x] **Integrasi dengan Analyzer**:
  - Ubah `analyzeVideo` agar menggunakan ID Cache alih-alih melempar teks *prompt* statis dari nol pada setiap *request*.

### Tahap 3: Native Multimodal Pipeline (Menonton Video)
*Meninggalkan keterbatasan teks. AI harus memahami gestur visual dan emosi vokal.*
- [x] **Ekstraksi Audio/Klip Kecil via FFmpeg Browser**:
  - Modifikasi `ffmpeg-browser.ts` agar dapat mengekstrak audio `16kbps` (atau video `360p`) berdurasi panjang sebelum diunggah ke Vercel Blob / dikirim ke Gemini.
- [x] **Integrasi Google File API**:
  - Jika video > 20 MB, gunakan *Google File API* (dari AI SDK) untuk mengunggah berkas multimedia sebelum memanggil `generateObject`. *(Diimplementasikan menggunakan Buffer Base64 untuk file MP3 ultra-ringan)*
- [x] **Update Prompt Multimodal**:
  - Ubah perintah di `prompt-builder.ts` agar menyertakan: *"Tonton video terlampir dan dengarkan intonasinya. Hanya pilih momen di mana subjek menunjukkan emosi 'marah' atau gestur tangan yang kuat."*

### Tahap 4: Agentic Features (Auto B-Roll & Smart Titles)
- [x] **Function Calling (Tools)**:
  - Bekali model Gemini di `analyzer.ts` dengan alat/tool `search_broll_footage`.
  - Jika Gemini mendeteksi klip membicarakan "hutan", ia otomatis memanggil fungsi pencarian video gratis (via Pexels API) dan mereturn URL videonya di objek JSON.
- [x] **Penyisipan B-Roll ke FFmpeg**:
  - Update `ffmpeg-browser.ts` untuk mendukung *overlay* video (*picture-in-picture* atau transisi penuh) jika klip memiliki data B-Roll dari Gemini.

---

## 📈 Metrik Keberhasilan (KPI)
*   **Kecepatan Analisis**: Analisis tetap berlangsung di bawah 15 detik meski menggunakan data histori panjang (terbantu oleh *Context Caching*).
*   **Kualitas Klip**: Emosi, tawa, dan intonasi suara dapat terdeteksi akurat berkat kapabilitas *Native Multimodal*.
*   **Efisiensi Token**: Biaya token *input* bulanan menurun signifikan (target 60-80% lebih hemat) berkat penggunaan mekanisme Caching.

---

*Catatan: Tahap 1 dapat langsung diimplementasikan hari ini karena hanya memerlukan pembaruan konfigurasi `Zod` schema dan UI Settings.*

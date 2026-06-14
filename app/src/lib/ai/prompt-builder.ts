import type { AnalysisConfig } from '@/lib/schema/config.schema'

/**
 * Membangun prompt analisis video untuk Gemini.
 * Setiap parameter dari `config` di-inject ke prompt,
 * sehingga perubahan di UI Settings langsung mempengaruhi kualitas analisis.
 *
 * @param config - Konfigurasi analisis dari user
 * @returns Prompt string siap dikirim ke Gemini
 */
export function buildAnalysisPrompt(config: AnalysisConfig): string {
  const langInstruction =
    config.source_language === 'id'
      ? 'Konten dalam Bahasa Indonesia. Prioritaskan momen yang akan viral di audiens Indonesia.'
      : `Content in language: ${config.source_language}. Analyze accordingly.`

  const hookList = config.preferred_hook_types.join(', ')
  const emotionList = config.target_emotions.join(', ')
  const platformList = config.target_platforms.join(', ')

  const thinkingNote =
    config.thinking_depth === 'high'
      ? 'Lakukan analisis mendalam dengan pertimbangan konteks penuh.'
      : config.thinking_depth === 'medium'
        ? 'Lakukan analisis standar dengan pertimbangan yang cukup.'
        : 'Lakukan analisis cepat dengan fokus pada sinyal virality paling kuat.'

  return `Kamu adalah AI content strategist spesialis konten viral untuk platform short-form.

${langInstruction}

## TUGAS
Analisis transkrip video berikut dan identifikasi momen terbaik untuk dijadikan konten short-form.

## PARAMETER ANALISIS
- Niche konten: ${config.niche}
- Target platform: ${platformList}
- Jumlah klip: ${config.min_clips} sampai ${config.max_clips} klip
- Durasi klip: ${config.min_duration_seconds} - ${config.max_duration_seconds} detik
- Threshold virality: minimal skor ${config.virality_threshold}/100
- Hook yang diprioritaskan: ${hookList}
- Emosi yang ditarget: ${emotionList}
- ${thinkingNote}

## KRITERIA PEMILIHAN KLIP
Pilih momen yang memiliki:
1. Hook yang kuat di 3 detik pertama (tipe: ${hookList})
2. Emotional trigger yang relevan (target: ${emotionList})
3. Standalone — bisa dipahami tanpa konteks sebelumnya
4. Quotable — mengandung kalimat yang bisa dijadikan caption
5. Virality score >= ${config.virality_threshold}

## FORMAT OUTPUT (JSON WAJIB)
Kembalikan HANYA JSON valid berikut, tanpa teks tambahan:

{
  "niche": "${config.niche}",
  "target_platform": ${JSON.stringify(config.target_platforms)},
  "clips": [
    {
      "clip_id": "clip_001",
      "start_time": <detik float>,
      "end_time": <detik float>,
      "duration": <durasi float>,
      "hook_type": "<${hookList}>",
      "virality_score": <0-100>,
      "emotion_trigger": "<${emotionList}>",
      "transcript_snippet": "<kutipan max 500 karakter>",
      "ai_suggested_title": "<judul menarik max 100 karakter>",
      "ai_reasoning": "<penjelasan dalam Bahasa Indonesia kenapa momen ini dipilih, 2-3 kalimat>",
      "human_approved": false,
      "score_breakdown": {
        "hook_strength": <0-10>,
        "emotional_impact": <0-10>,
        "quotability": <0-10>,
        "optimal_duration": <0-10>
      }
    }
  ]
}

PENTING:
- clip_id harus format clip_001, clip_002, dst.
- Hanya sertakan klip dengan virality_score >= ${config.virality_threshold}
- Urutkan dari virality_score tertinggi
- Maksimal ${config.max_clips} klip
- ai_reasoning HARUS dalam Bahasa Indonesia
- Jangan sertakan klip dengan durasi di luar ${config.min_duration_seconds}-${config.max_duration_seconds} detik`
}

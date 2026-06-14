import { NextResponse } from 'next/server'
import { analyzeVideo } from '@/lib/ai/analyzer'
import { analysisConfigSchema, defaultAnalysisConfig } from '@/lib/schema/config.schema'

/**
 * POST /api/pipeline/[id]/analyze
 * Memulai analisis AI pada pipeline yang sudah ada.
 *
 * Body: { transcript: string }
 * Response: 202 Accepted — analisis berjalan async
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Field transcript wajib ada dan harus berupa string' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
    }

    const { db } = await import('@/lib/db/client')
    const { pipelines, clips, userConfig } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    // Ambil pipeline dari database
    const [pipeline] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, id))
      .limit(1)

    if (!pipeline) {
      return NextResponse.json(
        { error: `Pipeline ${id} tidak ditemukan` },
        { status: 404 }
      )
    }

    if (pipeline.status === 'analyzing') {
      return NextResponse.json(
        { error: 'Pipeline sedang dalam proses analisis' },
        { status: 409 }
      )
    }

    // Ambil konfigurasi user dari database
    const [configRow] = await db
      .select()
      .from(userConfig)
      .where(eq(userConfig.id, 'default'))
      .limit(1)

    const rawConfig = configRow?.config ?? {}
    const config = analysisConfigSchema.parse({
      ...defaultAnalysisConfig,
      ...(rawConfig as object),
    })

    // Update status ke 'analyzing'
    await db
      .update(pipelines)
      .set({ status: 'analyzing', updatedAt: new Date() })
      .where(eq(pipelines.id, id))

    // Bangun key manager options dari env
    const envKeys = Array.from({ length: 12 }, (_, i) => {
      const keyValue = process.env[`GEMINI_KEY_${String(i + 1).padStart(2, '0')}`]
      return keyValue
        ? { key: keyValue, label: `Key ${i + 1}`, enabled: true }
        : null
    }).filter(Boolean) as { key: string; label: string; enabled: boolean }[]

    if (envKeys.length === 0) {
      await db
        .update(pipelines)
        .set({
          status: 'error',
          errorMessage: 'Tidak ada API key yang terkonfigurasi',
          updatedAt: new Date(),
        })
        .where(eq(pipelines.id, id))
      return NextResponse.json(
        { error: 'Tidak ada Gemini API key yang dikonfigurasi' },
        { status: 503 }
      )
    }

    // Jalankan analisis (async — respond 202 dulu, proses di background)
    const analyzeAsync = async () => {
      try {
        const result = await analyzeVideo(transcript, config, {
          keys: envKeys,
          rotation_strategy: 'round_robin',
          cooldown_seconds: 60,
          max_retries: envKeys.length,
        })

        // Simpan strategy ke pipeline
        await db
          .update(pipelines)
          .set({
            status: config.require_human_approval ? 'review' : 'rendering',
            strategyJson: result.strategy,
            configSnapshot: config,
            aiModelUsed: result.metadata.model,
            apiKeyIndexUsed: result.metadata.apiKeyIndex,
            apiKeyLabelUsed: result.metadata.apiKeyLabel,
            tokenUsageInput: result.metadata.tokenUsageInput,
            tokenUsageOutput: result.metadata.tokenUsageOutput,
            analysisDurationMs: result.metadata.durationMs,
            updatedAt: new Date(),
          })
          .where(eq(pipelines.id, id))

        // Insert clips ke tabel terpisah
        for (const clip of result.strategy.clips) {
          await db.insert(clips).values({
            id: `${id}_${clip.clip_id}`,
            pipelineId: id,
            startTime: String(clip.start_time),
            endTime: String(clip.end_time),
            duration: String(clip.duration),
            hookType: clip.hook_type,
            viralityScore: clip.virality_score,
            emotionTrigger: clip.emotion_trigger,
            transcriptSnippet: clip.transcript_snippet,
            aiSuggestedTitle: clip.ai_suggested_title,
            aiReasoning: clip.ai_reasoning,
            scoreBreakdown: clip.score_breakdown,
          })
        }
      } catch (err) {
        const error = err as Error
        await db
          .update(pipelines)
          .set({
            status: 'error',
            errorMessage: error.message,
            updatedAt: new Date(),
          })
          .where(eq(pipelines.id, id))
      }
    }

    // Fire and forget
    analyzeAsync()

    return NextResponse.json(
      { message: 'Analisis dimulai', pipelineId: id },
      { status: 202 }
    )
  } catch (error) {
    console.error(`[POST /api/pipeline/${id}/analyze]`, error)
    return NextResponse.json(
      { error: 'Gagal memulai analisis' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pipeline/[id]/analyze
 * Mengambil status pipeline saat ini.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 500 })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { pipelines, clips } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [pipeline] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, id))
      .limit(1)

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline tidak ditemukan' }, { status: 404 })
    }

    const pipelineClips = await db
      .select()
      .from(clips)
      .where(eq(clips.pipelineId, id))

    return NextResponse.json({ pipeline, clips: pipelineClips })
  } catch (error) {
    console.error(`[GET /api/pipeline/${id}/analyze]`, error)
    return NextResponse.json({ error: 'Gagal mengambil data pipeline' }, { status: 500 })
  }
}

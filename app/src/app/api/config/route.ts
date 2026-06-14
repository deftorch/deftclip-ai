import { NextResponse } from 'next/server'
import { analysisConfigSchema, renderConfigSchema } from '@/lib/schema/config.schema'

const defaults = {
  analysisConfig: analysisConfigSchema.parse({}),
  renderConfig: renderConfigSchema.parse({}),
}

/**
 * GET /api/config
 * Mengambil konfigurasi user yang tersimpan.
 * Jika DB belum dikonfigurasi, kembalikan default agar app tetap bisa berjalan.
 */
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(defaults)
    }
    const { db } = await import('@/lib/db/client')
    const { userConfig } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const [config] = await db.select().from(userConfig).where(eq(userConfig.id, 'default')).limit(1)
    if (!config) return NextResponse.json(defaults)
    return NextResponse.json(config.config)
  } catch {
    // DB belum dikonfigurasi — kembalikan default
    return NextResponse.json(defaults)
  }
}

/**
 * PUT /api/config
 * Menyimpan konfigurasi user ke database.
 *
 * Body: { analysisConfig?: PartialAnalysisConfig, renderConfig?: PartialRenderConfig }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Validasi config yang dikirim
    const analysisResult = body.analysisConfig
      ? analysisConfigSchema.safeParse(body.analysisConfig)
      : { success: true, data: analysisConfigSchema.parse({}) }

    const renderResult = body.renderConfig
      ? renderConfigSchema.safeParse(body.renderConfig)
      : { success: true, data: renderConfigSchema.parse({}) }

    if (!analysisResult.success) {
      return NextResponse.json(
        { error: 'Konfigurasi analisis tidak valid', details: (analysisResult as any).error?.flatten() },
        { status: 400 }
      )
    }

    if (!renderResult.success) {
      return NextResponse.json(
        { error: 'Konfigurasi render tidak valid', details: (renderResult as any).error?.flatten() },
        { status: 400 }
      )
    }

    const configData = {
      analysisConfig: analysisResult.data,
      renderConfig: renderResult.data,
    }

    // Upsert config
    await db
      .insert(userConfig)
      .values({ id: 'default', config: configData })
      .onConflictDoUpdate({
        target: userConfig.id,
        set: { config: configData, updatedAt: new Date() },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PUT /api/config]', error)
    return NextResponse.json({ error: 'Gagal menyimpan konfigurasi' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { pipelines } from '@/lib/db/schema'
import { sourceSchema } from '@/lib/schema/source.schema'
import { nanoid } from 'crypto'

/**
 * POST /api/pipeline/create
 * Membuat pipeline baru dan menyimpan ke database.
 *
 * Body: { url: string, type: string, duration_seconds: number, ... }
 * Response: { pipelineId: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validasi source
    const sourceResult = sourceSchema.safeParse(body)
    if (!sourceResult.success) {
      return NextResponse.json(
        { error: 'Source tidak valid', details: sourceResult.error.flatten() },
        { status: 400 }
      )
    }

    const source = sourceResult.data
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    await db.insert(pipelines).values({
      id: pipelineId,
      status: 'pending',
      sourceUrl: source.url,
      sourceType: source.type,
      sourceTitle: source.episode_title,
    })

    return NextResponse.json({ pipelineId }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/pipeline/create]', error)
    return NextResponse.json(
      { error: 'Gagal membuat pipeline' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { db } = await import('@/lib/db/client')
    const { pipelines } = await import('@/lib/db/schema')
    const { desc } = await import('drizzle-orm')

    const data = await db.select().from(pipelines).orderBy(desc(pipelines.createdAt)).limit(limit)

    return NextResponse.json({ pipelines: data })
  } catch (error) {
    console.error('[GET /api/pipelines]', error)
    return NextResponse.json({ error: 'Gagal mengambil data pipeline' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { viewCount, likeCount } = body

    if (typeof viewCount !== 'number' || typeof likeCount !== 'number') {
      return NextResponse.json({ error: 'viewCount dan likeCount wajib berupa angka' }, { status: 400 })
    }

    // Hitung engagement rate = (like / view) * 100
    // Hindari division by zero
    let engagementRate = 0
    if (viewCount > 0) {
      engagementRate = Number(((likeCount / viewCount) * 100).toFixed(2))
    }

    // Kriteria isHighPerformer (bisa disesuaikan):
    // Misalnya jika views > 1000 dan engagement rate > 5%
    const isHighPerformer = viewCount >= 1000 && engagementRate >= 5.0

    const { db } = await import('@/lib/db/client')
    const { clips } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [existing] = await db.select().from(clips).where(eq(clips.id, id)).limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Klip tidak ditemukan' }, { status: 404 })
    }

    await db.update(clips).set({
      viewCount,
      likeCount,
      engagementRate: String(engagementRate),
      isHighPerformer
    }).where(eq(clips.id, id))

    return NextResponse.json({ 
      success: true, 
      data: { viewCount, likeCount, engagementRate, isHighPerformer } 
    })
  } catch (error) {
    console.error('[PATCH /api/clips/analytics]', error)
    return NextResponse.json({ error: 'Gagal mengupdate analytics klip' }, { status: 500 })
  }
}

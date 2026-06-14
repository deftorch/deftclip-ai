import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { db } = await import('@/lib/db/client')
    const { clips } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [existing] = await db.select().from(clips).where(eq(clips.id, id)).limit(1)
    if (!existing) return NextResponse.json({ error: 'Klip tidak ditemukan' }, { status: 404 })

    await db.update(clips).set({ humanApproved: true, humanRejected: false, reviewedAt: new Date() }).where(eq(clips.id, id))
    return NextResponse.json({ success: true, clipId: id })
  } catch (error) {
    console.error('[POST /api/clips/approve]', error)
    return NextResponse.json({ error: 'Gagal mengupdate klip' }, { status: 500 })
  }
}

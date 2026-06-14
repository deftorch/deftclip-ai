import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { title } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Judul tidak boleh kosong' }, { status: 400 })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { clips } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [existing] = await db.select().from(clips).where(eq(clips.id, id)).limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Klip tidak ditemukan' }, { status: 404 })
    }

    await db.update(clips).set({ userEditedTitle: title.trim() }).where(eq(clips.id, id))

    return NextResponse.json({ success: true, clipId: id, title: title.trim() })
  } catch (error) {
    console.error('[PATCH /api/clips/title]', error)
    return NextResponse.json({ error: 'Gagal mengupdate judul klip' }, { status: 500 })
  }
}

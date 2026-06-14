import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { clips } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/clips/[id]/title
 * Memperbarui judul klip (user override atas saran AI).
 *
 * Body: { title: string }
 */
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

  const [existing] = await db
    .select()
    .from(clips)
    .where(eq(clips.id, id))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Klip tidak ditemukan' }, { status: 404 })
  }

  await db
    .update(clips)
    .set({ userEditedTitle: title.trim() })
    .where(eq(clips.id, id))

  return NextResponse.json({ success: true, clipId: id, title: title.trim() })
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { clips } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/clips/[id]/reject
 * Menolak klip — tidak akan dirender.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
    .set({
      humanRejected: true,
      humanApproved: false,
      reviewedAt: new Date(),
    })
    .where(eq(clips.id, id))

  return NextResponse.json({ success: true, clipId: id })
}

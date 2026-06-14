import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { renderStatus, outputFileUrl } = body

    if (!renderStatus) {
      return NextResponse.json({ error: 'renderStatus wajib diisi' }, { status: 400 })
    }

    const { db } = await import('@/lib/db/client')
    const { clips } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [existing] = await db.select().from(clips).where(eq(clips.id, id)).limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Klip tidak ditemukan' }, { status: 404 })
    }

    const updateData: any = { renderStatus }
    if (outputFileUrl) {
      updateData.outputFileUrl = outputFileUrl
    }
    if (renderStatus === 'done') {
      updateData.renderedAt = new Date()
    }

    await db.update(clips).set(updateData).where(eq(clips.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/clips/render-status]', error)
    return NextResponse.json({ error: 'Gagal mengupdate status render' }, { status: 500 })
  }
}

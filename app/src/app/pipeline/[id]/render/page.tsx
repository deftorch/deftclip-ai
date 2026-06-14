'use client'

import { useEffect, useState, use } from 'react'
import { ArrowLeft, Play, Loader2, Download, AlertCircle, Upload, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { renderClip, type RenderPipelineOptions } from '@/lib/render/ffmpeg-browser'

export default function RenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [pipeline, setPipeline] = useState<any>(null)
  const [clips, setClips] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Local file for FFmpeg to bypass CORS
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  
  const [renderStates, setRenderStates] = useState<Record<string, {
    progress: number
    status: 'idle' | 'rendering' | 'done' | 'error'
    blobUrl?: string
    errorMsg?: string
  }>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/pipeline/${id}/analyze`).then(r => r.json()),
      fetch('/api/config').then(r => r.json())
    ]).then(([pData, cData]) => {
      setPipeline(pData.pipeline)
      // Only keep human approved clips
      const approved = (pData.clips || []).filter((c: any) => c.humanApproved)
      setClips(approved)
      setConfig(cData.renderConfig || {})

      const initialStates: any = {}
      approved.forEach((c: any) => {
        initialStates[c.id] = {
          progress: 0,
          status: c.renderStatus === 'done' ? 'done' : 'idle',
          blobUrl: c.outputFileUrl // we treat this as blobUrl for simplicity if set
        }
      })
      setRenderStates(initialStates)
    }).finally(() => setLoading(false))
  }, [id])

  const handleRender = async (clip: any) => {
    if (!sourceFile) {
      alert('Pilih file video asli terlebih dahulu untuk di-render')
      return
    }

    setRenderStates(prev => ({
      ...prev,
      [clip.id]: { progress: 0, status: 'rendering' }
    }))

    // Update DB status
    await fetch(`/api/clips/${clip.id}/render-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renderStatus: 'rendering' })
    })

    try {
      const options: RenderPipelineOptions = {
        startTime: Number(clip.startTime),
        endTime: Number(clip.endTime),
        aspectRatio: config.aspect_ratio || '9:16',
        captionText: config.caption_enabled ? clip.transcriptSnippet : undefined,
        captionOptions: config.caption_enabled ? {
          fontSize: config.caption_font_size || 48,
          fontColor: config.caption_text_color || '#FFFFFF',
          bgColor: config.caption_bg_color || '#000000',
          position: config.caption_position || 'bottom'
        } : undefined,
        colorGradeOptions: {
          contrast: config.contrast || 0,
          brightness: config.brightness || 0,
          saturation: config.saturation || 0,
        }
      }

      const outputBlob = await renderClip(sourceFile, options, (prog) => {
        setRenderStates(prev => ({
          ...prev,
          [clip.id]: { ...prev[clip.id], progress: prog }
        }))
      })

      const blobUrl = URL.createObjectURL(outputBlob)

      setRenderStates(prev => ({
        ...prev,
        [clip.id]: { progress: 100, status: 'done', blobUrl }
      }))

      await fetch(`/api/clips/${clip.id}/render-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderStatus: 'done' }) // in production we might upload blob to Vercel Blob here
      })

    } catch (err: any) {
      console.error(err)
      setRenderStates(prev => ({
        ...prev,
        [clip.id]: { progress: 0, status: 'error', errorMsg: err.message }
      }))
      await fetch(`/api/clips/${clip.id}/render-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderStatus: 'error' })
      })
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 size={24} className="animate-spin text-muted" />
    </div>
  )

  if (!pipeline || clips.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <AlertCircle size={32} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
      <div style={{ marginBottom: '1rem' }}>Tidak ada klip yang disetujui untuk pipeline ini.</div>
      <Link href={`/pipeline/${id}`} className="btn btn-primary">Kembali ke Review</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1rem 0', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/pipeline/${id}`} className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Review Klip</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Render Pipeline</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="mono">{id}</div>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 800 }}>
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent)' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Pilih File Video Sumber</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Karena alasan keamanan browser (CORS), FFmpeg.wasm memerlukan file video sumber di-load secara lokal.
            Silakan pilih file <strong>{pipeline.sourceTitle || pipeline.sourceUrl}</strong> dari komputermu.
          </p>
          <label className="btn btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <Upload size={14} />
            {sourceFile ? sourceFile.name : 'Pilih File .mp4'}
            <input type="file" accept="video/mp4,video/webm" style={{ display: 'none' }} onChange={(e) => setSourceFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Klip Siap Render ({clips.length})</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {clips.map((clip, idx) => {
            const state = renderStates[clip.id] || { progress: 0, status: 'idle' }
            const isRendering = state.status === 'rendering'
            const isDone = state.status === 'done'

            return (
              <div key={clip.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {clip.userEditedTitle || clip.aiSuggestedTitle || `Klip ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="mono mt-1">
                      {clip.startTime}s → {clip.endTime}s ({clip.duration}s)
                    </div>
                  </div>
                  
                  {isRendering && <span className="badge badge-accent animate-pulse">Rendering...</span>}
                  {isDone && <span className="badge badge-success"><CheckCircle size={12} /> Selesai</span>}
                  {state.status === 'error' && <span className="badge badge-danger">Error</span>}
                </div>

                {isRendering && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>FFmpeg Progress</span>
                      <span className="mono">{state.progress.toFixed(1)}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ background: 'var(--accent)', width: `${state.progress}%` }} />
                    </div>
                  </div>
                )}

                {state.errorMsg && (
                  <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                    {state.errorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isDone && state.blobUrl ? (
                    <a href={state.blobUrl} download={`clip_${clip.id}.mp4`} className="btn btn-success btn-sm">
                      <Download size={14} /> Download MP4
                    </a>
                  ) : (
                    <button
                      onClick={() => handleRender(clip)}
                      disabled={isRendering || !sourceFile}
                      className="btn btn-primary btn-sm"
                    >
                      {isRendering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      {state.status === 'error' ? 'Coba Lagi' : 'Render Sekarang'}
                    </button>
                  )}
                </div>

                {/* Preview Video Element */}
                {isDone && state.blobUrl && (
                  <video
                    src={state.blobUrl}
                    controls
                    style={{ width: '100%', maxWidth: 280, marginTop: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

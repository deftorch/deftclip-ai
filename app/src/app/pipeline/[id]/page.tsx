'use client'

import { useEffect, useState, use } from 'react'
import { ArrowLeft, Zap, Clock, CheckCircle, AlertCircle, Loader2, Download, Upload, FileAudio } from 'lucide-react'
import { extractAudio } from '@/lib/render/ffmpeg-browser'
import Link from 'next/link'

interface Clip {
  id: string
  startTime: string
  endTime: string
  duration: string
  hookType: string
  viralityScore: number
  emotionTrigger?: string
  transcriptSnippet?: string
  aiSuggestedTitle?: string
  aiReasoning?: string
  humanApproved: boolean
  humanRejected: boolean
  userEditedTitle?: string
  scoreBreakdown?: {
    hook_strength: number
    emotional_impact: number
    quotability: number
    optimal_duration: number
  }
  renderStatus?: string
  viewCount?: number
  likeCount?: number
  engagementRate?: string
  isHighPerformer?: boolean
}

interface Pipeline {
  id: string
  status: string
  sourceUrl: string
  sourceTitle?: string
  aiModelUsed?: string
  apiKeyLabelUsed?: string
  tokenUsageInput?: number
  tokenUsageOutput?: number
  analysisDurationMs?: number
  errorMessage?: string
  createdAt: string
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Menunggu', color: 'var(--text-muted)', icon: <Clock size={14} /> },
  analyzing: { label: 'Menganalisis AI...', color: 'var(--accent)', icon: <Loader2 size={14} className="animate-spin" /> },
  review: { label: 'Siap Review', color: 'var(--warning)', icon: <Zap size={14} /> },
  rendering: { label: 'Merender...', color: 'var(--info)', icon: <Loader2 size={14} className="animate-spin" /> },
  done: { label: 'Selesai', color: 'var(--success)', icon: <CheckCircle size={14} /> },
  error: { label: 'Error', color: 'var(--danger)', icon: <AlertCircle size={14} /> },
}

const HOOK_EMOJI: Record<string, string> = {
  bold_claim: '💥', contrarian: '🔄', preview_hook: '👀',
  question_hook: '❓', story_arc: '📖', punchline: '🎯',
}
const EMOTION_EMOJI: Record<string, string> = {
  surprise: '😮', curiosity: '🤔', anger: '😤',
  inspiration: '✨', humor: '😂', fear: '😱', joy: '😊',
}

export default function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/pipeline/${id}/analyze`)
      if (res.ok) {
        const data = await res.json()
        setPipeline(data.pipeline)
        setClips(data.clips || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll every 3s while analyzing
    const interval = setInterval(() => {
      if (pipeline?.status === 'analyzing' || pipeline?.status === 'pending') fetchData()
    }, 3000)
    return () => clearInterval(interval)
  }, [id, pipeline?.status])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key.toLowerCase() === 'j') {
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, clips.length - 1)
          document.getElementById(`clip-${clips[next]?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return next
        })
      } else if (e.key.toLowerCase() === 'k') {
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0)
          document.getElementById(`clip-${clips[next]?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return next
        })
      } else if (focusedIndex >= 0 && focusedIndex < clips.length) {
        const clip = clips[focusedIndex]
        if (e.key.toLowerCase() === 'a') {
          handleApprove(clip.id)
        } else if (e.key.toLowerCase() === 'r') {
          handleReject(clip.id)
        } else if (e.key.toLowerCase() === 'e') {
          handleEditTitle(clip.id, clip.userEditedTitle || clip.aiSuggestedTitle || '')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clips, focusedIndex])

  const handleApprove = async (clipId: string) => {
    await fetch(`/api/clips/${clipId}/approve`, { method: 'POST' })
    fetchData()
  }

  const handleReject = async (clipId: string) => {
    await fetch(`/api/clips/${clipId}/reject`, { method: 'POST' })
    fetchData()
  }

  const handleEditTitle = async (clipId: string, currentTitle: string) => {
    const newTitle = window.prompt('Edit judul klip:', currentTitle)
    if (newTitle && newTitle.trim()) {
      await fetch(`/api/clips/${clipId}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      fetchData()
    }
  }

  const downloadStrategy = () => {
    if (!pipeline) return
    const approvedClips = clips.filter((c) => c.humanApproved)
    const strategy = { pipeline_id: id, clips: approvedClips }
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `strategy_${id}.json`
    a.click()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      <Loader2 size={24} className="animate-spin" />
    </div>
  )

  if (!pipeline) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <AlertCircle size={32} color="var(--danger)" />
      <div style={{ color: 'var(--text-secondary)' }}>Pipeline tidak ditemukan</div>
      <Link href="/" className="btn btn-ghost btn-sm">← Kembali</Link>
    </div>
  )

  const sc = STATUS_MAP[pipeline.status] ?? STATUS_MAP.pending
  const approvedCount = clips.filter((c) => c.humanApproved).length
  const rejectedCount = clips.filter((c) => c.humanRejected).length
  const pendingCount = clips.filter((c) => !c.humanApproved && !c.humanRejected).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1rem 0', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Dashboard</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pipeline.sourceTitle || pipeline.sourceUrl}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="mono">{id}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: sc.color, fontSize: '0.875rem', fontWeight: 500 }}>
            {sc.icon}{sc.label}
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Pipeline Status Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="section-label" style={{ marginBottom: '1rem' }}>📊 Status Pipeline</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Model AI', value: pipeline.aiModelUsed || '—' },
              { label: 'API Key', value: pipeline.apiKeyLabelUsed || '—' },
              { label: 'Token Input', value: pipeline.tokenUsageInput?.toLocaleString() || '—' },
              { label: 'Token Output', value: pipeline.tokenUsageOutput?.toLocaleString() || '—' },
              { label: 'Durasi Analisis', value: pipeline.analysisDurationMs ? `${(pipeline.analysisDurationMs / 1000).toFixed(1)}s` : '—' },
              { label: 'Estimasi Biaya', value: pipeline.tokenUsageInput ? `~$${((pipeline.tokenUsageInput * 0.00000015) + ((pipeline.tokenUsageOutput || 0) * 0.0000006)).toFixed(4)}` : '—' },
            ].map((item) => (
              <div key={item.label} style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div className="section-label" style={{ marginBottom: '0.25rem' }}>{item.label}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="mono">{item.value}</div>
              </div>
            ))}
          </div>

          {pipeline.errorMessage && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem' }}>
              ⚠️ {pipeline.errorMessage}
            </div>
          )}
        </div>

        {/* Analyzing state */}
        {pipeline.status === 'analyzing' && (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
            <Loader2 size={40} color="var(--accent)" className="animate-spin" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>AI sedang menganalisis video...</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Halaman akan otomatis update saat selesai</div>
          </div>
        )}

        {/* Clips Review */}
        {clips.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>📋 Review Klip ({clips.length})</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <span style={{ color: 'var(--success)' }}>✅ {approvedCount} approved</span>
                  {' · '}
                  <span style={{ color: 'var(--danger)' }}>❌ {rejectedCount} rejected</span>
                  {' · '}
                  <span style={{ color: 'var(--warning)' }}>⏳ {pendingCount} pending</span>
                </div>
              </div>
              {approvedCount > 0 && (
                <button id="download-strategy" onClick={downloadStrategy} className="btn btn-primary btn-sm">
                  <Download size={14} /> Download strategy.json ({approvedCount} klip)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {clips.map((clip, i) => (
                <div id={`clip-${clip.id}`} key={clip.id}>
                  <ClipCard
                    clip={clip}
                    index={i + 1}
                    isFocused={i === focusedIndex}
                    onApprove={() => handleApprove(clip.id)}
                    onReject={() => handleReject(clip.id)}
                    onEdit={() => handleEditTitle(clip.id, clip.userEditedTitle || clip.aiSuggestedTitle || '')}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {pipeline.status === 'pending' && clips.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Pipeline menunggu transkrip video untuk dianalisis
            </div>
            <StartAnalysisButton pipelineId={id} onStarted={fetchData} />
          </div>
        )}
      </main>
    </div>
  )
}

function StartAnalysisButton({ pipelineId, onStarted }: { pipelineId: string; onStarted: () => void }) {
  const [transcript, setTranscript] = useState('')
  const [audioBase64, setAudioBase64] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [show, setShow] = useState(false)

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setExtracting(true)
      const audioBlob = await extractAudio(file, setProgress)
      
      // Convert Blob to Base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = () => {
        const base64data = reader.result as string
        // Format of readAsDataURL: data:audio/mp3;base64,.... We only need the base64 part for AI SDK
        const base64Content = base64data.split(',')[1]
        setAudioBase64(base64Content)
        setExtracting(false)
      }
    } catch (err) {
      console.error(err)
      setExtracting(false)
      alert("Gagal mengekstrak audio dari video lokal")
    }
  }

  const handleStart = async () => {
    if (!transcript.trim() && !audioBase64) return
    setLoading(true)
    await fetch(`/api/pipeline/${pipelineId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, audioBase64 }),
    })
    setLoading(false)
    onStarted()
  }

  if (!show) return (
    <button id="start-analysis" onClick={() => setShow(true)} className="btn btn-primary">
      <Zap size={14} /> Input Transkrip / Video & Mulai Analisis
    </button>
  )

  return (
    <div style={{ textAlign: 'left', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={14} /> Ekstrak Audio untuk AI Multimodal (Opsional)
        </label>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Upload video lokal untuk mengekstrak audionya agar Gemini bisa "mendengar" intonasi emosi.
        </p>
        <input type="file" accept="video/*,audio/*" onChange={handleVideoSelect} disabled={extracting || loading} className="input" style={{ padding: '0.5rem' }} />
        
        {extracting && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent)' }}>
            ⚙️ Mengekstrak audio... {progress.toFixed(0)}%
          </div>
        )}
        
        {audioBase64 && !extracting && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileAudio size={14} /> Audio berhasil disiapkan untuk Gemini!
          </div>
        )}
      </div>

      <label className="label">Paste Transkrip Video (Wajib untuk Akurasi Waktu)</label>
      <textarea
        id="transcript-input"
        className="input"
        rows={8}
        placeholder="[00:00] Halo semuanya, hari ini kita akan membahas..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
      />
      <button
        onClick={handleStart}
        disabled={loading || extracting || (!transcript.trim() && !audioBase64)}
        className="btn btn-primary"
        style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
      >
        {loading ? <><Loader2 size={14} className="animate-spin" />Menganalisis...</> : <><Zap size={14} />{audioBase64 ? 'Mulai AI Agent (Multimodal)' : 'Mulai Analisis AI'}</>}
      </button>
    </div>
  )
}

function ClipCard({ clip, index, isFocused, onApprove, onReject, onEdit }: {
  clip: Clip; index: number; isFocused: boolean
  onApprove: () => void; onReject: () => void; onEdit: () => void
}) {
  const score = clip.viralityScore
  const scoreColor = score >= 85 ? 'var(--success)' : score >= 70 ? 'var(--warning)' : 'var(--danger)'
  const displayTitle = clip.userEditedTitle || clip.aiSuggestedTitle
  const status = clip.humanApproved ? 'approved' : clip.humanRejected ? 'rejected' : 'pending'

  return (
    <div
      className="card animate-fade-in"
      style={{
        borderColor: status === 'approved' ? 'var(--success)' : status === 'rejected' ? 'var(--danger)' : isFocused ? 'var(--accent)' : 'var(--border-subtle)',
        boxShadow: isFocused ? '0 0 0 2px var(--accent)' : 'none',
        opacity: status === 'rejected' ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* Clip header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }} className="mono">
            CLIP {String(index).padStart(3, '0')}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }} className="mono">
            {formatTime(Number(clip.startTime))} → {formatTime(Number(clip.endTime))} · {clip.duration}s
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor }}>{score}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100</span></div>
      </div>

      {/* Transcript snippet */}
      {clip.transcriptSnippet && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1rem', borderLeft: `3px solid ${scoreColor}` }}>
          <div style={{ fontSize: '0.9375rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            "{clip.transcriptSnippet}"
          </div>
        </div>
      )}

      {/* AI Transparency Panel */}
      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
        <div className="section-label" style={{ marginBottom: '0.75rem' }}>🤖 MENGAPA AI MEMILIH MOMEN INI?</div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span className="badge badge-accent">{HOOK_EMOJI[clip.hookType] || '🎯'} {clip.hookType}</span>
          {clip.emotionTrigger && <span className="badge badge-info">{EMOTION_EMOJI[clip.emotionTrigger] || '💡'} {clip.emotionTrigger}</span>}
        </div>

        {/* Score breakdown bars */}
        {clip.scoreBreakdown && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {Object.entries({
              'Kekuatan Hook': clip.scoreBreakdown.hook_strength,
              'Emotional Impact': clip.scoreBreakdown.emotional_impact,
              'Quotability': clip.scoreBreakdown.quotability,
              'Durasi Optimal': clip.scoreBreakdown.optimal_duration,
            }).map(([label, val]) => (
              <div key={label} className="score-bar">
                <div style={{ width: 110, fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${(val / 10) * 100}%` }} />
                </div>
                <div style={{ width: 30, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }} className="mono">{val}/10</div>
              </div>
            ))}
          </div>
        )}

        {clip.aiReasoning && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            💬 {clip.aiReasoning}
          </div>
        )}
      </div>

      {/* Suggested title */}
      {displayTitle && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="section-label" style={{ marginBottom: '0.375rem' }}>Judul Saran AI</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
            {displayTitle}
            {clip.userEditedTitle && <span className="badge badge-muted" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>edited</span>}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {status === 'pending' && (
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button id={`approve-${clip.id}`} onClick={onApprove} className="btn btn-success btn-sm" data-tooltip="Keyboard: A">
            ✅ Approve
          </button>
          <button id={`edit-${clip.id}`} onClick={onEdit} className="btn btn-ghost btn-sm" data-tooltip="Keyboard: E">
            ✏️ Edit Judul
          </button>
          <button id={`reject-${clip.id}`} onClick={onReject} className="btn btn-danger btn-sm" data-tooltip="Keyboard: R">
            ❌ Reject
          </button>
        </div>
      )}

      {status === 'approved' && (
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <span className="badge badge-success">✅ Approved</span>
          <button onClick={onReject} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>Batalkan</button>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <span className="badge badge-danger">❌ Rejected</span>
          <button onClick={onApprove} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>Batalkan</button>
        </div>
      )}

      {/* Analytics Input (Fase 3) - Show only if rendered */}
      {clip.renderStatus === 'done' && (
        <ClipAnalytics clip={clip} />
      )}
    </div>
  )
}

function ClipAnalytics({ clip }: { clip: Clip }) {
  const [views, setViews] = useState(clip.viewCount?.toString() || '0')
  const [likes, setLikes] = useState(clip.likeCount?.toString() || '0')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    engagementRate: clip.engagementRate || '0',
    isHighPerformer: clip.isHighPerformer || false
  })

  const handleUpdateAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clips/${clip.id}/analytics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          viewCount: parseInt(views) || 0, 
          likeCount: parseInt(likes) || 0 
        })
      })
      const data = await res.json()
      if (data.success) {
        setStats({
          engagementRate: data.data.engagementRate,
          isHighPerformer: data.data.isHighPerformer
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>📈 Performa Klip</div>
        {stats.isHighPerformer && <span className="badge badge-success animate-pulse">🌟 High Performer</span>}
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label className="label" style={{ fontSize: '0.75rem' }}>Views</label>
          <input 
            type="number" 
            className="input" 
            value={views}
            onChange={e => setViews(e.target.value)}
            style={{ width: 100, height: 32, fontSize: '0.8125rem' }}
          />
        </div>
        <div>
          <label className="label" style={{ fontSize: '0.75rem' }}>Likes</label>
          <input 
            type="number" 
            className="input" 
            value={likes}
            onChange={e => setLikes(e.target.value)}
            style={{ width: 100, height: 32, fontSize: '0.8125rem' }}
          />
        </div>
        <div>
          <label className="label" style={{ fontSize: '0.75rem' }}>ER (%)</label>
          <div className="mono" style={{ padding: '0 0.5rem', height: 32, display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
            {stats.engagementRate}%
          </div>
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={handleUpdateAnalytics}
          disabled={loading}
          style={{ height: 32 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Update Stats'}
        </button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

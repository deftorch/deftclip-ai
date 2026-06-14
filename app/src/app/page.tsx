'use client'

import { useState, useEffect } from 'react'
import { Scissors, Zap, Settings, ChevronRight, Play, Clock, CheckCircle, AlertCircle, Loader2, Search, Filter } from 'lucide-react'

interface Pipeline {
  id: string
  status: string
  sourceUrl: string
  sourceTitle?: string
  createdAt: string
  clipCount?: number
}

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [sourceType, setSourceType] = useState('podcast')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  useEffect(() => {
    fetch('/api/pipelines')
      .then(r => r.json())
      .then(data => {
        if (data.pipelines) {
          setPipelines(data.pipelines)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingHistory(false))
  }, [])

  const filteredPipelines = pipelines.filter(p => {
    const matchSearch = (p.sourceTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/pipeline/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          type: sourceType,
          duration_seconds: parseInt(duration) || 3600,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal membuat pipeline')
        return
      }

      // Add to local list
      setPipelines((prev) => [
        {
          id: data.pipelineId,
          status: 'pending',
          sourceUrl: url,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])

      setUrl('')
      setDuration('')
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1rem 0',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px var(--accent-glow)',
              }}
            >
              <Scissors size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                AI Auto Clip
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                VIRAL CONTENT ENGINE
              </div>
            </div>
          </div>

          <a href="/settings" className="btn btn-ghost btn-sm">
            <Settings size={14} />
            Settings
          </a>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        {/* Hero Section */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            animation: 'fade-in 0.5s ease both',
          }}
        >
          <div
            className="badge badge-accent"
            style={{ marginBottom: '1rem', fontSize: '0.7rem' }}
          >
            <Zap size={10} />
            Powered by Gemini AI
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: '1rem',
            }}
          >
            Ubah Video Panjang Jadi
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--success))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Konten Viral Otomatis
            </span>
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            AI menganalisis video, memilih momen terbaik, dan kamu review sebelum render.
            Transparansi penuh — setiap keputusan bisa kamu lihat dan override.
          </p>
        </div>

        {/* Input Form */}
        <div
          className="glass-panel"
          style={{
            maxWidth: 700,
            margin: '0 auto 3rem',
            padding: '2rem',
            animation: 'fade-in 0.5s ease 0.1s both',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
            🎬 Analisis Video Baru
          </h2>

          <form id="pipeline-form" onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label" htmlFor="video-url">
                URL Video (YouTube, Google Drive, dll.)
              </label>
              <input
                id="video-url"
                className="input"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="label" htmlFor="source-type">
                  Jenis Konten
                </label>
                <select
                  id="source-type"
                  className="input"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="podcast">🎙️ Podcast</option>
                  <option value="stream">🔴 Live Stream</option>
                  <option value="interview">🎤 Interview</option>
                  <option value="seminar">📚 Seminar</option>
                  <option value="sports">⚽ Sports</option>
                  <option value="comedy">😂 Comedy</option>
                  <option value="faceless">🎭 Faceless</option>
                  <option value="news">📰 News</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="duration">
                  Durasi Video (detik)
                </label>
                <input
                  id="duration"
                  className="input"
                  type="number"
                  placeholder="3600 (1 jam)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={60}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  color: 'var(--danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              id="submit-pipeline"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memulai Analisis...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Analisis dengan AI
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="divider" />

          {/* Feature hints */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: '🔍', text: 'AI pilih momen terbaik' },
              { icon: '📊', text: 'Virality score + reasoning' },
              { icon: '✅', text: 'Kamu review & approve' },
              { icon: '🎬', text: 'Render .mp4 otomatis' },
            ].map((f) => (
              <div
                key={f.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline List */}
        {pipelines.length > 0 && (
          <div style={{ maxWidth: 700, margin: '0 auto', animation: 'fade-in 0.4s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="section-label" style={{ marginBottom: 0 }}>
                Riwayat Pipeline ({filteredPipelines.length})
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Cari judul/URL..." 
                    style={{ paddingLeft: '2rem', height: '32px', fontSize: '0.8125rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="input" 
                  style={{ height: '32px', fontSize: '0.8125rem', padding: '0 2rem 0 0.5rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="done">Selesai</option>
                  <option value="review">Review</option>
                  <option value="rendering">Rendering</option>
                  <option value="pending">Pending</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isLoadingHistory ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin text-muted mx-auto" /></div>
              ) : filteredPipelines.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data cocok.</div>
              ) : (
                filteredPipelines.map((pipeline) => (
                  <PipelineRow key={pipeline.id} pipeline={pipeline} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {pipelines.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-muted)',
              animation: 'fade-in 0.5s ease 0.2s both',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎬</div>
            <div style={{ fontSize: '0.875rem' }}>
              Belum ada pipeline. Submit URL video untuk mulai!
            </div>
          </div>
        )}
      </main>

      {/* Stats Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 0',
          background: 'var(--bg-surface)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[
              { label: 'Total Pipeline', value: pipelines.length },
              { label: 'Berhasil', value: pipelines.filter((p) => p.status === 'done').length },
              { label: 'Dalam Review', value: pipelines.filter((p) => p.status === 'review').length },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            AI Auto Clip v0.1.0-alpha · TDD · $0 runtime
          </div>
        </div>
      </footer>
    </div>
  )
}

function PipelineRow({ pipeline }: { pipeline: Pipeline }) {
  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    pending: { icon: <Clock size={12} />, label: 'Menunggu', color: 'var(--text-muted)' },
    analyzing: { icon: <Loader2 size={12} className="animate-spin" />, label: 'Menganalisis...', color: 'var(--accent)' },
    review: { icon: <Play size={12} />, label: 'Siap Review', color: 'var(--warning)' },
    rendering: { icon: <Loader2 size={12} className="animate-spin" />, label: 'Merender...', color: 'var(--info)' },
    done: { icon: <CheckCircle size={12} />, label: 'Selesai', color: 'var(--success)' },
    error: { icon: <AlertCircle size={12} />, label: 'Error', color: 'var(--danger)' },
  }

  const sc = statusConfig[pipeline.status] ?? statusConfig.pending

  return (
    <a
      href={`/pipeline/${pipeline.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pipeline.sourceTitle || pipeline.sourceUrl}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.25rem',
            }}
            className="mono"
          >
            {pipeline.id}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: sc.color,
            fontSize: '0.8125rem',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {sc.icon}
          {sc.label}
        </div>

        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </a>
  )
}

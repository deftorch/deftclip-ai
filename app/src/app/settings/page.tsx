'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface AnalysisConfig {
  model: string
  min_clips: number; max_clips: number
  min_duration_seconds: number; max_duration_seconds: number
  virality_threshold: number
  niche: string
  source_language: string
  thinking_depth: string
  require_human_approval: boolean
}

interface RenderConfig {
  resolution: string; aspect_ratio: string
  caption_enabled: boolean; caption_font_size: number
  caption_position: string; caption_style: string
  caption_bg_color: string; caption_text_color: string
  contrast: number; brightness: number; saturation: number
}

interface KeyManagerConfig {
  api_keys: { key: string; label: string; enabled: boolean }[]
  rotation_strategy: string
  cooldown_seconds: number
  max_retries: number
}

const DEFAULT_ANALYSIS: AnalysisConfig = {
  model: 'gemini-2.5-flash', min_clips: 3, max_clips: 7,
  min_duration_seconds: 15, max_duration_seconds: 60,
  virality_threshold: 70, niche: 'motivation',
  source_language: 'id', thinking_depth: 'low', require_human_approval: true,
}
const DEFAULT_RENDER: RenderConfig = {
  resolution: '1080x1920', aspect_ratio: '9:16',
  caption_enabled: true, caption_font_size: 48,
  caption_position: 'bottom', caption_style: 'full_line',
  caption_bg_color: '#000000', caption_text_color: '#FFFFFF',
  contrast: 10, brightness: 0, saturation: 12,
}
const DEFAULT_KEY_MANAGER: KeyManagerConfig = {
  api_keys: [],
  rotation_strategy: 'round_robin',
  cooldown_seconds: 60,
  max_retries: 3,
}

export default function SettingsPage() {
  const [analysis, setAnalysis] = useState<AnalysisConfig>(DEFAULT_ANALYSIS)
  const [render, setRender] = useState<RenderConfig>(DEFAULT_RENDER)
  const [keyManager, setKeyManager] = useState<KeyManagerConfig>(DEFAULT_KEY_MANAGER)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then((data) => {
      if (data.analysisConfig) setAnalysis({ ...DEFAULT_ANALYSIS, ...data.analysisConfig })
      if (data.renderConfig) setRender({ ...DEFAULT_RENDER, ...data.renderConfig })
      if (data.keyManagerConfig) setKeyManager({ ...DEFAULT_KEY_MANAGER, ...data.keyManagerConfig })
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisConfig: analysis, renderConfig: render, keyManagerConfig: keyManager }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setA = (key: keyof AnalysisConfig, val: unknown) => setAnalysis((p) => ({ ...p, [key]: val }))
  const setR = (key: keyof RenderConfig, val: unknown) => setRender((p) => ({ ...p, [key]: val }))
  const setK = (key: keyof KeyManagerConfig, val: unknown) => setKeyManager((p) => ({ ...p, [key]: val }))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      <Loader2 size={24} className="animate-spin" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1rem 0', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Dashboard</Link>
            <span style={{ fontWeight: 600 }}>⚙️ Settings</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              className="input" 
              style={{ height: '32px', fontSize: '0.8125rem' }}
              onChange={(e) => {
                if (e.target.value === 'motivation') {
                  setAnalysis({ ...DEFAULT_ANALYSIS, niche: 'motivation', min_clips: 5, virality_threshold: 80 })
                  setRender({ ...DEFAULT_RENDER, caption_style: 'word_by_word', contrast: 15, caption_text_color: '#FFFF00' })
                } else if (e.target.value === 'finance') {
                  setAnalysis({ ...DEFAULT_ANALYSIS, niche: 'finance', thinking_depth: 'high', min_duration_seconds: 30 })
                  setRender({ ...DEFAULT_RENDER, caption_bg_color: '#003300', caption_text_color: '#FFFFFF' })
                } else if (e.target.value === 'gaming') {
                  setAnalysis({ ...DEFAULT_ANALYSIS, niche: 'gaming', max_duration_seconds: 45, virality_threshold: 65 })
                  setRender({ ...DEFAULT_RENDER, aspect_ratio: '16:9', caption_position: 'top' })
                }
                e.target.value = '' // reset select
              }}
            >
              <option value="">Load Preset Niche...</option>
              <option value="motivation">Motivation (Intense)</option>
              <option value="finance">Finance (Deep)</option>
              <option value="gaming">Gaming (Landscape)</option>
            </select>
            <button onClick={() => { setAnalysis(DEFAULT_ANALYSIS); setRender(DEFAULT_RENDER) }} className="btn btn-ghost btn-sm">
              <RotateCcw size={13} /> Reset Default
            </button>
            <button id="save-settings" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saved ? '✓ Tersimpan!' : 'Simpan'}
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 800 }}>
        {/* Analysis Config */}
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>🤖 AI Analysis Config</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Model AI">
              <select id="settings-model" className="input" value={analysis.model} onChange={(e) => setA('model', e.target.value)}>
                <option value="gemini-2.5-flash">gemini-2.5-flash (cepat)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (akurat)</option>
              </select>
            </Field>
            <Field label="Niche Konten">
              <select id="settings-niche" className="input" value={analysis.niche} onChange={(e) => setA('niche', e.target.value)}>
                {['motivation','finance','gaming','comedy','education','politics','sports','lifestyle','tech'].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label={`Min Klip: ${analysis.min_clips}`}>
              <input id="settings-min-clips" type="range" min={1} max={5} value={analysis.min_clips} onChange={(e) => setA('min_clips', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label={`Max Klip: ${analysis.max_clips}`}>
              <input id="settings-max-clips" type="range" min={5} max={20} value={analysis.max_clips} onChange={(e) => setA('max_clips', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label={`Durasi Min: ${analysis.min_duration_seconds}s`}>
              <input type="range" min={7} max={30} value={analysis.min_duration_seconds} onChange={(e) => setA('min_duration_seconds', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label={`Durasi Max: ${analysis.max_duration_seconds}s`}>
              <input type="range" min={30} max={90} value={analysis.max_duration_seconds} onChange={(e) => setA('max_duration_seconds', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label={`Virality Threshold: ${analysis.virality_threshold}`}>
              <input id="settings-virality" type="range" min={50} max={95} value={analysis.virality_threshold} onChange={(e) => setA('virality_threshold', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label="Thinking Depth">
              <select id="settings-thinking" className="input" value={analysis.thinking_depth} onChange={(e) => setA('thinking_depth', e.target.value)}>
                <option value="minimal">minimal (tercepat)</option>
                <option value="low">low (cepat, default)</option>
                <option value="medium">medium (seimbang)</option>
                <option value="high">high (terbaik, lambat)</option>
              </select>
            </Field>
            <Field label="Bahasa Sumber">
              <input className="input" value={analysis.source_language} onChange={(e) => setA('source_language', e.target.value)} placeholder="id" />
            </Field>
            <Field label="Human Approval Wajib">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input id="settings-approval" type="checkbox" checked={analysis.require_human_approval} onChange={(e) => setA('require_human_approval', e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {analysis.require_human_approval ? 'Ya — review wajib sebelum render' : 'Tidak — render otomatis'}
                </span>
              </label>
            </Field>
          </div>
        </section>

        {/* Render Config */}
        <section className="card">
          <div style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>🎬 Render Config</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Resolusi">
              <select className="input" value={render.resolution} onChange={(e) => setR('resolution', e.target.value)}>
                <option value="1080x1920">1080×1920 (Full HD)</option>
                <option value="720x1280">720×1280 (HD)</option>
              </select>
            </Field>
            <Field label="Aspect Ratio">
              <select className="input" value={render.aspect_ratio} onChange={(e) => setR('aspect_ratio', e.target.value)}>
                <option value="9:16">9:16 (Vertikal)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Horizontal)</option>
              </select>
            </Field>
            <Field label="Caption Aktif">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={render.caption_enabled} onChange={(e) => setR('caption_enabled', e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{render.caption_enabled ? 'Caption aktif' : 'Caption nonaktif'}</span>
              </label>
            </Field>
            <Field label={`Font Size Caption: ${render.caption_font_size}px`}>
              <input type="range" min={32} max={72} value={render.caption_font_size} onChange={(e) => setR('caption_font_size', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label="Posisi Caption">
              <select className="input" value={render.caption_position} onChange={(e) => setR('caption_position', e.target.value)}>
                <option value="top">Atas</option>
                <option value="middle">Tengah</option>
                <option value="bottom">Bawah (default)</option>
              </select>
            </Field>
            <Field label="Style Caption">
              <select className="input" value={render.caption_style} onChange={(e) => setR('caption_style', e.target.value)}>
                <option value="full_line">Full Line</option>
                <option value="word_by_word">Word by Word</option>
              </select>
            </Field>
            <Field label={`Contrast: ${render.contrast}`}>
              <input type="range" min={-50} max={50} value={render.contrast} onChange={(e) => setR('contrast', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label={`Brightness: ${render.brightness}`}>
              <input type="range" min={-50} max={50} value={render.brightness} onChange={(e) => setR('brightness', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <Field label={`Saturation: ${render.saturation}`}>
              <input type="range" min={-50} max={50} value={render.saturation} onChange={(e) => setR('saturation', +e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </Field>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
              <Field label="Warna Background Caption">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={render.caption_bg_color} onChange={(e) => setR('caption_bg_color', e.target.value)} style={{ width: 40, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
                  <input className="input" value={render.caption_bg_color} onChange={(e) => setR('caption_bg_color', e.target.value)} style={{ fontFamily: 'monospace' }} />
                </div>
              </Field>
              <Field label="Warna Teks Caption">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={render.caption_text_color} onChange={(e) => setR('caption_text_color', e.target.value)} style={{ width: 40, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
                  <input className="input" value={render.caption_text_color} onChange={(e) => setR('caption_text_color', e.target.value)} style={{ fontFamily: 'monospace' }} />
                </div>
              </Field>
            </div>
          </div>
        </section>

        {/* Key Manager Config */}
        <section className="card">
          <div style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔑 API Key Manager</span>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setKeyManager(p => ({ ...p, api_keys: [...p.api_keys, { key: '', label: `Key ${p.api_keys.length + 1}`, enabled: true }] }))}
            >
              + Tambah Key
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <Field label="Strategi Rotasi">
              <select className="input" value={keyManager.rotation_strategy} onChange={(e) => setK('rotation_strategy', e.target.value)}>
                <option value="round_robin">Round Robin (Bergiliran)</option>
                <option value="least_used">Least Used (Paling jarang dipakai)</option>
                <option value="random">Random (Acak)</option>
              </select>
            </Field>
            <Field label="Max Retries (Jika limit)">
              <input type="number" className="input" value={keyManager.max_retries} onChange={(e) => setK('max_retries', +e.target.value)} min={1} max={20} />
            </Field>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {keyManager.api_keys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Belum ada API key tersimpan. Menggunakan key dari file env lokal.</div>
            ) : (
              keyManager.api_keys.map((ak, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <input type="checkbox" checked={ak.enabled} onChange={(e) => {
                    const newKeys = [...keyManager.api_keys]
                    newKeys[i].enabled = e.target.checked
                    setK('api_keys', newKeys)
                  }} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                  
                  <input className="input" placeholder="Label (mis. Akun 1)" value={ak.label} onChange={(e) => {
                    const newKeys = [...keyManager.api_keys]
                    newKeys[i].label = e.target.value
                    setK('api_keys', newKeys)
                  }} style={{ width: 120, height: 32 }} />

                  <input className="input" type="password" placeholder="AIzaSy..." value={ak.key} onChange={(e) => {
                    const newKeys = [...keyManager.api_keys]
                    newKeys[i].key = e.target.value
                    setK('api_keys', newKeys)
                  }} style={{ flex: 1, height: 32, fontFamily: 'monospace' }} />

                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    const newKeys = [...keyManager.api_keys]
                    newKeys.splice(i, 1)
                    setK('api_keys', newKeys)
                  }} style={{ color: 'var(--danger)' }}>Hapus</button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

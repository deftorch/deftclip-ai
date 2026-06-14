import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

/**
 * Singleton instance FFmpeg
 */
let ffmpeg: FFmpeg | null = null

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()

  // Untuk browser, kita ambil core FFmpeg dari unpkg agar mudah.
  // Pastikan header COOP dan COEP sudah dikonfigurasi di Next.js
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  return ffmpeg
}

export interface RenderPipelineOptions {
  startTime: number
  endTime: number
  aspectRatio: string
  captionText?: string
  captionOptions?: {
    fontSize: number
    fontColor: string
    bgColor: string
    position: 'top' | 'middle' | 'bottom'
  }
  colorGradeOptions?: {
    contrast: number
    brightness: number
    saturation: number
  }
}

/**
 * Render Pipeline 1-Pass
 *
 * Menggabungkan trim, reframe, color grading, dan caption burn-in
 * dalam SATU perintah FFmpeg agar sangat cepat.
 */
export async function renderClip(
  sourceBlobOrUrl: string | File | Blob,
  options: RenderPipelineOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const fg = await getFFmpeg()

  // Bind event progress
  const progressHandler = ({ progress }: { progress: number }) => {
    if (onProgress) onProgress(progress * 100)
  }
  fg.on('progress', progressHandler)

  const inputName = 'input.mp4'
  const outputName = 'output.mp4'

  // Load file ke virtual file system FFmpeg
  const fileData = await fetchFile(sourceBlobOrUrl)
  await fg.writeFile(inputName, fileData)

  // 1. Durasi
  const duration = Math.round((options.endTime - options.startTime) * 1000) / 1000

  // 2. Filter Graph (-vf)
  const filters: string[] = []

  // Reframe
  if (options.aspectRatio === '9:16') {
    filters.push('crop=ih*9/16:ih')
  } else if (options.aspectRatio === '1:1') {
    filters.push('crop=ih:ih')
  }

  // Color Grade
  if (options.colorGradeOptions) {
    const cg = options.colorGradeOptions
    const c = Math.round((1 + cg.contrast / 100) * 100) / 100
    const b = Math.round((cg.brightness / 100) * 100) / 100
    const s = Math.round((1 + cg.saturation / 100) * 100) / 100
    if (c !== 1 || b !== 0 || s !== 1) {
      filters.push(`eq=contrast=${c}:brightness=${b}:saturation=${s}`)
    }
  }

  // Caption
  if (options.captionText && options.captionOptions) {
    const cOpt = options.captionOptions
    const fColor = cOpt.fontColor.replace('#', '0x')
    const bColor = cOpt.bgColor.replace('#', '0x')
    let yPos = 'h-h/4'
    if (cOpt.position === 'top') yPos = 'h/4'
    else if (cOpt.position === 'middle') yPos = '(h-text_h)/2'

    // Gunakan sans-serif font default (tergantung env, bisa fail kalau font tidak disuplai)
    // Untuk safety, FFmpeg.wasm biasanya mem-bundle file font arial.ttf atau membolehkan default.
    // Jika drawtext error fontfile, di production kita harus load font .ttf ke VFS dan pakai fontfile=font.ttf
    // Untuk MVP kita set fontfile kosong jika bisa, tapi biasanya butuh.
    const text = options.captionText.replace(/'/g, "\\'")
    filters.push(`drawtext=text='${text}':x=(w-text_w)/2:y=${yPos}:fontsize=${cOpt.fontSize}:fontcolor=${fColor}:box=1:boxcolor=${bColor}@0.5:boxborderw=10`)
  }

  const vfArg = filters.length > 0 ? filters.join(',') : ''

  // Build commands
  const args = [
    '-ss', String(options.startTime),
    '-i', inputName,
    '-t', String(duration),
  ]

  if (vfArg) {
    args.push('-vf', vfArg)
  }

  // Gunakan preset superfast, libx264
  args.push('-c:v', 'libx264', '-preset', 'superfast', '-c:a', 'copy', outputName)

  // Execute!
  await fg.exec(args)

  // Unbind progress listener agar tidak menumpuk
  fg.off('progress', progressHandler)

  // Baca hasil
  const outputData = await fg.readFile(outputName)
  const outputBlob = new Blob([outputData as any], { type: 'video/mp4' })

  // Clean up VFS
  await fg.deleteFile(inputName)
  await fg.deleteFile(outputName)

  return outputBlob
}

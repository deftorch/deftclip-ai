import { describe, it, expect } from 'vitest'
import {
  buildTrimCommand,
  buildCaptionCommand,
  buildReframeCommand,
  buildColorGradeCommand,
} from '@/lib/render/ffmpeg-commands'

describe('FFmpeg Command Builder', () => {
  describe('buildTrimCommand', () => {
    it('harus menghasilkan argumen trim yang benar', () => {
      const args = buildTrimCommand('input.mp4', 15, 30, 'output.mp4')
      expect(args).toEqual([
        '-ss', '15',
        '-i', 'input.mp4',
        '-t', '15',
        '-c', 'copy',
        'output.mp4'
      ])
    })

    it('harus handle desimal pada start time', () => {
      const args = buildTrimCommand('input.mp4', 12.5, 20.2, 'output.mp4')
      expect(args).toEqual([
        '-ss', '12.5',
        '-i', 'input.mp4',
        '-t', '7.7',
        '-c', 'copy',
        'output.mp4'
      ])
    })
  })

  describe('buildReframeCommand', () => {
    it('harus menghasilkan filter crop untuk 9:16', () => {
      const args = buildReframeCommand('input.mp4', '9:16', 'output.mp4')
      expect(args).toContain('-vf')
      // Crop 9:16 dari landscape 16:9 = tinggi full, lebar dipotong (tinggi * 9/16)
      expect(args).toContain('crop=ih*9/16:ih')
    })

    it('harus menghasilkan filter crop untuk 1:1', () => {
      const args = buildReframeCommand('input.mp4', '1:1', 'output.mp4')
      expect(args).toContain('crop=ih:ih')
    })
  })

  describe('buildColorGradeCommand', () => {
    it('harus menghasilkan filter eq(contrast, brightness, saturation)', () => {
      const args = buildColorGradeCommand('input.mp4', {
        contrast: 15, // slider 0-100, misal dikonversi ke skala 1.15
        brightness: -5, // misal dikonversi ke -0.05
        saturation: 20 // misal dikonversi ke 1.2
      }, 'output.mp4')

      expect(args).toContain('-vf')
      expect(args).toContain('eq=contrast=1.15:brightness=-0.05:saturation=1.2')
    })

    it('harus membiarkan default jika tidak ada perubahan', () => {
      const args = buildColorGradeCommand('input.mp4', {
        contrast: 0,
        brightness: 0,
        saturation: 0
      }, 'output.mp4')

      expect(args).toContain('eq=contrast=1:brightness=0:saturation=1')
    })
  })

  describe('buildCaptionCommand', () => {
    it('harus menghasilkan filter drawtext', () => {
      const args = buildCaptionCommand('input.mp4', {
        text: 'Halo Dunia',
        fontSize: 48,
        fontColor: '#FFFFFF',
        bgColor: '#000000',
        position: 'bottom'
      }, 'output.mp4')

      expect(args).toContain('-vf')
      const vfArg = args[args.indexOf('-vf') + 1]
      expect(vfArg).toContain('drawtext=')
      expect(vfArg).toContain("text='Halo Dunia'")
      expect(vfArg).toContain('fontsize=48')
      expect(vfArg).toContain('fontcolor=0xFFFFFF')
      expect(vfArg).toContain('boxcolor=0x000000@0.5')
      expect(vfArg).toContain('y=h-h/4') // bottom position
    })

    it('harus meletakkan teks di tengah jika position = middle', () => {
      const args = buildCaptionCommand('input.mp4', {
        text: 'Test',
        fontSize: 32,
        fontColor: '#000000',
        bgColor: '#FFFFFF',
        position: 'middle'
      }, 'output.mp4')

      const vfArg = args[args.indexOf('-vf') + 1]
      expect(vfArg).toContain('y=(h-text_h)/2')
    })
  })
})

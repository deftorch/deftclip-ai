import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, tool } from 'ai'
import { z } from 'zod'
import { KeyManager, AllKeysExhaustedError } from './key-manager'
import { buildAnalysisPrompt } from './prompt-builder'
import { GeminiCacheManager } from './caching'
import { strategySchema } from '@/lib/schema/strategy.schema'
import type { AnalysisConfig } from '@/lib/schema/config.schema'
import type { Strategy } from '@/lib/schema/strategy.schema'
import type { KeyManagerOptions } from './key-manager'

export interface AnalyzerResult {
  strategy: Strategy
  metadata: {
    model: string
    apiKeyIndex: number
    apiKeyLabel: string
    tokenUsageInput: number
    tokenUsageOutput: number
    durationMs: number
  }
}

/**
 * Analyzer utama — mengirim transkrip ke Gemini dan mengembalikan strategy.json.
 *
 * Retry otomatis dengan key berbeda jika kena 429.
 * Throws AllKeysExhaustedError jika semua key habis.
 */
export async function analyzeVideo(
  transcript: string,
  config: AnalysisConfig,
  keyManagerOptions: KeyManagerOptions,
  historyContext?: string,
  audioBase64?: string
): Promise<AnalyzerResult> {
  const keyManager = new KeyManager(keyManagerOptions)
  const prompt = buildAnalysisPrompt(config, historyContext)
  const startTime = Date.now()

  let lastError: Error | null = null

  for (let attempt = 0; attempt < keyManagerOptions.max_retries; attempt++) {
    const availableKey = keyManager.getAvailableKey()

    if (!availableKey) {
      throw new AllKeysExhaustedError()
    }

    try {
      // 1. Coba gunakan cache jika ada history yang tebal (> 100 karakter)
      let cachedContentName: string | undefined = undefined
      let cacheManager: GeminiCacheManager | undefined = undefined

      if (historyContext && historyContext.length > 100) {
        cacheManager = new GeminiCacheManager(availableKey.key)
        try {
          const cache = await cacheManager.createCache(prompt, config.model)
          cachedContentName = cache.name
          console.log(`[Analyzer] Created Context Cache: ${cachedContentName}`)
        } catch (e) {
          console.warn(`[Analyzer] Gagal membuat cache, fallback ke reguler:`, e)
        }
      }

      const google = createGoogleGenerativeAI({ apiKey: availableKey.key })
      
      // Jika pakai cache, kita tidak mengirim prompt dan history lagi sebagai user message,
      // karena sudah di-bake di dalam cache. Kita hanya lempar transkrip.
      const userMessageContent = cachedContentName 
        ? `## TRANSKRIP VIDEO\n${transcript}` 
        : `${prompt}\n\n## TRANSKRIP VIDEO\n${transcript}`

      // Bentuk pesan: array dari tipe Part (AI SDK format)
      const messageParts: Array<{ type: 'text' | 'file'; text?: string; data?: string; mimeType?: string }> = [
        { type: 'text', text: userMessageContent }
      ]

      if (audioBase64) {
        messageParts.push({
          type: 'file',
          mimeType: 'audio/mp3',
          data: audioBase64
        })
      }

      const { text, usage } = await generateText({
        model: google(config.model, { cachedContent: cachedContentName }),
        messages: [
          {
            role: 'user',
            content: messageParts as any,
          },
        ],
        tools: {
          search_broll_footage: tool({
            description: 'Mencari video B-Roll stok gratis berdasarkan kata kunci (contoh: "forest", "office", "laughing"). Gunakan ini jika klip membutuhkan visual tambahan.',
            parameters: z.object({ query: z.string().describe('Kata kunci pencarian video') }),
            execute: async ({ query }) => {
              // Simulasi Pexels API (Bisa diganti dengan fetch betulan ke Pexels)
              console.log(`[Agent] Mencari B-Roll untuk query: ${query}...`)
              return { url: `https://videos.pexels.com/search?q=${encodeURIComponent(query)}` }
            }
          })
        },
        maxSteps: 3, // Agentic workflow: izinkan agent memakai tools lalu menjawab
        maxOutputTokens: 4096,
      })

      // Bersihkan cache jika selesai agar tidak makan kuota (opsional, tapi disarankan)
      if (cacheManager && cachedContentName) {
        cacheManager.deleteCache(cachedContentName).catch(() => {})
      }

      // Parse JSON dari response AI
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('AI tidak mengembalikan JSON yang valid')
      }

      const rawStrategy = JSON.parse(jsonMatch[0])
      const strategy = strategySchema.parse(rawStrategy)

      return {
        strategy,
        metadata: {
          model: config.model,
          apiKeyIndex: availableKey.index,
          apiKeyLabel: availableKey.label,
          tokenUsageInput: usage?.inputTokens ?? 0,
          tokenUsageOutput: usage?.outputTokens ?? 0,
          durationMs: Date.now() - startTime,
        },
      }
    } catch (err: unknown) {
      const error = err as Error
      // Check if rate limit error
      if (
        error.message?.includes('429') ||
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.message?.includes('rate limit')
      ) {
        keyManager.markRateLimited(availableKey.index)
        lastError = error
        continue
      }
      // Non-rate-limit error: re-throw immediately
      throw error
    }
  }

  // All retries exhausted
  if (lastError) throw lastError
  throw new AllKeysExhaustedError()
}

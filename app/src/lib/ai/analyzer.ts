import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { KeyManager, AllKeysExhaustedError } from './key-manager'
import { buildAnalysisPrompt } from './prompt-builder'
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
  keyManagerOptions: KeyManagerOptions
): Promise<AnalyzerResult> {
  const keyManager = new KeyManager(keyManagerOptions)
  const prompt = buildAnalysisPrompt(config)
  const startTime = Date.now()

  let lastError: Error | null = null

  for (let attempt = 0; attempt < keyManagerOptions.max_retries; attempt++) {
    const availableKey = keyManager.getAvailableKey()

    if (!availableKey) {
      throw new AllKeysExhaustedError()
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey: availableKey.key })

      const { text, usage } = await generateText({
        model: google(config.model),
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n## TRANSKRIP VIDEO\n${transcript}`,
          },
        ],
        maxTokens: 4096,
      })

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
          tokenUsageInput: usage?.promptTokens ?? 0,
          tokenUsageOutput: usage?.completionTokens ?? 0,
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

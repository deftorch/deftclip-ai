/**
 * KeyManager — Mengelola rotasi API key Gemini dengan cooldown otomatis.
 *
 * Fitur:
 * - Rotasi round_robin / least_used / random
 * - Auto-cooldown setelah kena rate limit (429)
 * - Skip key yang di-disable
 * - Expose status semua key untuk dashboard transparansi
 */

export interface ApiKeyConfig {
  key: string
  label: string
  enabled: boolean
}

export interface KeyManagerOptions {
  keys: ApiKeyConfig[]
  rotation_strategy: 'round_robin' | 'least_used' | 'random'
  cooldown_seconds: number
  max_retries: number
}

export interface KeyStatus {
  index: number
  label: string
  enabled: boolean
  isLimited: boolean
  cooldownUntil: number | null
  useCount: number
}

export interface AvailableKey {
  key: string
  index: number
  label: string
}

/** Error saat satu key kena rate limit. */
export class GeminiRateLimitError extends Error {
  constructor(public keyIndex: number) {
    super(`API key ${keyIndex} hit rate limit`)
    this.name = 'GeminiRateLimitError'
  }
}

/** Error saat semua key sedang cooldown. */
export class AllKeysExhaustedError extends Error {
  constructor() {
    super('All API keys are currently rate limited')
    this.name = 'AllKeysExhaustedError'
  }
}

export class KeyManager {
  private config: KeyManagerOptions
  private statuses: KeyStatus[]
  private currentIndex = 0

  constructor(config: KeyManagerOptions) {
    this.config = config
    this.statuses = config.keys.map((k, i) => ({
      index: i,
      label: k.label,
      enabled: k.enabled,
      isLimited: false,
      cooldownUntil: null,
      useCount: 0,
    }))
  }

  /**
   * Mendapatkan key yang tersedia berdasarkan strategi rotasi.
   * Returns null jika semua key sedang cooldown.
   */
  getAvailableKey(): AvailableKey | null {
    const now = Date.now()

    // Reset expired cooldowns
    this.statuses.forEach((s) => {
      if (s.isLimited && s.cooldownUntil && now > s.cooldownUntil) {
        s.isLimited = false
        s.cooldownUntil = null
      }
    })

    if (this.config.rotation_strategy === 'round_robin') {
      return this._roundRobin()
    } else if (this.config.rotation_strategy === 'least_used') {
      return this._leastUsed()
    } else {
      return this._random()
    }
  }

  private _roundRobin(): AvailableKey | null {
    for (let attempt = 0; attempt < this.config.keys.length; attempt++) {
      const idx = (this.currentIndex + attempt) % this.config.keys.length
      const status = this.statuses[idx]
      if (status.enabled && !status.isLimited) {
        this.currentIndex = (idx + 1) % this.config.keys.length
        status.useCount++
        return { key: this.config.keys[idx].key, index: idx, label: status.label }
      }
    }
    return null
  }

  private _leastUsed(): AvailableKey | null {
    let minUse = Infinity
    let minIdx = -1
    this.statuses.forEach((s, i) => {
      if (s.enabled && !s.isLimited && s.useCount < minUse) {
        minUse = s.useCount
        minIdx = i
      }
    })
    if (minIdx === -1) return null
    this.statuses[minIdx].useCount++
    return {
      key: this.config.keys[minIdx].key,
      index: minIdx,
      label: this.statuses[minIdx].label,
    }
  }

  private _random(): AvailableKey | null {
    const available = this.statuses
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.enabled && !s.isLimited)
    if (available.length === 0) return null
    const pick = available[Math.floor(Math.random() * available.length)]
    pick.s.useCount++
    return {
      key: this.config.keys[pick.i].key,
      index: pick.i,
      label: pick.s.label,
    }
  }

  /**
   * Menandai key tertentu sebagai rate-limited.
   * Cooldown akan berakhir sesuai `cooldown_seconds` dari config.
   */
  markRateLimited(index: number): void {
    this.statuses[index].isLimited = true
    this.statuses[index].cooldownUntil =
      Date.now() + this.config.cooldown_seconds * 1000
  }

  /** Mengembalikan snapshot status semua key (untuk dashboard). */
  getKeyStatuses(): KeyStatus[] {
    const now = Date.now()
    return this.statuses.map((s) => ({
      ...s,
      // Recalculate isLimited based on current time
      isLimited: s.isLimited && s.cooldownUntil != null && now < s.cooldownUntil,
    }))
  }

  /** Statistik agregat untuk transparansi dashboard. */
  getStats() {
    const statuses = this.getKeyStatuses()
    return {
      total: statuses.length,
      active: statuses.filter((s) => s.enabled && !s.isLimited).length,
      limited: statuses.filter((s) => s.isLimited).length,
      disabled: statuses.filter((s) => !s.enabled).length,
      totalUseCount: statuses.reduce((sum, s) => sum + s.useCount, 0),
    }
  }
}

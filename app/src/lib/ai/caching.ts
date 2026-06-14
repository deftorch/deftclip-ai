/**
 * Utilitas untuk berinteraksi dengan Google Gemini Context Caching API.
 * Digunakan untuk menyimpan prompt sistem panjang dan histori klip 
 * agar menghemat biaya token input (hingga 80%) pada panggilan berikutnya.
 */

export interface CachedContent {
  name: string
  model: string
  expireTime: string
  createTime: string
  updateTime: string
}

export class GeminiCacheManager {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Membuat cache baru untuk sistem prompt dan histori.
   */
  async createCache(
    systemInstruction: string,
    modelName: string = 'models/gemini-3.5-flash'
  ): Promise<CachedContent> {
    const url = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`
    
    // Pastikan prefix "models/" ada
    const targetModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        // Set expiry time to 1 hour (3600s) from now
        ttl: '3600s',
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gagal membuat Gemini Cache: ${err}`)
    }

    return response.json()
  }

  /**
   * Menghapus cache berdasarkan nama (mis. "cachedContents/12345")
   */
  async deleteCache(cacheName: string): Promise<void> {
    const url = `https://generativelanguage.googleapis.com/v1beta/${cacheName}?key=${this.apiKey}`
    await fetch(url, { method: 'DELETE' })
  }
}

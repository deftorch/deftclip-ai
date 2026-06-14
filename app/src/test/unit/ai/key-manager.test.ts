import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KeyManager } from '@/lib/ai/key-manager'

describe('KeyManager', () => {
  let manager: KeyManager

  beforeEach(() => {
    manager = new KeyManager({
      keys: [
        { key: 'key-1', label: 'Akun 1', enabled: true },
        { key: 'key-2', label: 'Akun 2', enabled: true },
        { key: 'key-3', label: 'Akun 3', enabled: true },
      ],
      rotation_strategy: 'round_robin',
      cooldown_seconds: 60,
      max_retries: 3,
    })
  })

  it('harus return key pertama saat pertama dipanggil (round robin)', () => {
    const result = manager.getAvailableKey()
    expect(result?.key).toBe('key-1')
  })

  it('harus rotasi ke key berikutnya (round robin)', () => {
    manager.getAvailableKey() // key-1
    const result = manager.getAvailableKey()
    expect(result?.key).toBe('key-2')
  })

  it('harus rotasi ke key-3 setelah key-2', () => {
    manager.getAvailableKey() // key-1
    manager.getAvailableKey() // key-2
    const result = manager.getAvailableKey()
    expect(result?.key).toBe('key-3')
  })

  it('harus kembali ke key-1 setelah key-3 (wrap around)', () => {
    manager.getAvailableKey() // key-1
    manager.getAvailableKey() // key-2
    manager.getAvailableKey() // key-3
    const result = manager.getAvailableKey()
    expect(result?.key).toBe('key-1')
  })

  it('harus skip key yang sedang cooldown', () => {
    const first = manager.getAvailableKey()! // key-1
    manager.markRateLimited(first.index)
    const second = manager.getAvailableKey()
    expect(second?.key).toBe('key-2')
  })

  it('harus skip multiple key yang cooldown', () => {
    manager.markRateLimited(0) // key-1 cooldown
    manager.markRateLimited(1) // key-2 cooldown
    const result = manager.getAvailableKey()
    expect(result?.key).toBe('key-3')
  })

  it('harus return null jika semua key cooldown', () => {
    manager.markRateLimited(0)
    manager.markRateLimited(1)
    manager.markRateLimited(2)
    expect(manager.getAvailableKey()).toBeNull()
  })

  it('harus reset cooldown setelah waktu habis', () => {
    vi.useFakeTimers()
    manager.markRateLimited(0)
    expect(manager.getAvailableKey()?.key).toBe('key-2')
    vi.advanceTimersByTime(61_000) // 61 detik
    const statuses = manager.getKeyStatuses()
    expect(statuses[0].isLimited).toBe(false)
    vi.useRealTimers()
  })

  it('harus belum reset sebelum cooldown habis', () => {
    vi.useFakeTimers()
    manager.markRateLimited(0)
    vi.advanceTimersByTime(59_000) // 59 detik — belum reset
    const statuses = manager.getKeyStatuses()
    expect(statuses[0].isLimited).toBe(true)
    vi.useRealTimers()
  })

  it('harus skip key yang disabled', () => {
    const managerWithDisabled = new KeyManager({
      keys: [
        { key: 'key-1', label: 'Akun 1', enabled: false },
        { key: 'key-2', label: 'Akun 2', enabled: true },
      ],
      rotation_strategy: 'round_robin',
      cooldown_seconds: 60,
      max_retries: 3,
    })
    const result = managerWithDisabled.getAvailableKey()
    expect(result?.key).toBe('key-2')
  })

  it('harus return null jika semua key disabled', () => {
    const allDisabled = new KeyManager({
      keys: [
        { key: 'key-1', label: 'Akun 1', enabled: false },
        { key: 'key-2', label: 'Akun 2', enabled: false },
      ],
      rotation_strategy: 'round_robin',
      cooldown_seconds: 60,
      max_retries: 3,
    })
    expect(allDisabled.getAvailableKey()).toBeNull()
  })

  it('harus return status semua key', () => {
    const statuses = manager.getKeyStatuses()
    expect(statuses).toHaveLength(3)
    expect(statuses[0]).toMatchObject({
      label: 'Akun 1',
      enabled: true,
      isLimited: false,
    })
  })

  it('harus catat waktu cooldown yang benar setelah markRateLimited', () => {
    vi.useFakeTimers()
    const now = Date.now()
    manager.markRateLimited(0)
    const statuses = manager.getKeyStatuses()
    expect(statuses[0].cooldownUntil).toBeGreaterThan(now)
    expect(statuses[0].cooldownUntil).toBe(now + 60_000)
    vi.useRealTimers()
  })

  it('harus increment useCount setiap kali key dipakai', () => {
    manager.getAvailableKey() // key-1: useCount=1
    manager.getAvailableKey() // key-2: useCount=1
    const statuses = manager.getKeyStatuses()
    expect(statuses[0].useCount).toBe(1)
    expect(statuses[1].useCount).toBe(1)
  })

  it('harus return index dan label yang benar', () => {
    const result = manager.getAvailableKey()
    expect(result?.index).toBe(0)
    expect(result?.label).toBe('Akun 1')
  })

  it('getStats() harus return statistik yang benar', () => {
    const stats = manager.getStats()
    expect(stats.total).toBe(3)
    expect(stats.active).toBe(3)
    expect(stats.limited).toBe(0)
    expect(stats.disabled).toBe(0)
  })

  it('getStats() harus update setelah markRateLimited', () => {
    manager.markRateLimited(0)
    const stats = manager.getStats()
    expect(stats.active).toBe(2)
    expect(stats.limited).toBe(1)
  })
})

describe('KeyManager — strategi least_used', () => {
  it('harus pilih key dengan useCount terkecil', () => {
    const mgr = new KeyManager({
      keys: [
        { key: 'key-a', label: 'A', enabled: true },
        { key: 'key-b', label: 'B', enabled: true },
      ],
      rotation_strategy: 'least_used',
      cooldown_seconds: 60,
      max_retries: 3,
    })

    mgr.getAvailableKey() // key-a: useCount=1
    const second = mgr.getAvailableKey() // key-b harusnya (useCount=0)
    expect(second?.key).toBe('key-b')
  })
})

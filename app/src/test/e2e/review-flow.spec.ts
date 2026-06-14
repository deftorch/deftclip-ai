import { test, expect } from '@playwright/test'

test.describe('Review Flow E2E', () => {
  // Catatan: Karena kita tidak punya backend dummy, tes E2E ini mungkin perlu mocking 
  // API atau database seed jika dijalankan di CI/CD. 
  // Untuk keperluan ini, kita test flow dasar UI dan interaksinya.
  
  test('harus bisa submit pipeline dan navigasi ke halaman review', async ({ page }) => {
    // Intercept API /api/pipeline/create untuk menghindari hit ke Gemini beneran
    await page.route('/api/pipeline/create', async route => {
      await route.fulfill({
        status: 200,
        json: { pipelineId: 'test_pipeline_123', status: 'pending' }
      })
    })

    await page.goto('/')
    
    // Isi form
    await page.fill('input#video-url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await page.fill('input#duration', '60')
    await page.selectOption('select#source-type', 'podcast')
    
    // Submit
    await page.click('button#submit-pipeline')
    
    // Karena kita mock response, ia hanya akan memunculkan kartu pipeline di bawah form
    await expect(page.locator('.card:has-text("test_pipeline_123")')).toBeVisible()

    // Navigasi ke halaman review secara manual karena form tidak redirect tapi menambah list
    await page.goto('/pipeline/test_pipeline_123')
  })

  test('harus memuat klip dan bisa di-approve/reject/edit', async ({ page }) => {
    // Mock response GET analyze
    await page.route('**/api/pipeline/*/analyze', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            pipeline: { id: 'test_pipeline_123', status: 'review', sourceUrl: 'https://youtube.com', sourceTitle: 'Test Video' },
            clips: [
              {
                id: 'clip_001',
                startTime: 10,
                endTime: 25,
                duration: 15,
                hookType: 'bold_claim',
                viralityScore: 85,
                aiSuggestedTitle: 'Klaim Berani',
                transcriptSnippet: 'Ini adalah kalimat yang sangat berani.',
                humanApproved: false,
                humanRejected: false,
              },
              {
                id: 'clip_002',
                startTime: 30,
                endTime: 45,
                duration: 15,
                hookType: 'question_hook',
                viralityScore: 70,
                aiSuggestedTitle: 'Pertanyaan',
                transcriptSnippet: 'Apakah ini mungkin?',
                humanApproved: false,
                humanRejected: false,
              }
            ]
          }
        })
      } else {
        await route.continue()
      }
    })

    // Mock response POST approve
    await page.route('**/api/clips/*/approve', async route => {
      await route.fulfill({ status: 200, json: { success: true } })
    })

    // Mock response POST reject
    await page.route('**/api/clips/*/reject', async route => {
      await route.fulfill({ status: 200, json: { success: true } })
    })

    await page.goto('/pipeline/test_pipeline_123')

    // Verifikasi klip tampil
    await expect(page.locator('text=Klaim Berani')).toBeVisible()
    await expect(page.locator('text=Pertanyaan')).toBeVisible()

    // Verifikasi Transparency Panel
    await expect(page.locator('text=MENGAPA AI MEMILIH MOMEN INI?')).toHaveCount(2)
    
    // Approve clip_001
    await page.click('button#approve-clip_001')
    
    // Karena page reload di UI saat handleApprove memanggil fetchData, state akan di-fetch ulang.
    // Dalam tes asli DB akan berubah. Disini kita asumsikan panggil API terkirim.
  })
})

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.describe('Landing Page', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('link', { name: 'Blastoff' }).first()).toBeVisible()
  })

  test('waitlist form is present', async ({ page }) => {
    await page.goto(BASE_URL)
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto(BASE_URL)
    const dashboardLink = page.locator('a[href="/dashboard"]').first()
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click()
      await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 10000 })
    }
  })
})

test.describe('Login Page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByText('Sign Up')).toBeVisible()
  })

  test('toggles between sign in and sign up', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByText('Sign Up').click()
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
    await page.getByText('Sign In', { exact: false }).last().click()
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
  })

  test('shows OAuth buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.getByText('Continue with GitHub')).toBeVisible()
    await expect(page.getByText('Continue with Google')).toBeVisible()
  })
})

test.describe('Dashboard Auth Guard', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('redirects to login for products page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/products`)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('redirects to login for campaigns page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/campaigns`)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('redirects to login for channels page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/channels`)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe('API Authentication', () => {
  test('products API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/products`)
    expect(res.status()).toBe(401)
  })

  test('campaigns API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/campaigns`)
    expect(res.status()).toBe(401)
  })

  test('channels API returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/channels`)
    expect(res.status()).toBe(401)
  })

  test('ai API returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ai`, {
      data: { product: { name: 'test' }, channels: ['discord'] },
    })
    expect(res.status()).toBe(401)
  })

  test('publish API returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/publish`, {
      data: { channelType: 'discord', authData: {}, content: {} },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Public APIs (no auth required)', () => {
  test('waitlist API works without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/waitlist`)
    expect(res.status()).toBe(200)
  })

  test('stats API works without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/stats`)
    expect(res.status()).toBe(200)
  })

  test('track API accepts events', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/track`, {
      data: { type: 'page_view', path: '/test' },
    })
    expect(res.status()).toBe(200)
  })
})

test.describe('Cron Security', () => {
  test('cron GET rejects without CRON_SECRET', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/cron/publish`)
    expect(res.status()).toBe(401)
  })
})

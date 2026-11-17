import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'admin@club.test').toLowerCase()
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'TestPassword123'
export const INVITE_CODE = process.env.ADMIN_INVITE_CODE ?? 'Invite-2026-test'

/** Порожня база (лише адміністратор) або демо-дані. */
export async function resetDb(request: APIRequestContext, seed?: 'demo' | 'archive') {
  const res = await request.post('/api/test/reset', { data: { seed } })
  expect(res.ok(), 'Сервер має бути запущений з E2E_TEST_MODE=1').toBeTruthy()
}

export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto('/admin/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('main button[type=submit]')
  await page.waitForURL(/\/admin$/)
}

/** М'яка перевірка: тест не зупиняється на першій помилці, а показує всі. */
export function ok(condition: unknown, message: string) {
  expect.soft(Boolean(condition), message).toBe(true)
}

export const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

/** Збирає помилки JavaScript на сторінці. */
export function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

export const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
export const fixture = (name: string) => path.join(FIXTURES, name)

/** Значення для поля «Дата та час» через N днів від сьогодні (час за Києвом). */
export function dateInput(daysFromNow: number, time = '18:30') {
  const d = new Date(Date.now() + daysFromNow * 86_400_000)
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  return `${parts}T${time}`
}

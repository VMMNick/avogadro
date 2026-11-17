import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'
import { login, resetDb } from './helpers'

/**
 * Автоматична перевірка доступності (WCAG 2.1 AA): контраст, підписи полів, структура заголовків,
 * назви кнопок і посилань, ролі для програм читання з екрана.
 */
const stub = { status: 200, contentType: 'text/html', body: '<!doctype html><html lang="uk"><title>Карта</title><body></body></html>' }

async function audit(page: Page, url: string) {
  await page.goto(url)
  // Анімації появи вимкнено, щоб перевіряти кінцевий вигляд
  await page.waitForTimeout(300)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('iframe') // карта Google — чужий вміст
    .analyze()
  const report = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join('\n    ')}`,
  )
  expect.soft(report, `Порушення доступності на ${url}`).toEqual([])
}

test.describe('доступність', () => {
  test.use({ reducedMotion: 'reduce' })
  test.beforeEach(async ({ request }) => resetDb(request, 'demo'))

  test('публічні сторінки', async ({ page }) => {
    await page.context().route(/google\.com/, (r) => r.fulfill(stub))
    await audit(page, '/')
    await audit(page, '/en')
    await page.goto('/')
    const href = await page.locator('#matches .match-card a:has-text("Детальніше")').first().getAttribute('href')
    await audit(page, href!)
    await audit(page, `/en${href}`)
    await audit(page, '/admin/login')
    await audit(page, '/admin/register')
  })

  test('адмінка', async ({ page }) => {
    await login(page)
    for (const url of [
      '/admin',
      '/admin/players',
      '/admin/players/new',
      '/admin/matches',
      '/admin/matches/new',
      '/admin/teams',
      '/admin/teams/new',
      '/admin/venues',
      '/admin/tournaments',
      '/admin/settings',
      '/admin/admins',
    ]) {
      await audit(page, url)
    }
    await page.goto('/admin/tournaments')
    await page.click('td a:has-text("Чемпіонат області")')
    await audit(page, page.url())
  })

  test('керування з клавіатури', async ({ page }) => {
    await page.context().route(/google\.com/, (r) => r.fulfill(stub))
    await page.goto('/')
    // Перший Tab — посилання «Перейти до вмісту»
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveClass(/skip-link/)
    await expect(page.locator(':focus')).toBeVisible()
    // Фільтри складу — звичайні кнопки, працюють з клавіатури
    const filter = page.locator('#team .filter-btn', { hasText: 'Ліберо' })
    await filter.focus()
    await page.keyboard.press('Enter')
    await expect(filter).toHaveAttribute('aria-pressed', 'true')
    // Видима рамка фокусу на кнопках і посиланнях
    const outline = await filter.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(outline, 'фокус видно').not.toBe('none')

    // Мобільне меню: відкривається з клавіатури, Esc закриває й повертає фокус
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('.nav-toggle').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.nav-toggle')).toBeFocused()
  })
})

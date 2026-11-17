import { test } from '@playwright/test'
import { dateInput, login, noHorizontalScroll, ok, resetDb } from './helpers'

test.beforeEach(async ({ request }) => resetDb(request))

const stubMaps = { status: 200, contentType: 'text/html', body: '<body style="background:#cfd8c4"></body>' }

test('міні-карта залу й посилання на Google Maps', async ({ page, browser }) => {
  await page.context().route(/google\.com/, (r) => r.fulfill(stubMaps))
  await page.goto('/')
  ok((await page.locator('.map-card').count()) === 0, 'без адреси карти немає')

  await login(page)
  await page.goto('/admin/settings')
  await page.fill('#address', 'СК «Юність», вул. Прикладна, 1, Київ')
  await page.fill('#mapQuery', 'https://maps.app.goo.gl/abc123')
  await page.click('main button[type=submit]')
  await page.waitForSelector('#mapQuery-error')
  await page.fill('#mapQuery', 'https://www.google.com/maps/place/Hall/@50.4332,30.5214,17z')
  await page.click('main button[type=submit]')
  await page.waitForSelector('.adm-alert-ok')

  await page.goto('/admin/matches/new')
  await page.selectOption('#teamId', 'new')
  await page.fill('#opponent', 'Барком')
  await page.fill('#startsAt', dateInput(6))
  await page.selectOption('#venueId', 'new')
  await page.fill('#location', 'СК Юність')
  await page.uncheck('input[name=saveVenue]')
  await page.click('main button[type=submit]')
  await page.waitForURL(/saved/)

  await page.goto('/')
  const src = (await page.getAttribute('.map-frame iframe', 'src')) ?? ''
  ok(src.includes('q=50.4332%2C30.5214') && src.includes('output=embed'), 'iframe показує координати залу')
  ok(
    (await page.getAttribute('a:has-text("Відкрити в Google Maps")', 'href')) ===
      'https://www.google.com/maps/search/?api=1&query=50.4332%2C30.5214',
    'кнопка «Відкрити в Google Maps»',
  )
  const dir = page.locator('a:has-text("Прокласти маршрут")')
  ok(((await dir.getAttribute('href')) ?? '').includes('/maps/dir/?api=1&destination='), 'кнопка «Прокласти маршрут»')
  ok((await dir.getAttribute('target')) === '_blank', 'відкривається в новій вкладці')
  ok(((await page.getAttribute('.contact-card a:has-text("Юність")', 'href')) ?? '').includes('google.com/maps'), 'адреса в контактах — посилання на карту')
  ok(((await page.getAttribute('.match-location a', 'href')) ?? '').includes('query=%D0%A1%D0%9A'), 'зал у картці матчу веде на Google Maps')

  const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  await m.context().route(/google\.com/, (r) => r.fulfill(stubMaps))
  await m.goto('/#contacts')
  ok(await noHorizontalScroll(m), 'телефон: без горизонтального скролу')
})

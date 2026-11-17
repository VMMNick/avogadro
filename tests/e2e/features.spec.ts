import { test, expect, type Page } from '@playwright/test'
import { collectErrors, dateInput, login, noHorizontalScroll, ok, resetDb } from './helpers'

const stub = { status: 200, contentType: 'text/html', body: '<body></body>' }
const DAY = 86_400_000

/** Чи потрапляють усі ігри демо-даних (окрім однієї навмисно старої) в поточний сезон — не так лише на початку серпня. */
const SEASON_EDGE = (() => {
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Kyiv', month: 'numeric' }).format(new Date(Date.now() - 19 * DAY)))
  const nowMonth = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Kyiv', month: 'numeric' }).format(new Date()))
  return month !== nowMonth && nowMonth === 8
})()

async function openHome(page: Page, path = '/') {
  await page.context().route(/google\.com/, (r) => r.fulfill(stub))
  await page.goto(path)
}

const cards = (page: Page, column: number) =>
  page.locator(`#matches .matches-columns > div:nth-child(${column}) .match-card`)

test.describe('сезони, статистика, календар, сторінка матчу', () => {
  test.beforeEach(async ({ request }) => resetDb(request, 'demo'))

  test('сезони й турніри на сайті', async ({ page }) => {
    const errors = collectErrors(page)
    await openHome(page)
    const season = page.locator('#matches .select-pill select').first()
    const options = await season.locator('option').allTextContents()
    ok(options.length === 3 && /^\d{4}\/\d{2}$/.test(options[1]), `сезони у фільтрі: ${options.join(', ')}`)
    if (!SEASON_EDGE) {
      await expect(cards(page, 1)).toHaveCount(2)
      await expect(cards(page, 2)).toHaveCount(3)
    }
    await season.selectOption('all')
    await expect(cards(page, 2)).toHaveCount(4)
    await season.selectOption({ index: 2 })
    await expect(cards(page, 2)).toHaveCount(1)
    ok((await cards(page, 2).first().textContent())?.includes('Барком'), 'архів минулого сезону: гра з Баркомом')

    await season.selectOption('all')
    const tournament = page.locator('#matches .select-pill select').nth(1)
    await tournament.selectOption({ label: 'Чемпіонат області' })
    await expect(cards(page, 1)).toHaveCount(1)
    await expect(cards(page, 2)).toHaveCount(3)
    ok((await page.locator('#matches .match-tournament').first().textContent()) === 'Чемпіонат області', 'назва турніру на картці')
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })

  test('статистика й особисті зустрічі', async ({ page }) => {
    await openHome(page, '/#stats')
    await page.locator('#stats .select-pill select').first().selectOption('all')
    const value = (label: string) =>
      page.locator('#stats .stat-tile', { hasText: label }).locator('.stat-value').textContent()
    ok((await value('Ігор')) === '4', 'зіграно 4')
    ok((await value('Перемог,')) === '50', '50% перемог')
    ok((await page.locator('#stats .stat-tile.is-win .stat-value').textContent()) === '2', '2 перемоги')
    ok((await page.locator('#stats .stat-tile.is-loss .stat-value').textContent()) === '2', '2 поразки')
    ok((await value('Сети')) === '7:9', 'сети 7:9')
    ok((await page.locator('#stats .form-pill').count()) === 4, 'форма: 4 останні гри')
    ok(((await page.locator('#stats .stat-sub').textContent()) ?? '').includes('2 перемоги поспіль'), 'серія: 2 перемоги поспіль')

    await page.click('#stats button:has-text("Товариські")')
    ok((await page.locator('#stats .state-message').count()) === 1, 'у товариських ще немає зіграних ігор')
    await page.click('#stats button:has-text("Усі")')

    await page.locator('#stats .h2h-card select').selectOption({ label: 'Барком' })
    ok(((await page.locator('#stats .h2h-record').textContent()) ?? '').includes('1 перемога · 1 поразка'), 'Барком: 1–1')
    ok(((await page.locator('#stats .h2h-record').textContent()) ?? '').includes('4:5'), 'Барком: сети 4:5')
    await expect(page.locator('#stats .h2h-list li')).toHaveCount(2)
  })

  test('календар: підписка, файл .ics, Google Календар', async ({ page, request, baseURL }) => {
    await openHome(page, '/#matches')
    const google = (await page.locator('.calendar-actions a').first().getAttribute('href')) ?? ''
    ok(google.startsWith('https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2F'), 'підписка в Google Календар')
    const webcal = (await page.locator('.calendar-actions a').nth(1).getAttribute('href')) ?? ''
    ok(webcal === `${baseURL!.replace('http://', 'webcal://')}/calendar.ics`, `підписка Apple/Outlook: ${webcal}`)

    const res = await request.get('/calendar.ics')
    ok(res.headers()['content-type']?.startsWith('text/calendar'), 'календар віддається як text/calendar')
    const ics = await res.text()
    ok(ics.startsWith('BEGIN:VCALENDAR') && ics.trim().endsWith('END:VCALENDAR'), 'формат iCalendar')
    ok((ics.match(/BEGIN:VEVENT/g) ?? []).length === 6, 'усі 6 ігор у календарі')
    ok(ics.includes('SUMMARY:🏐 Авогадро — Барком'), 'назва події')
    ok(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75), 'рядки не довші за 75 байт')
    ok(ics.includes('LOCATION:СК Юність\\, вул. Прикладна\\, 1\\, Київ'), 'місце з адресою залу')

    const en = await (await request.get('/en/calendar.ics')).text()
    ok(en.includes('SUMMARY:🏐 Avogadro — Барком'), 'англійський календар')

    const eventLink = (await cards(page, 1).first().locator('a:has-text("У календар")').getAttribute('href')) ?? ''
    ok(eventLink.includes('action=TEMPLATE') && /dates=\d{8}T\d{6}Z%2F\d{8}T\d{6}Z/.test(eventLink), 'кнопка «У календар» на картці')
  })

  test('сторінка матчу, картинка для поширення, розмітка для Google', async ({ page, request, browser }) => {
    const errors = collectErrors(page)
    await openHome(page)
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!)
    const types = jsonLd['@graph'].map((x: { '@type': string }) => x['@type'])
    ok(types[0] === 'SportsTeam' && types.filter((t: string) => t === 'SportsEvent').length === 2, `розмітка головної: ${types}`)

    await cards(page, 1).first().locator('a:has-text("Детальніше")').click()
    await page.waitForURL(/\/matches\/[0-9a-f-]{36}$/)
    const url = page.url()
    await expect(page.locator('h1')).toContainText('Барком')
    ok((await page.locator('.match-chip').textContent()) === 'Майбутній матч', 'позначка «Майбутній матч»')
    ok((await page.locator('.match-facts').textContent())?.includes('вул. Прикладна, 1, Київ'), 'адреса залу')
    ok((await page.locator('.match-facts').textContent())?.includes('Чемпіонат області'), 'турнір')
    await expect(page.locator('.h2h-list li')).toHaveCount(2)
    ok((await page.title()).startsWith('Авогадро — Барком'), `заголовок сторінки: ${await page.title()}`)

    const ics = await request.get(`${new URL(url).pathname}/event.ics`)
    ok(ics.ok() && (await ics.text()).includes('BEGIN:VEVENT'), 'кнопка «Завантажити подію (.ics)»')
    ok(((await page.locator('a:has-text("Додати в Google Календар")').getAttribute('href')) ?? '').includes('calendar.google.com'), 'кнопка Google Календаря')

    const og = (await page.locator('meta[property="og:image"]').getAttribute('content')) ?? ''
    ok(og.includes('/opengraph-image'), `картинка для поширення: ${og}`)
    const img = await request.get(new URL(og).pathname + new URL(og).search)
    ok(img.ok() && img.headers()['content-type'] === 'image/png', 'картинка генерується (PNG)')
    ok((await img.body()).length > 20_000, 'картинка не порожня')

    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!)
    const event = ld['@graph'].find((x: { '@type': string }) => x['@type'] === 'SportsEvent')
    ok(event?.startDate && event?.location?.address === 'вул. Прикладна, 1, Київ', 'розмітка події з датою й адресою')

    ok((await request.get('/matches/00000000-0000-0000-0000-000000000000')).status() === 404, 'неіснуючий матч → 404')

    const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
    await m.goto(url)
    ok(await noHorizontalScroll(m), 'сторінка матчу на телефоні без горизонтального скролу')
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })

  test('англійська версія', async ({ page }) => {
    const errors = collectErrors(page)
    await openHome(page)
    ok((await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href'))?.endsWith('/en'), 'hreflang на англійську')
    await page.click('.lang-switch')
    await page.waitForURL(/\/en$/)
    ok((await page.evaluate(() => document.documentElement.lang)) === 'en', 'lang="en"')
    await expect(page.locator('h1')).toHaveText('Avogadro')
    ok((await page.locator('#site-nav').textContent())?.includes('Matches'), 'меню англійською')
    ok((await page.locator('.about-card').textContent())?.includes('volleyball club'), 'текст «Про клуб» англійською за замовчуванням')
    ok((await page.locator('#team .filter-btn').first().textContent()) === 'All', 'фільтри англійською')
    ok((await page.locator('.player-role').first().textContent())?.match(/Setter|Outside hitter|Middle blocker|Opposite|Libero|Coaching staff/), 'амплуа англійською')
    ok(await page.locator('#matches').getByText('Upcoming', { exact: true }).isVisible(), 'розділи англійською')
    await cards(page, 1).first().locator('a:has-text("Details")').click()
    await page.waitForURL(/\/en\/matches\//)
    ok((await page.locator('.back-link').textContent())?.includes('All matches'), 'сторінка матчу англійською')
    await page.click('.lang-switch')
    await page.waitForURL(/\/matches\//)
    ok(!page.url().includes('/en/'), 'перемикач веде на ту саму сторінку українською')
    ok((await page.locator('script[src*="_vercel"]').count()) === 0, 'аналітика Vercel не вантажиться поза Vercel')
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })

  test('адмінка: англійські тексти, фільтр сезону, турніри', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
    await page.fill('#taglineEn', 'Play hard, play together!')
    await page.click('main button[type=submit]')
    await page.waitForSelector('.adm-alert-ok')
    await openHome(page, '/en')
    await expect(page.locator('.hero-tagline')).toHaveText('Play hard, play together!')

    await page.goto('/admin/matches')
    const seasonNav = page.locator('nav[aria-label="Сезон"] a')
    await expect(seasonNav).toHaveCount(3)
    await seasonNav.nth(2).click()
    await page.waitForURL(/season=/)
    await expect(page.locator('.adm-table tbody tr')).toHaveCount(1)

    // Новий турнір прямо з форми матчу
    await page.goto('/admin/matches/new')
    await page.selectOption('#teamId', { label: 'Азот (Черкаси)' })
    await page.fill('#startsAt', dateInput(25))
    await page.selectOption('#tournamentId', 'new')
    await page.fill('#tournamentName', 'Кубок міста')
    await page.click('main button[type=submit]')
    await page.waitForURL(/matches\?saved/)
    await page.goto('/admin/tournaments')
    ok((await page.locator('tr', { hasText: 'Кубок міста' }).locator('td').nth(1).textContent()) === '1', 'турнір створено з формою матчу')
    const row = page.locator('tr', { hasText: 'Кубок міста' })
    await row.locator('button:has-text("Видалити")').click()
    await row.locator('button:has-text("Точно видалити?")').click()
    await page.waitForURL(/deleted/)
    await page.goto('/admin/matches')
    await expect(page.locator('.adm-table tbody tr')).toHaveCount(7)
  })
})

import { test, expect } from '@playwright/test'
import { collectErrors, dateInput, fixture, login, noHorizontalScroll, ok, resetDb } from './helpers'

const stub = { status: 200, contentType: 'text/html', body: '<body></body>' }

test.describe('сети, склад, MVP, турнірна таблиця, логотипи, пошук', () => {
  test.beforeEach(async ({ request }) => resetDb(request, 'demo'))

  test('рахунок по сетах, склад і MVP: адмінка → сайт', async ({ page, browser }) => {
    const errors = collectErrors(page)
    await page.context().route(/google\.com/, (r) => r.fulfill(stub))
    await login(page)
    await page.goto('/admin/matches/new')
    await page.selectOption('#teamId', { label: 'Азот (Черкаси)' })
    await page.fill('#startsAt', dateInput(-2, '19:00'))

    // Помилки в сетах
    await page.fill('input[name=set1our]', '25')
    await page.fill('input[name=set1their]', '25')
    await page.click('main button[type=submit]')
    await expect(page.locator('.adm-error')).toContainText('нічиєї')
    await page.fill('input[name=set1their]', '20')
    await page.click('main button[type=submit]')
    await expect(page.locator('.adm-error')).toContainText('ніхто не виграв 3 сети')

    // 3:1 за сетами — загальний рахунок рахується сам
    for (const [i, a, b] of [
      [2, '25', '27'],
      [3, '25', '19'],
    ] as const) {
      await page.fill(`input[name=set${i}our]`, a)
      await page.fill(`input[name=set${i}their]`, b)
    }
    await page.click('button:has-text("+ Сет 4")')
    await page.fill('input[name=set4our]', '28')
    await page.fill('input[name=set4their]', '26')
    await expect(page.locator('.adm-score-auto').first()).toHaveText('3')
    await expect(page.locator('.adm-score-auto').nth(1)).toHaveText('1')

    // Склад і MVP
    await page.click('button:has-text("Усі гравці")')
    await expect(page.locator('input[name=lineup]:checked')).toHaveCount(5)
    await page.locator('label', { hasText: 'Віктор Лис' }).locator('input').uncheck()
    await page.selectOption('#mvpPlayerId', { label: '#3 Андрій Бондар' })
    await page.click('main button[type=submit]')
    await page.waitForURL(/matches\?saved/)
    ok((await page.locator('tr', { hasText: 'Азот' }).first().textContent())?.includes('3:1'), 'рахунок 3:1 у списку')

    // Повторне відкриття: усе на місці
    await page.locator('tbody a', { hasText: 'Азот' }).first().click()
    ok((await page.inputValue('input[name=set4our]')) === '28', 'сети збережено')
    await expect(page.locator('input[name=lineup]:checked')).toHaveCount(4)
    ok((await page.inputValue('#mvpPlayerId')) !== '', 'MVP збережено')

    // Сайт: картка й сторінка матчу
    await page.goto('/')
    await page.locator('#matches .select-pill select').first().selectOption('all')
    const card = page.locator('#matches .match-card', { hasText: '28:26' })
    await expect(card).toHaveCount(1)
    ok((await card.locator('.match-sets').textContent())?.includes('25:27'), 'сети на картці')
    await card.locator('a:has-text("Детальніше")').click()
    await page.waitForURL(/\/matches\//)
    await expect(page.locator('.sets-table tbody tr')).toHaveCount(2)
    ok((await page.locator('.sets-table tbody tr').first().locator('td').last().textContent()) === '103', 'разом очок: 25 + 25 + 25 + 28 = 103')
    ok((await page.locator('.mvp-card').textContent())?.includes('Андрій Бондар'), 'MVP на сторінці матчу')
    await expect(page.locator('.lineup-list li')).toHaveCount(4)
    ok((await page.locator('.lineup-list li.is-mvp').textContent())?.includes('Андрій'), 'MVP виділено в складі')

    // Статистика: очки, найдовший сет, MVP сезону
    await page.goto('/#stats')
    await page.locator('#stats .select-pill select').first().selectOption('all')
    const tile = (label: string) => page.locator('#stats .stat-tile', { hasText: label })
    ok((await tile('Найдовший сет').locator('.stat-value').textContent()) === '30:32', 'найдовший сет 30:32')
    ok(((await tile('Очки').locator('.stat-value').textContent()) ?? '').match(/^\d+:\d+$/), 'очки за сетами')
    const mvp = page.locator('#stats .mvp-list li')
    await expect(mvp).toHaveCount(2)
    // Обидва по 2 рази — за абеткою
    ok((await mvp.first().textContent())?.includes('Андрій Бондар'), 'MVP: Андрій Бондар (2 рази)')
    ok((await mvp.nth(1).textContent())?.includes('Олег Коваль'), 'MVP: Олег Коваль (2 рази)')
    ok((await mvp.first().textContent())?.includes('2 рази'), 'кількість разів')

    // Картки гравців: ігри й MVP
    const oleh = page.locator('.player-card', { hasText: 'Олег Коваль' })
    ok((await oleh.locator('.player-stats').textContent())?.includes('4 гри'), 'Олег: 4 гри')
    ok((await oleh.locator('.player-mvp').textContent())?.includes('×2'), 'Олег: MVP ×2')
    ok((await page.locator('.player-card', { hasText: 'Петро Гук' }).locator('.player-stats').count()) === 0, 'без ігор — без статистики')

    const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
    await m.goto(page.url().replace('/#stats', '/'))
    ok(await noHorizontalScroll(m), 'телефон: без горизонтального скролу')
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })

  test('турнірна таблиця', async ({ page }) => {
    await page.context().route(/google\.com/, (r) => r.fulfill(stub))
    await page.goto('/')
    const rows = page.locator('#standings tbody tr')
    await expect(rows).toHaveCount(5)
    ok((await rows.first().textContent())?.includes('Епіцентр'), 'перше місце — Епіцентр (11 очок)')
    ok((await page.locator('#standings tr.is-us').textContent())?.includes('Авогадро'), 'наш рядок виділено')
    // Азот і Політехнік з 3 очками: вище той, у кого краще співвідношення сетів
    const names = (await rows.locator('.col-team').allTextContents()).map((s) => s.trim())
    ok(names.indexOf('Азот') < names.indexOf('Політехнік'), `рівні очки — за сетами: ${names.join(', ')}`)

    await login(page)
    await page.goto('/admin/tournaments')
    await page.click('td a:has-text("Чемпіонат області")')
    await page.click('button:has-text("Заповнити «Авогадро» з наших результатів")')
    const us = page.locator('.adm-standings-row', { has: page.locator('option:checked', { hasText: 'Авогадро' }) })
    ok((await us.locator('input').nth(5).inputValue()) === '5', 'наші очки з результатів: 5 (3 + 2 + 0)')
    // Помилка: перемоги + поразки ≠ ігри
    await page.locator('.adm-standings-row').first().locator('input').first().fill('9')
    await page.click('button:has-text("Зберегти таблицю")')
    await expect(page.locator('.adm-alert')).toContainText('Перемоги + поразки')
    await page.locator('.adm-standings-row').first().locator('input').first().fill('4')
    // Нова команда вручну
    await page.click('button:has-text("+ Команда")')
    const last = page.locator('.adm-standings-row').last()
    await last.locator('select').selectOption('other')
    await last.locator('input[placeholder="Назва команди"]').fill('Новий Клуб')
    await page.click('button:has-text("Зберегти таблицю")')
    await expect(page.locator('.adm-alert-ok')).toBeVisible()

    await page.goto('/')
    await expect(rows).toHaveCount(6)
    ok((await rows.last().textContent())?.includes('Новий Клуб'), 'нова команда в кінці таблиці (0 очок)')
    await page.goto('/en')
    ok((await page.locator('#standings h2').textContent())?.includes('Standings'), 'таблиця англійською')
  })

  test('логотипи команд і пошук у командах', async ({ page }) => {
    const errors = collectErrors(page)
    await page.context().route(/google\.com/, (r) => r.fulfill(stub))
    await login(page)
    await page.goto('/admin/teams')

    // Пошук
    await page.fill('#q', 'черк')
    await expect(page.locator('tbody tr')).toHaveCount(1)
    ok((await page.locator('tbody tr').textContent())?.includes('Азот'), 'пошук за містом')
    ok(page.url().includes('q='), 'запит в адресі (можна поділитися посиланням)')
    await page.fill('#q', 'бар')
    await expect(page.locator('tbody tr')).toHaveCount(1)
    await page.fill('#q', 'немає такої')
    await expect(page.locator('.adm-empty')).toContainText('нічого не знайдено')
    await page.click('button:has-text("Очистити")')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    // Логотип
    await page.click('td a:has-text("Барком")')
    await page.setInputFiles('input[type=file]:not([name])', fixture('wide.png'))
    await page.waitForFunction(() => (document.querySelector('input[name=photo]') as HTMLInputElement).files!.length === 1)
    ok((await page.locator('dialog[open]').count()) === 0, 'логотип без вікна обрізки')
    await page.click('main button[type=submit]')
    await page.waitForURL(/teams\?saved/)
    ok((await page.locator('tr', { hasText: 'Барком' }).locator('img.adm-logo-thumb').count()) === 1, 'логотип у списку команд')

    await page.goto('/')
    ok((await page.locator('#matches .match-card', { hasText: 'Барком' }).first().locator('img.team-logo').count()) === 1, 'логотип на картці матчу')
    ok((await page.locator('#standings tr', { hasText: 'Барком' }).locator('img.team-logo').count()) === 1, 'логотип у турнірній таблиці')
    await page.locator('#matches .match-card', { hasText: 'Барком' }).first().locator('a:has-text("Детальніше")').click()
    await page.waitForURL(/\/matches\//)
    await expect(page.locator('.match-hero-logo')).toBeVisible()
    const og = (await page.locator('meta[property="og:image"]').getAttribute('content')) ?? ''
    const img = await page.request.get(new URL(og).pathname + new URL(og).search)
    ok(img.ok() && img.headers()['content-type'] === 'image/png', 'картинка для поширення з логотипом генерується')

    // Видалення логотипа
    await page.goto('/admin/teams')
    await page.click('td a:has-text("Барком")')
    await page.check('input[name=removePhoto]')
    await page.click('main button[type=submit]')
    await page.waitForURL(/teams\?saved/)
    ok((await page.locator('tr', { hasText: 'Барком' }).locator('img').count()) === 0, 'логотип прибрано')
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })
})

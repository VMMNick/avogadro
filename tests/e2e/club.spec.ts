import { test, expect, type Page } from '@playwright/test'
import { ADMIN_EMAIL, collectErrors, dateInput, login, noHorizontalScroll, ok, resetDb } from './helpers'

/** Ролі, трофеї, тренування й заявки, нагадування, архів, карта сайту, 404, офлайн, афіша й календар. */

/** Головна з формою заявки — завжди повне перезавантаження (перехід лише за #якорем сторінку не оновлює). */
const openJoin = async (page: Page) => {
  await page.goto('/')
  await page.reload()
  await page.locator('#join').scrollIntoViewIfNeeded()
}

const fillJoin = async (page: Page, name = 'Іван Петренко') => {
  await page.fill('#join input[name=name]', name)
  await page.fill('#join input[name=contact]', '+380 50 123 45 67')
  await page.selectOption('#join select[name=experience]', 'amateur')
  await page.selectOption('#join select[name=position]', 'libero')
  await page.fill('#join textarea[name=message]', 'Грав в університетській команді')
  await page.check('#join input[name=consent]')
}

test.describe('клуб: нові можливості', () => {
  test.beforeEach(async ({ request }) => resetDb(request, 'demo'))

  test('ролі: редактор не має доступу до налаштувань і адміністраторів', async ({ page, browser }) => {
    await login(page)
    await page.goto('/admin/admins')
    await page.fill('#name', 'Редактор')
    await page.fill('#email', 'editor@club.test')
    await page.fill('#password', 'EditorPass123')
    await page.click('button:has-text("Додати адміністратора")')
    await page.waitForSelector('.adm-alert-ok')
    ok(
      (await page.locator('tr', { hasText: 'Редактор' }).locator('select').inputValue()) === 'editor',
      'роль «редактор»',
    )

    const ed = await (await browser.newContext()).newPage()
    await login(ed, 'editor@club.test', 'EditorPass123')
    const nav = ed.locator('.adm-sidebar')
    ok((await nav.locator('a:has-text("Налаштування")').count()) === 0, 'редактор не бачить налаштувань у меню')
    ok((await nav.locator('a:has-text("Адміністратори")').count()) === 0, 'редактор не бачить адміністраторів у меню')
    ok((await nav.locator('a:has-text("Матчі")').count()) === 1, 'матчі в меню є')
    ok((await ed.locator('a:has-text("Тексти й контакти")').count()) === 0, 'без швидкої дії «Тексти й контакти»')
    for (const url of ['/admin/settings', '/admin/admins']) {
      await ed.goto(url)
      await ed.waitForURL(/denied=1/)
      ok(
        ((await ed.locator('.adm-alert-error').textContent()) ?? '').includes('лише адміністраторам'),
        `${url}: доступ заборонено`,
      )
    }
    await ed.goto('/admin/matches/new')
    ok(ed.url().endsWith('/admin/matches/new'), 'редактор додає матчі')
    await ed.goto('/admin/account')
    ok(((await ed.locator('main').textContent()) ?? '').includes('editor@club.test'), 'свій акаунт і зміна пароля')

    // Адміністратор підвищує роль
    const row = page.locator('tr', { hasText: 'Редактор' })
    await row.locator('select').selectOption('admin')
    await row.locator('button:has-text("Змінити")').click()
    await page.waitForURL(/saved=1/)
    await ed.goto('/admin/settings')
    ok(ed.url().endsWith('/admin/settings'), 'після зміни ролі налаштування доступні')
    ok(
      (await page.locator('tr', { hasText: ADMIN_EMAIL }).locator('select').count()) === 0,
      'свою роль змінити не можна',
    )
  })

  test('трофеї й тренування', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/#trophies')
    await expect(page.locator('#trophies .trophy-card')).toHaveCount(3)
    await expect(page.locator('#trophies .trophy-season')).toHaveCount(2)
    ok(
      (await page.locator('#trophies .trophy-card').first().textContent())?.includes('Чемпіонат області'),
      'золото — першим',
    )
    await expect(page.locator('#join .training-item')).toHaveCount(2)
    ok((await page.locator('#join .training-item').first().textContent())?.includes('19:00'), 'час тренування')
    ok(
      (await page.locator('#join .training-day').first().textContent())?.toLowerCase().includes('вівторок'),
      'день тижня',
    )
    await page.goto('/en')
    ok(((await page.locator('#trophies').textContent()) ?? '').includes('Regional championship'), 'назва англійською')

    await login(page)
    await page.goto('/admin/achievements/new')
    await page.fill('#title', 'Кубок області')
    await page.selectOption('#kind', 'cup')
    await page.click('button:has-text("Додати досягнення")')
    await page.waitForURL(/achievements\?saved=1/)
    await page.goto('/admin/trainings/new')
    await page.selectOption('#weekday', '6')
    await page.fill('#startTime', '12:00')
    await page.fill('#endTime', '10:00')
    await page.selectOption('#venueId', { index: 1 })
    await page.click('main button[type=submit]')
    await expect(page.locator('.adm-error[role=alert]')).toContainText('пізніше')
    await page.fill('#startTime', '10:00')
    await page.fill('#endTime', '12:00')
    await page.click('main button[type=submit]')
    await page.waitForURL(/trainings\?saved=1/)

    await page.goto('/')
    await expect(page.locator('#trophies .trophy-card')).toHaveCount(4)
    await expect(page.locator('#join .training-item')).toHaveCount(3)
    ok(
      (await page.locator('#join .training-day').last().textContent())?.toLowerCase().includes('субота'),
      'субота — у кінці тижня',
    )
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })

  test('заявка «Хочу до команди»: захист від спаму й список в адмінці', async ({ page }) => {
    await openJoin(page)
    // Надто швидко — як бот
    await fillJoin(page)
    await page.click('#join button[type=submit]')
    await expect(page.locator('#join .join-error').first()).toContainText('Не вдалося надіслати')
    ok((await page.inputValue('#join input[name=name]')) === 'Іван Петренко', 'введене лишилось')

    // Звичайна людина
    await page.waitForTimeout(3200)
    await page.check('#join input[name=consent]')
    await page.click('#join button[type=submit]')
    await expect(page.locator('#join .join-done')).toContainText('Дякуємо')

    // Бот, що заповнив приховане поле: «успіх», але нічого не збережено
    await openJoin(page)
    await fillJoin(page, 'Спам Бот')
    await page.evaluate(() => {
      ;(document.querySelector('#join input[name=website]') as HTMLInputElement).value = 'http://spam.test'
    })
    await page.waitForTimeout(3200)
    await page.click('#join button[type=submit]')
    await expect(page.locator('#join .join-done')).toBeVisible()

    await login(page)
    ok((await page.locator('.adm-nav-badge').textContent())?.trim() === '1', 'лічильник нових заявок у меню')
    await page.goto('/admin/applications')
    await expect(page.locator('.adm-application')).toHaveCount(1)
    const card = page.locator('.adm-application').first()
    ok((await card.textContent())?.includes('Іван Петренко'), 'заявка Івана')
    ok((await card.textContent())?.includes('Ліберо'), 'амплуа')
    ok((await card.locator('a[href^="tel:"]').count()) === 1, 'телефон — посилання для дзвінка')
    await card.locator('button:has-text("Оброблено")').click()
    await expect(page.locator('.adm-application')).toHaveCount(0)
    await page.click('a:has-text("Усі")')
    await expect(page.locator('.adm-application.is-done')).toHaveCount(1)

    // Ліміт: 3 заявки на годину з однієї адреси
    for (let i = 0; i < 3; i++) {
      await openJoin(page)
      await fillJoin(page, `Гравець ${i}`)
      await page.waitForTimeout(3200)
      await page.click('#join button[type=submit]')
      if (i < 2) await expect(page.locator('#join .join-done')).toBeVisible()
      else await expect(page.locator('#join .join-error').first()).toContainText('Забагато')
    }
  })

  test('нагадування про ігри без рахунку', async ({ page }) => {
    await login(page)
    ok((await page.locator('.adm-reminder').count()) === 0, 'спершу нагадувань немає')
    await page.goto('/admin/matches/new')
    await page.selectOption('#teamId', { index: 1 })
    await page.fill('#startsAt', dateInput(-2))
    await page.click('main button[type=submit]')
    await page.waitForURL(/\/admin\/matches(\?|$)/)
    await page.goto('/admin')
    await expect(page.locator('.adm-reminder h2')).toContainText('1 гра без рахунку')
    await page.locator('.adm-reminder-list a').first().click()
    await page.waitForURL(/\/admin\/matches\/[0-9a-f-]{36}$/)
    await page.fill('input[name=ourSets]', '3')
    await page.fill('input[name=theirSets]', '0')
    await page.click('main button[type=submit]:has-text("Зберегти")')
    await page.waitForURL(/\/admin\/matches(\?|$)/)
    await page.goto('/admin')
    ok((await page.locator('.adm-reminder').count()) === 0, 'після внесення рахунку нагадування зникло')
  })

  test('карта сайту, англійська 404, офлайн-режим', async ({ page, request, context }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const ids = [...sitemap.matchAll(/\/matches\/([0-9a-f-]{36})</g)].map((m) => m[1])
    ok(ids.length >= 12, `матчі в карті сайту (uk + en): ${ids.length}`)
    ok(sitemap.includes('/en/matches/') && sitemap.includes('<lastmod>'), 'англійські сторінки й дата зміни')
    ok(sitemap.includes('/calendar<'), 'сторінка календаря')

    const res = await page.goto('/en/no-such-page')
    ok(res?.status() === 404, 'статус 404')
    await expect(page.locator('h1')).toHaveText('Page not found')
    ok((await page.getAttribute('html', 'lang')) === 'en', 'lang="en"')
    ok((await page.locator('a.btn-primary').getAttribute('href')) === '/en', 'посилання на англійську головну')
    await page.goto('/no-such-page')
    await expect(page.locator('h1')).toHaveText('Сторінку не знайдено')

    const manifest = await (await request.get('/manifest.webmanifest')).json()
    ok(manifest.start_url === '/' && manifest.display === 'standalone', 'маніфест застосунку')
    ok((await request.get('/sw.js')).ok(), 'service worker доступний')

    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect(page.locator('#matches .match-card').first()).toBeVisible()
    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('#matches .match-card').first()).toBeVisible()
    await expect(page.locator('.offline-banner')).toBeVisible()
    await context.setOffline(false)
  })

  test('афіша для друку й сторінка календаря', async ({ page, browser }) => {
    const errors = collectErrors(page)
    await page.goto('/')
    const upcoming = page.locator('#matches .matches-columns > div:first-child .match-card').first()
    await upcoming.locator('a:has-text("Детальніше")').click()
    await page.waitForURL(/\/matches\/[0-9a-f-]{36}$/)
    await page.click('a:has-text("Афіша для друку")')
    await page.waitForURL(/\/poster$/)
    const posterUrl = page.url()
    ok((await page.locator('.poster-teams').textContent())?.includes('Барком'), 'суперник на афіші')
    ok((await page.locator('.poster-qr svg').count()) === 1, 'QR-код')
    ok(((await page.locator('.poster-url').textContent()) ?? '').endsWith('/calendar'), 'QR веде на сторінку календаря')
    ok((await page.locator('meta[name=robots]').getAttribute('content'))?.includes('noindex'), 'афіша не індексується')
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.poster-toolbar')).toBeHidden()
    await page.emulateMedia({ media: 'screen' })

    await page.goto('/calendar')
    await expect(page.locator('h1')).toHaveText('Календар матчів')
    ok((await page.locator('.calendar-qr svg').count()) === 1, 'QR на сторінці календаря')
    await expect(page.locator('.calendar-upcoming .match-card')).toHaveCount(2)
    ok(
      ((await page.locator('.calendar-actions a').first().getAttribute('href')) ?? '').includes('calendar.google.com'),
      'підписка в Google Календар',
    )
    await page.goto('/en/calendar')
    await expect(page.locator('h1')).toHaveText('Match calendar')

    const mp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
    for (const url of ['/calendar', posterUrl]) {
      await mp.goto(url)
      ok(await noHorizontalScroll(mp), `без горизонтального скролу: ${url}`)
    }
    ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
  })
})

test('архів старих сезонів довантажується на вимогу', async ({ page, request }) => {
  await resetDb(request, 'archive')
  const html = await (await request.get('/')).text()
  ok(!html.includes('Старий Суперник'), 'старі сезони не входять у головну сторінку')
  const archive = await (await request.get('/api/matches/archive')).json()
  ok(archive.matches.length === 1 && archive.matches[0].opponent === 'Старий Суперник', 'архів через API')

  await page.goto('/#matches')
  const season = page.locator('#matches .select-pill select').first()
  ok((await season.locator('option').count()) === 4, 'у фільтрі є й архівний сезон')
  const archiveRequest = page.waitForRequest(/\/api\/matches\/archive/)
  await season.selectOption('all')
  await archiveRequest
  await expect(page.locator('#matches .match-card', { hasText: 'Старий Суперник' })).toHaveCount(1)
  await season.selectOption({ index: 3 })
  await expect(page.locator('#matches .matches-columns > div:nth-child(2) .match-card')).toHaveCount(1)

  // Статистика за всі сезони теж враховує архів
  await page.locator('#stats .select-pill select').first().selectOption('all')
  ok(
    (await page.locator('#stats .stat-tile', { hasText: 'Ігор' }).locator('.stat-value').textContent()) === '5',
    '5 ігор разом з архівом',
  )
})

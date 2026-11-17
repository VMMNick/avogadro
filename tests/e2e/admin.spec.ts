import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, collectErrors, dateInput, noHorizontalScroll, ok, resetDb } from './helpers'

test.beforeEach(async ({ request }) => resetDb(request))

test('адмінка: вхід, склад, матчі, налаштування, адміністратори, безпека', async ({ page, browser }) => {
  const errors = collectErrors(page)
  const txt = async (s: string) => (await page.locator(s).first().textContent())?.trim() ?? ''

  // Порожній сайт
  await page.goto('/')
  ok((await page.locator('text=Склад команди ще не додано.').count()) === 1, 'головна: порожній стан складу')

  // Захист адмінки
  await page.goto('/admin/players')
  ok(page.url().endsWith('/admin/login'), 'адмінка без входу → /admin/login')

  // Невірний пароль
  await page.fill('#email', ADMIN_EMAIL)
  await page.fill('#password', 'wrong-password')
  await page.click('main button[type=submit]')
  await page.waitForSelector('.adm-alert')
  ok((await txt('.adm-alert')).includes('Невірний'), 'невірний пароль → помилка')
  ok((await page.inputValue('#email')) === ADMIN_EMAIL, 'email лишився після помилки')

  // Вхід
  await page.fill('#password', ADMIN_PASSWORD)
  await page.click('main button[type=submit]')
  await page.waitForURL(/\/admin$/)
  await expect(page.locator('h1')).toHaveText('Огляд')

  // Валідація гравця не губить введене
  await page.goto('/admin/players/new')
  await page.fill('#name', 'Олексій Коваль')
  await page.evaluate(() => {
    const n = document.querySelector('#number')!
    n.removeAttribute('max')
    n.removeAttribute('min')
  })
  await page.fill('#number', '150')
  await page.selectOption('#role', 'setter')
  await page.click('main button[type=submit]')
  await page.waitForSelector('#number-error')
  ok((await txt('#number-error')).includes('0 до 99'), 'валідація номера')
  ok(
    (await page.inputValue('#name')) === 'Олексій Коваль' && (await page.inputValue('#role')) === 'setter',
    'значення форми збережено після помилки',
  )

  // Гравець із фото (стискається в браузері)
  const img = await page.screenshot({ type: 'png' })
  await page.fill('#number', '1')
  await page.setInputFiles('input[type=file]:not([name])', { name: 'p.png', mimeType: 'image/png', buffer: img })
  await page.waitForSelector('dialog[open]')
  await page.click('dialog >> text=Без обрізки')
  await page.waitForFunction(() => (document.querySelector('input[name=photo]') as HTMLInputElement).files!.length === 1)
  const [type, size] = await page.evaluate(() => {
    const f = (document.querySelector('input[name=photo]') as HTMLInputElement).files![0]
    return [f.type, f.size] as const
  })
  ok(type === 'image/webp' && size < 300_000, `фото стиснуто в браузері: ${type} ${size}`)
  await page.click('main button[type=submit]')
  await page.waitForURL(/\/admin\/players\?saved=1/)
  ok((await page.locator('td:has-text("Олексій Коваль")').count()) === 1, 'гравця з фото додано')
  const thumb = (await page.locator('.adm-thumb').first().getAttribute('src')) ?? ''
  ok(thumb.startsWith('/uploads/players/') || thumb.includes('blob.vercel-storage.com'), `фото збережено: ${thumb}`)

  for (const [n, num, r] of [
    ['Максим Сидоренко', '7', 'spiker'],
    ['Дмитро Бойко', '10', 'middle'],
    ['Ігор Тренер', '', 'staff'],
  ]) {
    await page.goto('/admin/players/new')
    await page.fill('#name', n)
    await page.fill('#number', num)
    await page.selectOption('#role', r)
    await page.click('main button[type=submit]')
    await page.waitForURL(/saved=1/)
  }
  await expect(page.locator('.adm-table tbody tr')).toHaveCount(4)

  // Матчі
  await page.goto('/admin/matches/new')
  await page.selectOption('#teamId', 'new')
  await page.fill('#opponent', 'Барком')
  await page.fill('#startsAt', dateInput(-30, '19:00'))
  await page.selectOption('#venueId', 'new')
  await page.fill('#location', 'СК Юність')
  await page.fill('input[name=ourSets]', '2')
  await page.fill('input[name=theirSets]', '2')
  await page.click('main button[type=submit]')
  await page.waitForSelector('.adm-error')
  ok((await txt('.adm-error')).includes('3 сети'), 'рахунок 2:2 відхилено')
  ok((await page.inputValue('#opponent')) === 'Барком', 'поля матчу збережено після помилки')
  await page.fill('input[name=ourSets]', '3')
  await page.fill('input[name=theirSets]', '1')
  await page.click('main button[type=submit]')
  await page.waitForURL(/saved=1/)

  const futureValue = dateInput(20)
  await page.goto('/admin/matches/new')
  await page.selectOption('#teamId', 'new')
  await page.fill('#opponent', 'Епіцентр')
  await page.fill('#startsAt', futureValue)
  await page.selectOption('#venueId', 'new')
  await page.fill('#location', 'СК Юність')
  await page.click('main button[type=submit]')
  await page.waitForURL(/saved=1/)
  await expect(page.locator('.adm-table tbody tr')).toHaveCount(2)
  await page.click('text=Епіцентр')
  ok((await page.inputValue('#startsAt')) === futureValue, 'час за Києвом зберігається коректно')

  // Налаштування
  await page.goto('/admin/settings')
  await page.fill('#tagline', 'Граємо разом!')
  await page.fill('#about', 'Перший абзац про клуб.\n\nДругий абзац.')
  await page.fill('#phone', '+380 67 123 45 67')
  await page.fill('#email', 'club@club.test')
  await page.evaluate(() => ((document.querySelector('#instagram') as HTMLInputElement).type = 'text'))
  await page.fill('#instagram', 'javascript:alert(1)')
  await page.click('main button[type=submit]')
  await page.waitForSelector('#instagram-error')
  ok((await page.inputValue('#about')) === 'Перший абзац про клуб.\n\nДругий абзац.', 'тексти не втрачено після помилки')
  await page.fill('#instagram', 'https://instagram.com/club')
  await page.click('main button[type=submit]')
  await page.waitForSelector('.adm-alert-ok')

  // Сайт показує дані
  await page.goto('/')
  await expect(page.locator('.player-card')).toHaveCount(4)
  ok((await txt('.hero-tagline')) === 'Граємо разом!', 'слоган оновився')
  await page.selectOption('#matches select >> nth=0', 'all')
  ok((await page.locator('#matches .match-score:has-text("3:1")').count()) === 1, 'результат 3:1 на сайті')
  ok((await page.locator('#matches >> text=Епіцентр').count()) >= 1, 'найближчий матч на сайті')
  ok((await page.locator('a[href="https://instagram.com/club"]').count()) === 1, 'контакти на сайті')
  await page.click('#team button:has-text("Штаб")')
  await expect(page.locator('.player-card')).toHaveCount(1)
  await page.click('#team button:has-text("Ліберо")')
  ok((await page.locator('text=У цій категорії поки нікого немає.').count()) === 1, 'порожній фільтр')

  // Видалення гравця прибирає фото
  await page.goto('/admin/players')
  const row = page.locator('tr:has-text("Олексій Коваль")')
  await row.locator('button:has-text("Видалити")').click()
  await row.locator('button:has-text("Точно видалити?")').click()
  await page.waitForURL(/deleted=1/)
  if (thumb.startsWith('/uploads/')) {
    ok(!fs.existsSync(path.join(process.cwd(), 'public', thumb)), 'файл фото видалено разом із гравцем')
  }
  await page.goto('/')
  await expect(page.locator('.player-card')).toHaveCount(3)

  // Адміністратори і зміна пароля
  await page.goto('/admin/admins')
  await page.fill('#name', 'Тренер')
  await page.fill('#email', 'coach@club.test')
  await page.fill('#password', 'CoachPass123')
  await page.click('button:has-text("Додати адміністратора")')
  await page.waitForSelector('.adm-alert-ok')
  ok((await page.locator('td:has-text("coach@club.test")').count()) === 1, 'адміністратора додано')

  const p2 = await (await browser.newContext()).newPage()
  await p2.goto('/admin/login')
  await p2.fill('#email', ADMIN_EMAIL)
  await p2.fill('#password', ADMIN_PASSWORD)
  await p2.click('main button[type=submit]')
  await p2.waitForURL(/\/admin$/)
  await page.fill('#current', ADMIN_PASSWORD)
  await page.fill('#next', 'NewPassword456')
  await page.fill('#confirm', 'NewPassword456')
  await page.click('button:has-text("Змінити пароль")')
  await page.waitForSelector('text=Пароль змінено')
  await p2.goto('/admin/players')
  ok(p2.url().endsWith('/admin/login'), 'після зміни пароля інша сесія завершена')
  await page.goto('/admin/players')
  ok(page.url().endsWith('/admin/players'), 'поточна сесія лишилась')

  // Вихід і захист від підбору пароля
  await page.goto('/admin')
  await page.click('button:has-text("Вийти")')
  await page.waitForURL(/login/)
  for (let i = 0; i < 6; i++) {
    await p2.fill('#email', 'coach@club.test')
    await p2.fill('#password', `bad${i}`)
    const resp = p2.waitForResponse((r) => r.request().method() === 'POST')
    await p2.click('main button[type=submit]')
    await resp
    await p2.waitForTimeout(300)
  }
  ok(((await p2.locator('.adm-alert').textContent()) ?? '').includes('Забагато'), 'блокування після 5 невдалих спроб')
  await p2.fill('#password', 'CoachPass123')
  await p2.click('main button[type=submit]')
  await p2.waitForTimeout(800)
  ok(p2.url().endsWith('/login'), 'навіть правильний пароль заблоковано на 15 хв')

  // Телефон: без горизонтального скролу
  const mp = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  await mp.goto('/admin/login')
  await mp.fill('#email', ADMIN_EMAIL)
  await mp.fill('#password', 'NewPassword456')
  await mp.click('main button[type=submit]')
  await mp.waitForURL(/\/admin$/)
  for (const u of [
    '/admin',
    '/admin/players',
    '/admin/matches',
    '/admin/settings',
    '/admin/admins',
    '/admin/players/new',
    '/admin/matches/new',
    '/admin/teams',
    '/admin/venues',
    '/admin/tournaments',
  ]) {
    await mp.goto(u)
    ok(await noHorizontalScroll(mp), `без горизонтального скролу на телефоні: ${u}`)
  }
  await mp.goto('/')
  ok(await noHorizontalScroll(mp), 'сайт без горизонтального скролу на телефоні')

  expect(errors, 'без помилок JavaScript').toEqual([])
})

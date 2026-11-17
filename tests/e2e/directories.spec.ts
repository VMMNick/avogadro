import { test } from '@playwright/test'
import { ADMIN_EMAIL, INVITE_CODE, collectErrors, dateInput, ok, resetDb } from './helpers'

test.beforeEach(async ({ request }) => resetDb(request))

test('вхід лише за посиланням, реєстрація за кодом, довідники, сортування матчів', async ({ page, browser }) => {
  const errors = collectErrors(page)
  await page.context().route(/google\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<body></body>' }))

  // Кнопки входу на сайті немає
  await page.goto('/')
  ok((await page.locator('a[href^="/admin"]').count()) === 0, 'на сайті немає посилань на адмінку')
  const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  await m.goto('/')
  await m.click('.nav-toggle')
  ok((await m.locator('#site-nav a:has-text("Адмін")').count()) === 0, 'у мобільному меню теж немає')

  // /admin → вхід → реєстрація
  await page.goto('/admin')
  ok(page.url().endsWith('/admin/login'), '/admin → сторінка входу')
  await page.click('a:has-text("Реєстрація")')
  await page.waitForURL(/register/)

  const fill = async (code: string, email = 'new@club.test', pass = 'NewPassword123', conf = 'NewPassword123') => {
    await page.fill('#name', 'Тренер')
    await page.fill('#email', email)
    await page.fill('#password', pass)
    await page.fill('#confirm', conf)
    await page.fill('#code', code)
    await page.click('main button[type=submit]')
    await page.waitForTimeout(1200)
  }
  await fill('wrong-code-1')
  ok(((await page.locator('#code-error').textContent()) ?? '').includes('Невірний код'), 'невірний код запрошення відхилено')
  ok((await page.inputValue('#email')) === 'new@club.test' && (await page.inputValue('#code')) === '', 'email лишився, код очищено')
  await fill(INVITE_CODE, 'new@club.test', 'NewPassword123', 'Other1234567')
  ok(((await page.locator('#confirm-error').textContent()) ?? '').includes('не збігаються'), 'паролі мають збігатися')
  await fill(INVITE_CODE, ADMIN_EMAIL.toUpperCase())
  ok(((await page.locator('#email-error').textContent()) ?? '').includes('уже існує'), 'зайнятий email відхилено')
  await fill(INVITE_CODE)
  await page.waitForURL(/\/admin$/)
  await page.goto('/admin/register')
  ok(page.url().endsWith('/admin'), 'залогіненого з реєстрації перекидає в адмінку')
  await page.goto('/admin/account')
  ok((await page.locator('text=new@club.test').count()) > 0, 'новий учасник увійшов у свій акаунт')
  ok((await page.locator('dd:has-text("Редактор")').count()) === 1, 'за кодом запрошення — роль «редактор»')
  await page.goto('/admin/admins')
  ok(page.url().includes('denied=1'), 'редактору керування доступом недоступне')

  // Довідник команд
  await page.goto('/admin/teams')
  ok((await page.locator('text=Довідник порожній').count()) === 1, 'команди: порожній довідник')
  for (const [n, c] of [
    ['Барком', 'Львів'],
    ['Епіцентр', 'Подоляни'],
    ['Азот', 'Черкаси'],
  ]) {
    await page.goto('/admin/teams/new')
    await page.fill('#name', n)
    await page.fill('#city', c)
    await page.click('main button[type=submit]')
    await page.waitForURL(/teams\?saved/)
  }
  ok((await page.locator('table tbody tr').count()) === 3, 'додано 3 команди')
  await page.goto('/admin/teams/new')
  await page.fill('#name', 'барком')
  await page.click('main button[type=submit]')
  await page.waitForSelector('#name-error')
  ok(((await page.locator('#name-error').textContent()) ?? '').includes('вже є'), 'дублікат назви відхилено (без регістру)')
  await page.goto('/admin/teams')
  ok((await page.locator('tbody td:first-child').allTextContents()).join() === 'Азот,Барком,Епіцентр', 'команди за алфавітом')

  // Довідник залів
  await page.goto('/admin/venues/new')
  await page.fill('#name', 'СК Юність')
  await page.fill('#address', 'вул. Прикладна, 1, Київ')
  await page.fill('#mapQuery', '50.4332, 30.5214')
  await page.click('main button[type=submit]')
  await page.waitForURL(/venues\?saved/)
  await page.goto('/admin/venues/new')
  await page.fill('#name', 'Зал 2')
  await page.fill('#mapQuery', 'https://maps.app.goo.gl/x')
  await page.click('main button[type=submit]')
  await page.waitForSelector('#mapQuery-error')

  // Матч з довідника
  await page.goto('/admin/matches/new')
  ok(!(await page.locator('#opponent').isVisible()), 'поле ручного вводу сховане, поки є довідник')
  await page.selectOption('#teamId', { label: 'Барком (Львів)' })
  await page.fill('#startsAt', dateInput(18))
  await page.selectOption('#venueId', { label: 'СК Юність — вул. Прикладна, 1, Київ' })
  await page.click('main button[type=submit]')
  await page.waitForURL(/matches\?saved/)
  ok((await page.locator('tbody a:has-text("Барком")').count()) === 1, 'матч з командою з довідника')

  await page.goto('/admin/matches/new')
  await page.fill('#startsAt', dateInput(19))
  await page.evaluate(() => ((document.querySelector('main form') as HTMLFormElement).noValidate = true))
  await page.click('main button[type=submit]')
  await page.waitForSelector('.adm-error')
  ok(((await page.locator('.adm-error').first().textContent()) ?? '').includes('суперника'), 'без суперника — помилка')
  await page.selectOption('#teamId', 'new')
  await page.fill('#opponent', 'Новачок')
  await page.fill('#startsAt', dateInput(-47, '19:00'))
  await page.fill('input[name=ourSets]', '3')
  await page.fill('input[name=theirSets]', '0')
  await page.click('main button[type=submit]')
  await page.waitForURL(/matches\?saved/)
  await page.goto('/admin/teams')
  ok((await page.locator('td a:has-text("Новачок")').count()) === 1, 'команда, введена вручну, потрапила в довідник')

  await page.goto('/admin/matches/new')
  await page.selectOption('#teamId', 'new')
  await page.fill('#opponent', 'Разова')
  await page.uncheck('input[name=saveTeam]')
  await page.fill('#startsAt', dateInput(3, '19:00'))
  await page.click('main button[type=submit]')
  await page.waitForURL(/matches\?saved/)
  await page.goto('/admin/teams')
  ok((await page.locator('td a:has-text("Разова")').count()) === 0, 'без галочки — у довідник не додається')

  // Сортування
  const col = () => page.locator('tbody tr td:nth-child(2) a').allTextContents()
  await page.goto('/admin/matches')
  ok((await col()).join() === 'Барком,Разова,Новачок', 'за замовчуванням — нові дати спочатку')
  await page.click('a:has-text("Суперник: А → Я")')
  await page.waitForURL(/sort=opponent-asc/)
  ok((await col()).join() === 'Барком,Новачок,Разова', 'суперник А→Я')
  await page.click('th a:has-text("Суперник")')
  await page.waitForURL(/sort=opponent-desc/)
  ok((await col()).join() === 'Разова,Новачок,Барком', 'повторний клік по заголовку — Я→А')
  await page.click('a:has-text("Дата: старі спочатку")')
  await page.waitForURL(/sort=date-asc/)
  ok((await col()).join() === 'Новачок,Разова,Барком', 'дата: старі спочатку')
  ok((await page.locator('th[aria-sort="ascending"]').count()) === 1, 'aria-sort для доступності')
  await page.goto('/admin/matches?sort=hack')
  ok((await col()).join() === 'Барком,Разова,Новачок', 'невідоме сортування → за замовчуванням')

  // Перейменування команди оновлює матчі; сайт веде на карту залу
  await page.goto('/admin/teams')
  await page.click('td a:has-text("Барком")')
  await page.fill('#name', 'Барком-Кажани')
  await page.click('main button[type=submit]')
  await page.waitForURL(/teams\?saved/)
  await page.goto('/admin/matches')
  ok((await page.locator('tbody a:has-text("Барком-Кажани")').count()) === 1, 'перейменування команди оновило матч')
  await page.goto('/')
  await page.selectOption('#matches .select-pill select >> nth=0', 'all')
  const href = await page.locator('.match-card', { hasText: 'Барком-Кажани' }).first().locator('.match-location a').getAttribute('href')
  ok(href?.includes('query=50.4332%2C30.5214'), 'на сайті зал веде на координати з довідника')

  // Видалення команди не видаляє матч
  await page.goto('/admin/teams')
  const row = page.locator('tr', { hasText: 'Барком-Кажани' })
  await row.locator('button:has-text("Видалити")').click()
  await row.locator('button:has-text("Точно видалити?")').click()
  await page.waitForURL(/deleted/)
  await page.goto('/admin/matches')
  ok((await page.locator('tbody a:has-text("Барком-Кажани")').count()) === 1, 'після видалення команди матч лишився')
  await page.click('tbody a:has-text("Барком-Кажани")')
  ok(
    (await page.inputValue('#opponent')) === 'Барком-Кажани' && (await page.inputValue('#teamId')) === 'new',
    'старий матч відкривається з ручною назвою',
  )
  for (const label of ['Команди', 'Зали', 'Турніри']) {
    ok((await page.locator(`.adm-nav-link:has-text("${label}")`).count()) === 1, `у меню адмінки є «${label}»`)
  }
  ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
})

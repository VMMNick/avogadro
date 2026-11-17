import { test, expect } from '@playwright/test'
import { noHorizontalScroll, ok, resetDb } from './helpers'

test.beforeEach(async ({ request }) => resetDb(request, 'demo'))

const stub = { status: 200, contentType: 'text/html', body: '<body></body>' }

test('телефон: анімований фон, поява блоків, мобільне меню', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
  await ctx.route(/google\.com/, (r) => r.fulfill(stub))
  const p = await ctx.newPage()
  const errors: string[] = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto('/')
  await p.waitForTimeout(1500)
  ok(await p.evaluate(() => document.documentElement.classList.contains('motion-ready')), 'анімації ввімкнено')
  ok((await p.locator('.bg-fx .bg-particles span').count()) === 15, 'частинки фону')
  ok(
    (await p.evaluate(() => getComputedStyle(document.querySelector('#contacts .section-title')!).opacity)) === '0',
    'контакти сховані до прокрутки',
  )

  // Чекаємо завершення анімацій меню, а не фіксований час — на повільній машині теж стабільно
  const teamLink = p.locator('#site-nav a[href="#team"]')
  await p.click('.nav-toggle')
  await expect(teamLink, 'меню відкрито').toBeVisible()
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  await expect(teamLink, 'Esc закриває меню').toBeHidden()
  await p.click('.nav-toggle')
  await expect(teamLink).toBeVisible()
  await p.waitForTimeout(500)
  await p.mouse.click(200, 760)
  await expect(teamLink, 'дотик поза меню закриває').toBeHidden()
  await p.click('.nav-toggle')
  await expect(teamLink).toBeVisible()
  await p.waitForTimeout(500)
  await p.click('#site-nav a[href="#team"]')
  await p.waitForTimeout(1500)
  ok(await p.evaluate(() => document.querySelector('#team .team-grid')!.classList.contains('is-in')), 'склад з’явився після переходу')
  ok(await p.evaluate(() => document.documentElement.hasAttribute('data-scrolled')), 'шапка стиснулась')

  for (let i = 0; i < 25; i++) {
    await p.mouse.wheel(0, 400)
    await p.waitForTimeout(120)
  }
  await p.waitForTimeout(1200)
  ok(
    await p.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every((e) => e.classList.contains('is-in'))),
    'усі блоки з’явилися',
  )
  ok(
    (await p.evaluate(() => getComputedStyle(document.querySelector('#contacts .section-title')!).opacity)) === '1',
    'контакти видно',
  )
  ok(await noHorizontalScroll(p), 'без горизонтального скролу')

  const r = await (await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage()
  await r.goto('/')
  await r.waitForTimeout(500)
  ok(
    (await r.evaluate(() => getComputedStyle(document.querySelector('#contacts .section-title')!).opacity)) === '1',
    '«Зменшити рух»: усе видно одразу',
  )
  ok((await r.evaluate(() => getComputedStyle(document.querySelector('.bg-particles')!).display)) === 'none', '«Зменшити рух»: без частинок')

  const d = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
  await d.goto('/')
  ok(await d.locator('#site-nav a[href="#team"]').isVisible(), 'комп’ютер: меню видно')
  ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
})

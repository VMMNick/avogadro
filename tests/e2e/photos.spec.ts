import { test, type Page } from '@playwright/test'
import { fixture, login, ok, resetDb } from './helpers'

test.beforeEach(async ({ request }) => resetDb(request))

const uploaded = (page: Page) =>
  page.evaluate(async () => {
    const f = (document.querySelector('input[name=photo]') as HTMLInputElement).files![0]
    if (!f) return null
    const bm = await createImageBitmap(f)
    return { type: f.type, size: f.size, w: bm.width, h: bm.height }
  })

test('фото будь-якого формату, стиснення й обрізка', async ({ page, browser }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await login(page)
  const cases: [string, 'crop' | 'skip'][] = [
    ['huge.jpg', 'crop'],
    ['rotated.jpg', 'skip'],
    ['wide.png', 'crop'],
    ['anim.gif', 'skip'],
    ['iphone.heic', 'crop'],
  ]
  for (const [file, mode] of cases) {
    await page.goto('/admin/players/new')
    await page.setInputFiles('input[type=file]:not([name])', fixture(file))
    await page.waitForSelector('dialog.adm-crop[open]', { timeout: 60_000 })
    await page.click(mode === 'crop' ? 'dialog >> text=Обрізати' : 'dialog >> text=Без обрізки')
    await page.waitForFunction(() => (document.querySelector('input[name=photo]') as HTMLInputElement).files!.length === 1, null, {
      timeout: 30_000,
    })
    const u = (await uploaded(page))!
    const ratioOk = mode === 'crop' ? Math.abs(u.w / u.h - 0.75) < 0.01 : true
    ok(u.type === 'image/webp' && Math.max(u.w, u.h) <= 1200 && ratioOk, `${file} (${mode}): ${u.type} ${u.w}x${u.h}`)
    if (file === 'rotated.jpg') ok(u.h > u.w, 'EXIF-поворот враховано (фото вертикальне)')
    if (file === 'huge.jpg') ok((await page.locator('text=Обрізати ще раз').count()) === 1, 'є кнопка «Обрізати ще раз»')
    if (file === 'iphone.heic') {
      await page.fill('#name', 'Тест HEIC')
      await page.selectOption('#role', 'libero')
      await page.click('main button[type=submit]')
      await page.waitForURL(/saved=1/)
      ok((await page.locator('td:has-text("Тест HEIC")').count()) === 1, 'гравця з HEIC-фото збережено')
    }
  }

  await page.goto('/admin/players/new')
  await page.setInputFiles('input[type=file]:not([name])', fixture('wide.png'))
  await page.waitForSelector('dialog[open]')
  await page.keyboard.press('Escape')
  ok(
    (await page.locator('dialog[open]').count()) === 0 &&
      (await page.evaluate(() => (document.querySelector('input[name=photo]') as HTMLInputElement).files!.length)) === 0,
    'Скасування (Esc) нічого не прикріплює',
  )
  await page.setInputFiles('input[type=file]:not([name])', fixture('not-image.txt'))
  await page.waitForSelector('.adm-error')
  ok(((await page.locator('.adm-error').textContent()) ?? '').includes('не схожий на фото'), 'не-фото: зрозуміла помилка')

  const m = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  await login(m)
  await m.goto('/admin/players/new')
  await m.setInputFiles('input[type=file]:not([name])', fixture('huge.jpg'))
  await m.waitForSelector('dialog[open]')
  ok(
    await m.evaluate(() => {
      const d = document.querySelector('dialog')!.getBoundingClientRect()
      return d.right <= innerWidth && d.bottom <= innerHeight
    }),
    'вікно обрізки вміщається на телефоні',
  )
  ok(errors.length === 0, `без помилок JS: ${errors.join('; ')}`)
})

import { test, expect } from '@playwright/test'
import { fixture, login, ok, resetDb } from './helpers'

test('логотип команди — круглий, з прозорим фоном', async ({ page }) => {
  await resetDb(page.request, 'demo')
  await login(page)
  await page.goto('/admin/teams/new')
  await page.fill('#name', 'Кругла Команда')
  await page.setInputFiles('input[type=file]:not([name])', fixture('wide.png'))
  const dialog = page.locator('dialog.adm-crop')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('h2')).toHaveText('Логотип у колі')
  ok((await dialog.locator('.reactEasyCrop_CropAreaRound').count()) === 1, 'кругла рамка')
  await dialog.locator('button:has-text("Готово")').click()
  await expect(page.locator('.adm-photo .adm-hint')).toContainText('Круглий логотип готовий')

  // Перевіряємо сам файл: квадрат, кути прозорі, центр — ні
  const pixels = await page.evaluate(async () => {
    const input = document.querySelector('input[name=photo]') as HTMLInputElement
    const bmp = await createImageBitmap(input.files![0])
    const c = document.createElement('canvas')
    c.width = bmp.width
    c.height = bmp.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    const a = (x: number, y: number) => ctx.getImageData(x, y, 1, 1).data[3]
    return { w: bmp.width, h: bmp.height, corner: a(1, 1), center: a(bmp.width >> 1, bmp.height >> 1) }
  })
  ok(pixels.w === pixels.h, `квадрат: ${pixels.w}×${pixels.h}`)
  ok(pixels.corner === 0, 'кут прозорий')
  ok(pixels.center > 0, 'центр заповнений')

  // «Вписати повністю» — теж коло
  await page.locator('button:has-text("Змінити коло")').click()
  await dialog.locator('button:has-text("Вписати повністю")').click()
  await expect(page.locator('.adm-photo .adm-hint')).toContainText('Круглий логотип готовий')

  await page.click('main button[type=submit]')
  await page.waitForURL(/\/admin\/teams\?saved=1/)
  const thumb = page.locator('tr', { hasText: 'Кругла Команда' }).locator('img.adm-logo-thumb')
  await expect(thumb).toHaveCount(1)
  const style = await thumb.evaluate((el) => {
    const s = getComputedStyle(el)
    return { radius: s.borderTopLeftRadius, bg: s.backgroundColor }
  })
  ok(style.radius === '50%', `круглий у списку: ${style.radius}`)
  ok(style.bg === 'rgba(0, 0, 0, 0)', `без підкладки: ${style.bg}`)
})

import { test } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, ok, resetDb } from './helpers'

test.beforeEach(async ({ request }) => resetDb(request))

test('паролі можна показати й приховати', async ({ page }) => {
  await page.goto('/admin/login')
  await page.fill('#email', ADMIN_EMAIL)
  await page.fill('#password', ADMIN_PASSWORD)
  ok((await page.getAttribute('#password', 'type')) === 'password', 'пароль приховано за замовчуванням')
  await page.click('button[aria-label="Показати пароль"]')
  ok((await page.getAttribute('#password', 'type')) === 'text', 'показати пароль на вході')
  await page.click('main button[type=submit]')
  await page.waitForURL(/\/admin$/)

  await page.goto('/admin/account')
  for (const id of ['current', 'next', 'confirm']) {
    ok((await page.getAttribute(`#${id}`, 'type')) === 'password', `${id}: приховано`)
  }
  await page.fill('#next', 'NewPassword456')
  await page.locator('#next ~ button').click()
  ok((await page.getAttribute('#next', 'type')) === 'text', 'новий пароль можна показати')
  ok((await page.getAttribute('#confirm', 'type')) === 'password', 'інші поля лишаються прихованими')
  await page.fill('#current', ADMIN_PASSWORD)
  await page.fill('#confirm', 'NewPassword456')
  await page.click('button:has-text("Змінити пароль")')
  await page.waitForSelector('text=Пароль змінено')
})

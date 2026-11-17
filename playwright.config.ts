import { defineConfig, devices } from '@playwright/test'

/**
 * Автотести сайту й адмін-панелі (браузер Chromium).
 * Перед запуском: `npm run build` з тестовою базою (див. README → «Автотести»).
 * Сервер запускається автоматично в режимі E2E_TEST_MODE=1 — лише він дозволяє тестам очищати базу.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100)

export default defineConfig({
  testDir: 'tests/e2e',
  // Тести працюють з однією базою — по черзі
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }], ['list']] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    // /api/health віддає 503 без підключеного сховища фото — для тестів це нормально
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { E2E_TEST_MODE: '1' },
  },
})

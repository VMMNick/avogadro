/**
 * Рядок підключення до Postgres. Інтеграція Neon у Vercel може називати змінну
 * по-різному (залежно від префікса, обраного при підключенні), тому шукаємо
 * стандартні варіанти, а також будь-яку змінну, що закінчується на _DATABASE_URL.
 */
export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const direct = env.DATABASE_URL || env.POSTGRES_URL || env.STORAGE_URL
  if (direct) return direct
  const key = Object.keys(env)
    .filter((k) => /(^|_)DATABASE_URL$/.test(k) && !k.endsWith('UNPOOLED') && env[k])
    .sort()[0]
  return key ? env[key] : undefined
}

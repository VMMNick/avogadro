import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

// Перший рубіж захисту адмінки: без валідного підпису сесії — на сторінку входу.
// Повна перевірка (чи існує адмін, чи не змінено пароль) — у requireAdmin().
export async function proxy(request: NextRequest) {
  // Сторінки входу й реєстрації відкриті завжди; чи вже залогінений — перевіряє сама сторінка через БД
  const path = request.nextUrl.pathname
  if (path === '/admin/login' || path === '/admin/register') return NextResponse.next()

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}

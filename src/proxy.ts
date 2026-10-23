import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

// Перший рубіж захисту адмінки: без валідного підпису сесії — на сторінку входу.
// Повна перевірка (чи існує адмін, чи не змінено пароль) — у requireAdmin().
export async function proxy(request: NextRequest) {
  // Сторінка входу відкрита завжди; чи вже залогінений — перевіряє сама сторінка через БД
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}

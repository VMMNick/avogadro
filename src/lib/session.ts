// Підпис і перевірка сесійного токена. Без залежностей від БД,
// тому використовується і в proxy.ts, і на сервері.
import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'avogadro_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 днів

export type SessionPayload = { sub: string; v: number }

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET має бути задано (мінімум 32 символи)')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ v: payload.v })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    if (typeof payload.sub !== 'string' || typeof payload.v !== 'number') return null
    return { sub: payload.sub, v: payload.v }
  } catch {
    return null
  }
}

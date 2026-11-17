'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, count, eq, gte, lt } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { applicationSchema, fieldErrors, formToObject, type FormState } from '@/lib/validation'
import { notifyTelegram } from '@/lib/telegram'

const MAX_PER_HOUR = 3
const MIN_FILL_MS = 3_000

/** Заявка «Хочу до команди» з публічного сайту. */
export async function applyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formToObject(formData, ['name', 'contact', 'experience', 'position', 'message', 'consent'])
  const values = { ...raw, consent: raw.consent }
  const lang = formData.get('lang') === 'en' ? 'en' : 'uk'
  const t = (uk: string, en: string) => (lang === 'en' ? en : uk)

  // Пастка для ботів: поле приховане від людей
  if (String(formData.get('website') ?? '') !== '') return { ok: true, message: t('Дякуємо!', 'Thank you!') }
  // Занадто швидке заповнення — теж бот (позначку ставить браузер при відкритті форми)
  const startedAt = Number(formData.get('t'))
  const elapsed = Date.now() - startedAt
  if (!Number.isFinite(startedAt) || elapsed < MIN_FILL_MS || elapsed > 24 * 3600_000) {
    return {
      message: t(
        'Не вдалося надіслати. Оновіть сторінку й спробуйте ще раз.',
        'Could not send. Please reload the page and try again.',
      ),
      values,
    }
  }

  const parsed = applicationSchema.safeParse(raw)
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error)
    if (lang === 'en') {
      for (const k of Object.keys(errors)) errors[k] = EN_ERRORS[k] ?? 'Please check this field'
    }
    return { errors, values }
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const key = `apply|${ip}`.slice(0, 200)
  const db = getDb()
  const since = new Date(Date.now() - 3600_000)
  await db.delete(schema.loginAttempts).where(lt(schema.loginAttempts.createdAt, new Date(Date.now() - 24 * 3600_000)))
  const [{ value: recent }] = await db
    .select({ value: count() })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.key, key), gte(schema.loginAttempts.createdAt, since)))
  if (recent >= MAX_PER_HOUR) {
    return {
      message: t(
        'Забагато заявок. Спробуйте пізніше або зателефонуйте нам.',
        'Too many requests. Please try later or call us.',
      ),
      values,
    }
  }
  await db.insert(schema.loginAttempts).values({ key })

  const { consent: _consent, ...data } = parsed.data
  void _consent
  await db.insert(schema.applications).values(data)
  revalidatePath('/admin', 'layout')

  await notifyTelegram(
    [
      '🏐 Нова заявка «Хочу до команди»',
      `Ім'я: ${data.name}`,
      `Контакт: ${data.contact}`,
      `Досвід: ${EXPERIENCE_UK[data.experience]}`,
      data.position ? `Амплуа: ${data.position}` : null,
      data.message ? `Повідомлення: ${data.message}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  return {
    ok: true,
    message: t(
      'Дякуємо! Заявку отримано — тренер зв’яжеться з вами.',
      'Thank you! We got your request — the coach will contact you.',
    ),
  }
}

const EXPERIENCE_UK = { beginner: 'новачок', amateur: 'грає для себе', team: 'грав(ла) у команді' } as const

const EN_ERRORS: Record<string, string> = {
  name: 'Please enter your name',
  contact: 'Please enter a phone, email or Telegram @username',
  experience: 'Please choose your experience',
  position: 'Please choose a position',
  message: 'Message is too long',
  consent: 'Please agree to data processing so we can contact you',
}

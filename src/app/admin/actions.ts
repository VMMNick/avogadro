'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, ne, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import {
  changePassword,
  endSession,
  getCurrentAdmin,
  hashPassword,
  login,
  requireAdmin,
} from '@/lib/auth'
import { deletePhoto, savePhoto, UploadError } from '@/lib/storage'
import {
  changePasswordSchema,
  fieldErrors,
  formToObject,
  matchSchema,
  newAdminSchema,
  playerSchema,
  settingsSchema,
  type FormState,
} from '@/lib/validation'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function refreshSite(...adminPaths: string[]) {
  revalidatePath('/')
  for (const p of adminPaths) revalidatePath(p)
}

function idFrom(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  return UUID_RE.test(id) ? id : null
}

// ---------- Вхід / вихід ----------

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { message: 'Вкажіть email і пароль.', values: { email } }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'

  let result
  try {
    result = await login(email, password, ip)
  } catch (err) {
    console.error('Помилка входу', err)
    return { message: 'Сервер тимчасово недоступний або не налаштований. Спробуйте пізніше.', values: { email } }
  }
  if (!result.ok) return { message: result.error, values: { email } }
  redirect('/admin')
}

export async function logoutAction() {
  await endSession()
  redirect('/admin/login')
}

// ---------- Гравці ----------

export async function savePlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['name', 'number', 'role'])
  const parsed = playerSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const id = idFrom(formData)
  const existing = id
    ? (await db.select().from(schema.players).where(eq(schema.players.id, id)).limit(1))[0]
    : undefined
  if (id && !existing) return { message: 'Гравця не знайдено — можливо, його вже видалили.', values: raw }

  let photoUrl = existing?.photoUrl ?? null
  const oldPhoto = photoUrl
  const file = formData.get('photo')
  const removePhoto = formData.get('removePhoto') === 'on'

  try {
    if (file instanceof File && file.size > 0) {
      photoUrl = await savePhoto(file, 'players')
    } else if (removePhoto) {
      photoUrl = null
    }
  } catch (err) {
    if (err instanceof UploadError) return { errors: { photo: err.message }, values: raw }
    console.error(err)
    return { errors: { photo: 'Не вдалося завантажити фото. Спробуйте ще раз.' }, values: raw }
  }

  const values = { ...parsed.data, photoUrl }
  try {
    if (existing) {
      await db.update(schema.players).set(values).where(eq(schema.players.id, existing.id))
    } else {
      await db.insert(schema.players).values(values)
    }
  } catch (err) {
    // Не лишаємо «осиротілих» файлів у сховищі
    if (photoUrl && photoUrl !== oldPhoto) await deletePhoto(photoUrl)
    throw err
  }
  if (oldPhoto && oldPhoto !== photoUrl) await deletePhoto(oldPhoto)

  refreshSite('/admin/players', '/admin')
  redirect('/admin/players?saved=1')
}

export async function deletePlayerAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  const [deleted] = await getDb()
    .delete(schema.players)
    .where(eq(schema.players.id, id))
    .returning({ photoUrl: schema.players.photoUrl })
  if (deleted) await deletePhoto(deleted.photoUrl)
  refreshSite('/admin/players', '/admin')
  redirect('/admin/players?deleted=1')
}

// ---------- Матчі ----------

export async function saveMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['opponent', 'startsAt', 'location', 'ourSets', 'theirSets'])
  const parsed = matchSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const id = idFrom(formData)
  if (id) {
    const updated = await db
      .update(schema.matches)
      .set(parsed.data)
      .where(eq(schema.matches.id, id))
      .returning({ id: schema.matches.id })
    if (!updated.length) return { message: 'Матч не знайдено — можливо, його вже видалили.', values: raw }
  } else {
    await db.insert(schema.matches).values(parsed.data)
  }

  refreshSite('/admin/matches', '/admin')
  redirect('/admin/matches?saved=1')
}

export async function deleteMatchAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  await getDb().delete(schema.matches).where(eq(schema.matches.id, id))
  refreshSite('/admin/matches', '/admin')
  redirect('/admin/matches?deleted=1')
}

// ---------- Налаштування сайту ----------

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, [
    'tagline',
    'about',
    'phone',
    'email',
    'address',
    'mapQuery',
    'instagram',
    'facebook',
    'telegram',
  ])
  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  await getDb()
    .insert(schema.settings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: schema.settings.id, set: parsed.data })

  refreshSite('/admin/settings')
  return { ok: true, message: 'Збережено. Зміни вже на сайті.' }
}

// ---------- Адміністратори ----------

export async function createAdminAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['name', 'email', 'password'])
  const parsed = newAdminSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const [exists] = await db
    .select({ id: schema.admins.id })
    .from(schema.admins)
    .where(sql`lower(${schema.admins.email}) = ${parsed.data.email}`)
    .limit(1)
  if (exists) return { errors: { email: 'Адміністратор з таким email уже існує' }, values: raw }

  await db.insert(schema.admins).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
  })
  revalidatePath('/admin/admins')
  return { ok: true, message: `Адміністратора ${parsed.data.email} додано.` }
}

export async function deleteAdminAction(formData: FormData) {
  const me = await requireAdmin()
  const id = idFrom(formData)
  if (!id || id === me.id) return // себе видалити не можна — щоб не лишитись без доступу
  await getDb()
    .delete(schema.admins)
    .where(and(eq(schema.admins.id, id), ne(schema.admins.id, me.id)))
  revalidatePath('/admin/admins')
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentAdmin()
  if (!me) redirect('/admin/login')
  const parsed = changePasswordSchema.safeParse(formToObject(formData, ['current', 'next', 'confirm']))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const result = await changePassword(me.id, parsed.data.current, parsed.data.next)
  if (!result.ok) return { errors: { current: result.error } }
  return { ok: true, message: 'Пароль змінено. Інші сесії завершено.' }
}

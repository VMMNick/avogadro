'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, ne, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { changePassword, endSession, getCurrentAdmin, hashPassword, login, register, requireAdmin } from '@/lib/auth'
import { deletePhoto, savePhoto, UploadError } from '@/lib/storage'
import {
  changePasswordSchema,
  fieldErrors,
  formToObject,
  matchSchema,
  newAdminSchema,
  parseSetScores,
  MAX_SETS,
  playerSchema,
  registerSchema,
  settingsSchema,
  achievementSchema,
  trainingSchema,
  standingsSchema,
  teamSchema,
  tournamentSchema,
  venueSchema,
  type FormState,
} from '@/lib/validation'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function refreshSite(...adminPaths: string[]) {
  // Уся публічна частина: головна (обидві мови), сторінки матчів, календарі
  revalidatePath('/', 'layout')
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

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formToObject(formData, ['name', 'email', 'password', 'confirm', 'code'])
  // Паролі й код не повертаємо у форму
  const values = { name: raw.name, email: raw.email }
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'

  let result
  try {
    result = await register(parsed.data, ip)
  } catch (err) {
    console.error('Помилка реєстрації', err)
    return { message: 'Сервер тимчасово недоступний або не налаштований. Спробуйте пізніше.', values }
  }
  if (!result.ok) {
    return result.field ? { errors: { [result.field]: result.error }, values } : { message: result.error, values }
  }
  revalidatePath('/admin/admins')
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

/** Значення випадаючого списку довідника: id запису, 'new' — ввести вручну, '' — не вказано. */
function directoryChoice(formData: FormData, name: string) {
  const v = String(formData.get(name) ?? '')
  return UUID_RE.test(v) ? v : v === 'new' ? 'new' : ''
}

type Db = ReturnType<typeof getDb>

/** Знаходить команду за назвою (без урахування регістру) або додає нову. */
async function findOrCreateTeam(db: Db, name: string): Promise<{ id: string; name: string }> {
  const [found] = await db
    .select({ id: schema.teams.id, name: schema.teams.name })
    .from(schema.teams)
    .where(sql`lower(${schema.teams.name}) = lower(${name})`)
    .limit(1)
  if (found) return found
  const [created] = await db
    .insert(schema.teams)
    .values({ name })
    .onConflictDoNothing()
    .returning({ id: schema.teams.id, name: schema.teams.name })
  return created ?? (await findOrCreateTeam(db, name))
}

async function findOrCreateVenue(db: Db, name: string): Promise<{ id: string; name: string }> {
  const [found] = await db
    .select({ id: schema.venues.id, name: schema.venues.name })
    .from(schema.venues)
    .where(sql`lower(${schema.venues.name}) = lower(${name})`)
    .limit(1)
  if (found) return found
  const [created] = await db
    .insert(schema.venues)
    .values({ name })
    .onConflictDoNothing()
    .returning({ id: schema.venues.id, name: schema.venues.name })
  return created ?? (await findOrCreateVenue(db, name))
}

async function findOrCreateTournament(db: Db, name: string): Promise<{ id: string; name: string }> {
  const [found] = await db
    .select({ id: schema.tournaments.id, name: schema.tournaments.name })
    .from(schema.tournaments)
    .where(sql`lower(${schema.tournaments.name}) = lower(${name})`)
    .limit(1)
  if (found) return found
  const [created] = await db
    .insert(schema.tournaments)
    .values({ name })
    .onConflictDoNothing()
    .returning({ id: schema.tournaments.id, name: schema.tournaments.name })
  return created ?? (await findOrCreateTournament(db, name))
}

export async function saveMatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['opponent', 'startsAt', 'location', 'ourSets', 'theirSets', 'kind'])
  const teamChoice = directoryChoice(formData, 'teamId')
  const venueChoice = directoryChoice(formData, 'venueId')
  const tournamentChoice = directoryChoice(formData, 'tournamentId')
  const tournamentName = String(formData.get('tournamentName') ?? '').trim()
  const saveTeam = formData.get('saveTeam') === 'on'
  const saveVenue = formData.get('saveVenue') === 'on'
  const lineupIds = [
    ...new Set(
      formData
        .getAll('lineup')
        .map(String)
        .filter((v) => UUID_RE.test(v)),
    ),
  ]
  const mvpRaw = String(formData.get('mvpPlayerId') ?? '')
  const mvpPlayerId = UUID_RE.test(mvpRaw) ? mvpRaw : null
  const setFields = Object.fromEntries(
    Array.from({ length: MAX_SETS }, (_, i) => [
      [`set${i + 1}our`, String(formData.get(`set${i + 1}our`) ?? '')],
      [`set${i + 1}their`, String(formData.get(`set${i + 1}their`) ?? '')],
    ]).flat(),
  )
  const values = {
    ...raw,
    ...setFields,
    lineup: lineupIds.join(','),
    mvpPlayerId: mvpPlayerId ?? '',
    teamId: teamChoice,
    venueId: venueChoice,
    tournamentId: tournamentChoice,
    tournamentName,
    saveTeam: saveTeam ? 'on' : '',
    saveVenue: saveVenue ? 'on' : '',
  }

  const db = getDb()
  // Обрано запис довідника — назву беремо з нього
  let teamId: string | null = null
  let venueId: string | null = null
  if (teamChoice && teamChoice !== 'new') {
    const [team] = await db.select().from(schema.teams).where(eq(schema.teams.id, teamChoice)).limit(1)
    if (!team) return { errors: { opponent: 'Цю команду вже видалили з довідника — оберіть іншу' }, values }
    raw.opponent = team.name
    teamId = team.id
  }
  if (venueChoice && venueChoice !== 'new') {
    const [venue] = await db.select().from(schema.venues).where(eq(schema.venues.id, venueChoice)).limit(1)
    if (!venue) return { errors: { location: 'Цей зал уже видалили з довідника — оберіть інший' }, values }
    raw.location = venue.name.slice(0, 120)
    venueId = venue.id
  } else if (!venueChoice) {
    raw.location = ''
  }

  let tournamentId: string | null = null
  if (tournamentChoice && tournamentChoice !== 'new') {
    const [tr] = await db.select().from(schema.tournaments).where(eq(schema.tournaments.id, tournamentChoice)).limit(1)
    if (!tr) return { errors: { tournamentName: 'Цей турнір уже видалили з довідника — оберіть інший' }, values }
    tournamentId = tr.id
  }

  // Очки сетів задано — загальний рахунок рахуємо з них
  const { sets, error: setsError } = parseSetScores(formData)
  if (setsError) return { errors: { sets: setsError }, values }
  if (sets.length) {
    raw.ourSets = String(sets.filter(([a, b]) => a > b).length)
    raw.theirSets = String(sets.filter(([a, b]) => a < b).length)
  }

  const parsed = matchSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values }
  // Склад і MVP — лише гравці, які ще існують
  const known = new Set((await db.select({ id: schema.players.id }).from(schema.players)).map((p) => p.id))
  const lineup = lineupIds.filter((pid) => known.has(pid))
  const mvp = mvpPlayerId && known.has(mvpPlayerId) ? mvpPlayerId : null
  if (mvp && lineup.length && !lineup.includes(mvp)) lineup.push(mvp) // MVP точно грав

  if (tournamentChoice === 'new') {
    if (tournamentName.length < 2 || tournamentName.length > 120) {
      return { errors: { tournamentName: 'Вкажіть назву турніру (2–120 символів)' }, values }
    }
    tournamentId = (await findOrCreateTournament(db, tournamentName)).id
  }

  // Нове значення, введене вручну, — за бажанням одразу в довідник
  if (teamChoice === 'new' && saveTeam) {
    const team = await findOrCreateTeam(db, parsed.data.opponent)
    teamId = team.id
    parsed.data.opponent = team.name
  }
  if (venueChoice === 'new' && saveVenue && parsed.data.location) {
    const venue = await findOrCreateVenue(db, parsed.data.location)
    venueId = venue.id
    parsed.data.location = venue.name.slice(0, 120)
  }
  const data = {
    ...parsed.data,
    teamId,
    venueId,
    tournamentId,
    setScores: sets.length ? sets : null,
    mvpPlayerId: mvp,
  }

  const id = idFrom(formData)
  let matchId: string
  if (id) {
    const updated = await db
      .update(schema.matches)
      .set(data)
      .where(eq(schema.matches.id, id))
      .returning({ id: schema.matches.id })
    if (!updated.length) return { message: 'Матч не знайдено — можливо, його вже видалили.', values }
    matchId = id
  } else {
    const [created] = await db.insert(schema.matches).values(data).returning({ id: schema.matches.id })
    matchId = created.id
  }
  await db.delete(schema.matchPlayers).where(eq(schema.matchPlayers.matchId, matchId))
  if (lineup.length) {
    await db.insert(schema.matchPlayers).values(lineup.map((playerId) => ({ matchId, playerId })))
  }

  refreshSite('/admin/matches', '/admin', '/admin/teams', '/admin/venues', '/admin/tournaments')
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

// ---------- Довідник команд ----------

export async function saveTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['name', 'city'])
  const parsed = teamSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const id = idFrom(formData)
  const [dup] = await db
    .select({ id: schema.teams.id })
    .from(schema.teams)
    .where(
      id
        ? and(sql`lower(${schema.teams.name}) = lower(${parsed.data.name})`, ne(schema.teams.id, id))
        : sql`lower(${schema.teams.name}) = lower(${parsed.data.name})`,
    )
    .limit(1)
  if (dup) return { errors: { name: 'Команда з такою назвою вже є в довіднику' }, values: raw }

  const existing = id ? (await db.select().from(schema.teams).where(eq(schema.teams.id, id)).limit(1))[0] : undefined
  if (id && !existing) return { message: 'Команду не знайдено — можливо, її вже видалили.', values: raw }

  // Логотип команди (необов'язково)
  let logoUrl = existing?.logoUrl ?? null
  const oldLogo = logoUrl
  const file = formData.get('photo')
  try {
    if (file instanceof File && file.size > 0) logoUrl = await savePhoto(file, 'teams')
    else if (formData.get('removePhoto') === 'on') logoUrl = null
  } catch (err) {
    if (err instanceof UploadError) return { errors: { photo: err.message }, values: raw }
    console.error(err)
    return { errors: { photo: 'Не вдалося завантажити логотип. Спробуйте ще раз.' }, values: raw }
  }

  const values = { ...parsed.data, logoUrl }
  try {
    if (existing) {
      await db.update(schema.teams).set(values).where(eq(schema.teams.id, existing.id))
      // Перейменування — оновлюємо назву і в матчах з цією командою
      await db.update(schema.matches).set({ opponent: parsed.data.name }).where(eq(schema.matches.teamId, existing.id))
    } else {
      await db.insert(schema.teams).values(values)
    }
  } catch (err) {
    if (logoUrl && logoUrl !== oldLogo) await deletePhoto(logoUrl)
    throw err
  }
  if (oldLogo && oldLogo !== logoUrl) await deletePhoto(oldLogo)
  refreshSite('/admin/teams', '/admin/matches')
  redirect('/admin/teams?saved=1')
}

export async function deleteTeamAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  // Матчі лишаються — з назвою суперника, але без зв'язку з довідником
  const [deleted] = await getDb()
    .delete(schema.teams)
    .where(eq(schema.teams.id, id))
    .returning({ logoUrl: schema.teams.logoUrl })
  if (deleted) await deletePhoto(deleted.logoUrl)
  refreshSite('/admin/teams', '/admin/matches')
  redirect('/admin/teams?deleted=1')
}

// ---------- Довідник залів ----------

export async function saveVenueAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['name', 'address', 'mapQuery'])
  const parsed = venueSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const id = idFrom(formData)
  const [dup] = await db
    .select({ id: schema.venues.id })
    .from(schema.venues)
    .where(
      id
        ? and(sql`lower(${schema.venues.name}) = lower(${parsed.data.name})`, ne(schema.venues.id, id))
        : sql`lower(${schema.venues.name}) = lower(${parsed.data.name})`,
    )
    .limit(1)
  if (dup) return { errors: { name: 'Зал з такою назвою вже є в довіднику' }, values: raw }

  if (id) {
    const updated = await db
      .update(schema.venues)
      .set(parsed.data)
      .where(eq(schema.venues.id, id))
      .returning({ id: schema.venues.id })
    if (!updated.length) return { message: 'Зал не знайдено — можливо, його вже видалили.', values: raw }
    await db
      .update(schema.matches)
      .set({ location: parsed.data.name.slice(0, 120) })
      .where(eq(schema.matches.venueId, id))
  } else {
    await db.insert(schema.venues).values(parsed.data)
  }
  refreshSite('/admin/venues', '/admin/matches')
  redirect('/admin/venues?saved=1')
}

export async function deleteVenueAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  await getDb().delete(schema.venues).where(eq(schema.venues.id, id))
  refreshSite('/admin/venues', '/admin/matches')
  redirect('/admin/venues?deleted=1')
}

// ---------- Довідник турнірів ----------

export async function saveTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['name'])
  const parsed = tournamentSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const id = idFrom(formData)
  const same = sql`lower(${schema.tournaments.name}) = lower(${parsed.data.name})`
  const [dup] = await db
    .select({ id: schema.tournaments.id })
    .from(schema.tournaments)
    .where(id ? and(same, ne(schema.tournaments.id, id)) : same)
    .limit(1)
  if (dup) return { errors: { name: 'Турнір з такою назвою вже є в довіднику' }, values: raw }

  if (id) {
    const updated = await db
      .update(schema.tournaments)
      .set(parsed.data)
      .where(eq(schema.tournaments.id, id))
      .returning({ id: schema.tournaments.id })
    if (!updated.length) return { message: 'Турнір не знайдено — можливо, його вже видалили.', values: raw }
  } else {
    await db.insert(schema.tournaments).values(parsed.data)
  }
  refreshSite('/admin/tournaments', '/admin/matches')
  redirect('/admin/tournaments?saved=1')
}

export async function saveStandingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return { message: 'Турнір не знайдено.' }
  const json = String(formData.get('standings') ?? '[]')
  let rows: unknown
  try {
    rows = JSON.parse(json)
  } catch {
    return {
      message: 'Не вдалося прочитати таблицю. Оновіть сторінку й спробуйте ще раз.',
      values: { standings: json },
    }
  }
  const parsed = standingsSchema.safeParse(rows)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const row = typeof issue.path[0] === 'number' ? `Рядок ${issue.path[0] + 1}: ` : ''
    return { message: `${row}${issue.message}`, values: { standings: json } }
  }
  const updated = await getDb()
    .update(schema.tournaments)
    .set({
      standings: parsed.data.length ? parsed.data : null,
      standingsUpdatedAt: parsed.data.length ? new Date() : null,
    })
    .where(eq(schema.tournaments.id, id))
    .returning({ id: schema.tournaments.id })
  if (!updated.length) return { message: 'Турнір не знайдено — можливо, його вже видалили.' }
  refreshSite('/admin/tournaments', `/admin/tournaments/${id}`)
  return {
    ok: true,
    message: parsed.data.length ? 'Таблицю збережено. Вона вже на сайті.' : 'Таблицю очищено.',
    values: { standings: JSON.stringify(parsed.data) },
  }
}

export async function deleteTournamentAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  // Матчі лишаються, просто без турніру
  await getDb().delete(schema.tournaments).where(eq(schema.tournaments.id, id))
  refreshSite('/admin/tournaments', '/admin/matches')
  redirect('/admin/tournaments?deleted=1')
}

// ---------- Досягнення ----------

export async function saveAchievementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['season', 'title', 'titleEn', 'kind', 'note'])
  const parsed = achievementSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }
  const db = getDb()
  const id = idFrom(formData)
  if (id) {
    const updated = await db
      .update(schema.achievements)
      .set(parsed.data)
      .where(eq(schema.achievements.id, id))
      .returning({ id: schema.achievements.id })
    if (!updated.length) return { message: 'Запис не знайдено — можливо, його вже видалили.', values: raw }
  } else {
    await db.insert(schema.achievements).values(parsed.data)
  }
  refreshSite('/admin/achievements')
  redirect('/admin/achievements?saved=1')
}

export async function deleteAchievementAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  await getDb().delete(schema.achievements).where(eq(schema.achievements.id, id))
  refreshSite('/admin/achievements')
  redirect('/admin/achievements?deleted=1')
}

// ---------- Розклад тренувань ----------

export async function saveTrainingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = formToObject(formData, ['weekday', 'startTime', 'endTime', 'location', 'note'])
  const venueChoice = directoryChoice(formData, 'venueId')
  const values = { ...raw, venueId: venueChoice }
  const db = getDb()
  let venueId: string | null = null
  if (venueChoice && venueChoice !== 'new') {
    const [venue] = await db.select().from(schema.venues).where(eq(schema.venues.id, venueChoice)).limit(1)
    if (!venue) return { errors: { location: 'Цей зал уже видалили з довідника — оберіть інший' }, values }
    raw.location = venue.name.slice(0, 120)
    venueId = venue.id
  } else if (!venueChoice) {
    raw.location = ''
  }
  const parsed = trainingSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values }
  if (venueChoice === 'new' && formData.get('saveVenue') === 'on' && parsed.data.location) {
    const venue = await findOrCreateVenue(db, parsed.data.location)
    venueId = venue.id
  }
  const data = { ...parsed.data, venueId }
  const id = idFrom(formData)
  if (id) {
    const updated = await db
      .update(schema.trainings)
      .set(data)
      .where(eq(schema.trainings.id, id))
      .returning({ id: schema.trainings.id })
    if (!updated.length) return { message: 'Тренування не знайдено — можливо, його вже видалили.', values }
  } else {
    await db.insert(schema.trainings).values(data)
  }
  refreshSite('/admin/trainings')
  redirect('/admin/trainings?saved=1')
}

export async function deleteTrainingAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  await getDb().delete(schema.trainings).where(eq(schema.trainings.id, id))
  refreshSite('/admin/trainings')
  redirect('/admin/trainings?deleted=1')
}

// ---------- Заявки «Хочу до команди» ----------

export async function toggleApplicationAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  const processed = formData.get('processed') === '1'
  await getDb().update(schema.applications).set({ processed }).where(eq(schema.applications.id, id))
  revalidatePath('/admin', 'layout')
}

export async function deleteApplicationAction(formData: FormData) {
  await requireAdmin()
  const id = idFrom(formData)
  if (!id) return
  await getDb().delete(schema.applications).where(eq(schema.applications.id, id))
  revalidatePath('/admin', 'layout')
  redirect('/admin/applications?deleted=1')
}

// ---------- Налаштування сайту ----------

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin({ role: 'admin' })
  const raw = formToObject(formData, [
    'tagline',
    'about',
    'taglineEn',
    'aboutEn',
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
  await requireAdmin({ role: 'admin' })
  const raw = formToObject(formData, ['name', 'email', 'password', 'role'])
  const parsed = newAdminSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw }

  const db = getDb()
  const [exists] = await db
    .select({ id: schema.admins.id })
    .from(schema.admins)
    .where(sql`lower(${schema.admins.email}) = ${parsed.data.email}`)
    .limit(1)
  if (exists) return { errors: { email: 'Адміністратор з таким email уже існує' }, values: raw }

  const role = formData.get('role') === 'admin' ? 'admin' : 'editor'
  await db.insert(schema.admins).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role,
  })
  revalidatePath('/admin/admins')
  return { ok: true, message: `Адміністратора ${parsed.data.email} додано.` }
}

export async function deleteAdminAction(formData: FormData) {
  const me = await requireAdmin({ role: 'admin' })
  const id = idFrom(formData)
  if (!id || id === me.id) return // себе видалити не можна — щоб не лишитись без доступу
  await getDb()
    .delete(schema.admins)
    .where(and(eq(schema.admins.id, id), ne(schema.admins.id, me.id)))
  revalidatePath('/admin/admins')
}

/** Змінити роль іншого адміністратора (свою — не можна, щоб не лишитися без доступу). */
export async function setAdminRoleAction(formData: FormData) {
  const me = await requireAdmin({ role: 'admin' })
  const id = idFrom(formData)
  const role = formData.get('role') === 'admin' ? 'admin' : 'editor'
  if (!id || id === me.id) return
  await getDb().update(schema.admins).set({ role }).where(eq(schema.admins.id, id))
  revalidatePath('/admin/admins')
  redirect('/admin/admins?saved=1')
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

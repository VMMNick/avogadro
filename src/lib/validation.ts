import { z } from 'zod'
import { MATCH_KINDS, PLAYER_ROLES } from '@/db/schema'
import { fromKyivInputValue } from './format'
import { normalizeMapQuery } from './maps'

const optionalText = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\r\n?/g, '\n'))
    // Браузер надсилає переноси як \r\n — нормалізуємо до \n
    .pipe(z.string().trim().max(max, `Максимум ${max} символів`))
    .transform((v) => (v === '' ? null : v))

const optionalHttpsUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), 'Посилання має починатися з https://')

const mapQueryField = optionalText(200).refine(
  (v) => v === null || normalizeMapQuery(v) !== null,
  'Це посилання не можна показати на карті. Вставте адресу або координати: у Google Maps натисніть правою кнопкою на зал і скопіюйте координати.',
)

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'Вкажіть назву команди (мінімум 2 символи)').max(80, 'Максимум 80 символів'),
  city: optionalText(80),
})

export const venueSchema = z.object({
  name: z.string().trim().min(2, 'Вкажіть назву залу (мінімум 2 символи)').max(120, 'Максимум 120 символів'),
  address: optionalText(200),
  mapQuery: mapQueryField,
})

export const tournamentSchema = z.object({
  name: z.string().trim().min(2, 'Вкажіть назву турніру (мінімум 2 символи)').max(120, 'Максимум 120 символів'),
})

export const playerSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я (мінімум 2 символи)").max(80, 'Максимум 80 символів'),
  number: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return null
      const n = Number(v)
      if (!Number.isInteger(n) || n < 0 || n > 99) {
        ctx.addIssue({ code: 'custom', message: 'Номер — ціле число від 0 до 99' })
        return z.NEVER
      }
      return n
    }),
  role: z.enum(PLAYER_ROLES, { message: 'Оберіть амплуа' }),
})

export const matchSchema = z
  .object({
    opponent: z.string().trim().min(1, 'Вкажіть суперника').max(80, 'Максимум 80 символів'),
    startsAt: z.string().transform((v, ctx) => {
      const d = fromKyivInputValue(v)
      if (!d) {
        ctx.addIssue({ code: 'custom', message: 'Вкажіть дату та час' })
        return z.NEVER
      }
      return d
    }),
    location: optionalText(120),
    ourSets: z.string().trim(),
    theirSets: z.string().trim(),
    kind: z.enum(MATCH_KINDS, { message: 'Оберіть тип гри' }),
  })
  .transform((v, ctx) => {
    const parse = (s: string) => (s === '' ? null : Number(s))
    const our = parse(v.ourSets)
    const their = parse(v.theirSets)
    if ((our === null) !== (their === null)) {
      ctx.addIssue({ code: 'custom', path: ['ourSets'], message: 'Заповніть обидва поля рахунку або жодного' })
      return z.NEVER
    }
    const ok = (n: number | null) => n === null || (Number.isInteger(n) && n >= 0 && n <= 3)
    if (!ok(our) || !ok(their)) {
      ctx.addIssue({ code: 'custom', path: ['ourSets'], message: 'Рахунок у сетах — від 0 до 3' })
      return z.NEVER
    }
    if (our !== null && their !== null && our !== 3 && their !== 3) {
      ctx.addIssue({ code: 'custom', path: ['ourSets'], message: 'Одна з команд має виграти 3 сети' })
      return z.NEVER
    }
    if (our === 3 && their === 3) {
      ctx.addIssue({ code: 'custom', path: ['ourSets'], message: 'Обидві команди не можуть виграти 3 сети' })
      return z.NEVER
    }
    return { opponent: v.opponent, startsAt: v.startsAt, location: v.location, ourSets: our, theirSets: their, kind: v.kind }
  })

export const settingsSchema = z.object({
  tagline: optionalText(160),
  about: optionalText(5000),
  taglineEn: optionalText(160),
  aboutEn: optionalText(5000),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .refine((v) => v === null || z.email().safeParse(v).success, 'Невірний email'),
  address: optionalText(200),
  mapQuery: mapQueryField,
  instagram: optionalHttpsUrl,
  facebook: optionalHttpsUrl,
  telegram: optionalHttpsUrl,
})

export const passwordSchema = z
  .string()
  .min(10, 'Пароль — мінімум 10 символів')
  .max(128, 'Пароль задовгий')

export const newAdminSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я").max(80),
  email: z.email('Невірний email').trim().toLowerCase().max(120),
  password: passwordSchema,
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Вкажіть ім'я").max(80),
    email: z.email('Невірний email').trim().toLowerCase().max(120),
    password: passwordSchema,
    confirm: z.string(),
    code: z.string().trim().min(1, 'Вкажіть код запрошення').max(200),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Паролі не збігаються' })

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Вкажіть поточний пароль'),
    next: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'Паролі не збігаються' })

export type FieldErrors = Record<string, string>

export type FormState = {
  ok?: boolean
  message?: string
  errors?: FieldErrors
  /** Введені значення — щоб форма не очищалась після помилки валідації */
  values?: Record<string, string>
}

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

export function formToObject(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? '')]))
}

// ---------- Рахунок по сетах ----------

export const MAX_SETS = 5

/**
 * Читає очки сетів з полів set1our / set1their … set5their.
 * Порожні рядки в кінці ігноруються. Повертає сети або помилку для поля «sets».
 */
export function parseSetScores(formData: FormData): { sets: [number, number][]; error?: string } {
  const rows: [string, string][] = []
  for (let i = 1; i <= MAX_SETS; i++) {
    rows.push([String(formData.get(`set${i}our`) ?? '').trim(), String(formData.get(`set${i}their`) ?? '').trim()])
  }
  while (rows.length && rows.at(-1)![0] === '' && rows.at(-1)![1] === '') rows.pop()
  const sets: [number, number][] = []
  for (const [i, [a, b]] of rows.entries()) {
    if (a === '' || b === '') return { sets: [], error: `Сет ${i + 1}: заповніть очки обох команд (або залиште сет порожнім)` }
    const our = Number(a)
    const their = Number(b)
    if (![our, their].every((n) => Number.isInteger(n) && n >= 0 && n <= 99)) {
      return { sets: [], error: `Сет ${i + 1}: очки — цілі числа від 0 до 99` }
    }
    if (our === their) return { sets: [], error: `Сет ${i + 1}: у сеті не буває нічиєї` }
    sets.push([our, their])
  }
  // Гра закінчується, щойно хтось виграв 3 сети
  let w = 0
  let l = 0
  for (const [i, [our, their]] of sets.entries()) {
    if (w === 3 || l === 3) return { sets: [], error: `Сет ${i + 1} зайвий: гра вже закінчилась на 3 виграних сетах` }
    if (our > their) w++
    else l++
  }
  if (sets.length && w !== 3 && l !== 3) {
    return { sets: [], error: 'За сетами ніхто не виграв 3 сети — додайте решту сетів' }
  }
  return { sets }
}

// ---------- Турнірна таблиця ----------

const count = z.number().int('Ціле число').min(0, 'Не менше 0').max(999, 'Не більше 999')

export const standingRowSchema = z
  .object({
    teamId: z.string().uuid().nullable(),
    us: z.boolean(),
    name: z.string().trim().min(1, 'Вкажіть команду').max(80, 'Максимум 80 символів'),
    played: count,
    wins: count,
    losses: count,
    setsFor: count,
    setsAgainst: count,
    points: count,
  })
  .refine((r) => r.wins + r.losses === r.played, {
    message: 'Перемоги + поразки мають дорівнювати кількості ігор',
    path: ['played'],
  })

export const standingsSchema = z
  .array(standingRowSchema)
  .max(30, 'Не більше 30 команд')
  .refine((rows) => rows.filter((r) => r.us).length <= 1, 'Рядок «Авогадро» може бути лише один')

/** Очки за матч за правилами FIVB: 3:0 і 3:1 — 3, 3:2 — 2, 2:3 — 1, поразка 0:3 / 1:3 — 0. */
export function fivbPoints(our: number, their: number) {
  if (our === 3) return their === 2 ? 2 : 3
  return our === 2 ? 1 : 0
}

import { z } from 'zod'
import { PLAYER_ROLES } from '@/db/schema'
import { fromKyivInputValue } from './format'

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
    return { opponent: v.opponent, startsAt: v.startsAt, location: v.location, ourSets: our, theirSets: their }
  })

export const settingsSchema = z.object({
  tagline: optionalText(160),
  about: optionalText(5000),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .refine((v) => v === null || z.email().safeParse(v).success, 'Невірний email'),
  address: optionalText(200),
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

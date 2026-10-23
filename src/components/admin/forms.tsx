'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  changePasswordAction,
  createAdminAction,
  loginAction,
  saveMatchAction,
  savePlayerAction,
  saveSettingsAction,
} from '@/app/admin/actions'
import { PLAYER_ROLES } from '@/db/schema'
import { ROLE_LABELS } from '@/lib/constants'
import type { FormState } from '@/lib/validation'
import { Field, FormMessage, inputProps, PasswordInput, SubmitButton } from './ui'
import { PhotoInput } from './PhotoInput'

const initial: FormState = {}

/** Значення поля: після помилки — те, що ввів користувач, інакше — збережене. */
const pick = (state: FormState, name: string, fallback: string | number | null | undefined) =>
  state.values?.[name] ?? (fallback == null ? '' : String(fallback))

/** Ключ форми: після відповіді сервера форма перемонтовується з актуальними значеннями
 *  (React 19 скидає форму після action, а select інакше повертався б до початкового значення). */
const formKey = (state: FormState) => JSON.stringify([state.values ?? null, state.ok ?? null, state.message ?? null])

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial)
  return (
    <form action={action} className="adm-form" key={formKey(state)}>
      <FormMessage state={state} />
      <Field name="email" label="Email">
        <input className="adm-input" type="email" autoComplete="username" required defaultValue={pick(state, 'email', '')} {...inputProps('email', state)} />
      </Field>
      <Field name="password" label="Пароль">
        <PasswordInput autoComplete="current-password" required {...inputProps('password', state)} />
      </Field>
      <SubmitButton pendingText="Входжу…">Увійти</SubmitButton>
    </form>
  )
}

export type PlayerFormValues = {
  id?: string
  name: string
  number: number | null
  role: string
  photoUrl: string | null
}

export function PlayerForm({ player }: { player?: PlayerFormValues }) {
  const [state, action] = useActionState(savePlayerAction, initial)
  const e = state.errors ?? {}
  return (
    <form action={action} className="adm-form adm-card" key={formKey(state)}>
      {player?.id && <input type="hidden" name="id" value={player.id} />}
      <FormMessage state={state} />
      <div className="adm-form-grid">
        <Field name="name" label="ПІБ / Ім'я" error={e.name}>
          <input className="adm-input" defaultValue={pick(state, 'name', player?.name)} required maxLength={80} {...inputProps('name', state)} />
        </Field>
        <Field name="number" label="Ігровий номер" error={e.number} hint="Для тренерського штабу можна не вказувати">
          <input
            className="adm-input"
            type="number"
            min={0}
            max={99}
            step={1}
            inputMode="numeric"
            defaultValue={pick(state, 'number', player?.number)}
            {...inputProps('number', state)}
          />
        </Field>
        <Field name="role" label="Амплуа" error={e.role}>
          <select className="adm-select" defaultValue={pick(state, 'role', player?.role)} required {...inputProps('role', state)}>
            <option value="" disabled>
              Оберіть…
            </option>
            {PLAYER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <PhotoInput current={player?.photoUrl ?? null} error={e.photo} />
      </div>
      <div className="adm-actions">
        <SubmitButton>{player?.id ? 'Зберегти зміни' : 'Додати гравця'}</SubmitButton>
        <Link href="/admin/players" className="adm-btn">
          Скасувати
        </Link>
      </div>
    </form>
  )
}

export type MatchFormValues = {
  id?: string
  opponent: string
  startsAt: string // значення для datetime-local у київському часі
  location: string | null
  ourSets: number | null
  theirSets: number | null
  kind: 'official' | 'friendly'
}

export function MatchForm({
  match,
  initialKind = 'official',
}: {
  match?: MatchFormValues
  initialKind?: 'official' | 'friendly'
}) {
  const [state, action] = useActionState(saveMatchAction, initial)
  const e = state.errors ?? {}
  const kind = pick(state, 'kind', match?.kind ?? initialKind)
  return (
    <form action={action} className="adm-form adm-card" key={formKey(state)}>
      {match?.id && <input type="hidden" name="id" value={match.id} />}
      <FormMessage state={state} />
      <div className="adm-form-grid">
        <fieldset className="adm-field is-wide adm-segment">
          <legend className="adm-label">Тип гри</legend>
          <div className="adm-segment-options">
            <label>
              <input type="radio" name="kind" value="official" defaultChecked={kind !== 'friendly'} />
              <span>Офіційний матч</span>
            </label>
            <label>
              <input type="radio" name="kind" value="friendly" defaultChecked={kind === 'friendly'} />
              <span>Товариська гра</span>
            </label>
          </div>
          {e.kind && (
            <span className="adm-error" role="alert">
              {e.kind}
            </span>
          )}
        </fieldset>
        <Field name="opponent" label="Суперник" error={e.opponent}>
          <input className="adm-input" defaultValue={pick(state, 'opponent', match?.opponent)} required maxLength={80} {...inputProps('opponent', state)} />
        </Field>
        <Field name="startsAt" label="Дата та час (за Києвом)" error={e.startsAt}>
          <input
            className="adm-input"
            type="datetime-local"
            step={300}
            defaultValue={pick(state, 'startsAt', match?.startsAt)}
            required
            {...inputProps('startsAt', state)}
          />
        </Field>
        <Field name="location" label="Місце проведення / Зал" error={e.location} wide>
          <input className="adm-input" defaultValue={pick(state, 'location', match?.location)} maxLength={120} {...inputProps('location', state)} />
        </Field>
        <div className="adm-field is-wide">
          <span className="adm-label">Рахунок за сетами (після гри)</span>
          <div className="adm-score">
            <input
              className="adm-input"
              type="number"
              min={0}
              max={3}
              name="ourSets"
              aria-label="Сети Авогадро"
              placeholder="Авогадро"
              defaultValue={pick(state, 'ourSets', match?.ourSets)}
              aria-invalid={e.ourSets ? true : undefined}
            />
            <span>:</span>
            <input
              className="adm-input"
              type="number"
              min={0}
              max={3}
              name="theirSets"
              aria-label="Сети суперника"
              placeholder="Суперник"
              defaultValue={pick(state, 'theirSets', match?.theirSets)}
              aria-invalid={e.ourSets ? true : undefined}
            />
          </div>
          {e.ourSets ? (
            <span className="adm-error" role="alert">
              {e.ourSets}
            </span>
          ) : (
            <span className="adm-hint">Залиште порожнім, поки гру не зіграно. Спершу — сети «Авогадро».</span>
          )}
        </div>
      </div>
      <div className="adm-actions">
        <SubmitButton>{match?.id ? 'Зберегти зміни' : initialKind === 'friendly' ? 'Додати гру' : 'Додати матч'}</SubmitButton>
        <Link href="/admin/matches" className="adm-btn">
          Скасувати
        </Link>
      </div>
    </form>
  )
}

export type SettingsFormValues = {
  tagline: string | null
  about: string | null
  phone: string | null
  email: string | null
  address: string | null
  mapQuery: string | null
  instagram: string | null
  facebook: string | null
  telegram: string | null
}

export function SettingsForm({ settings }: { settings: SettingsFormValues }) {
  const [state, action] = useActionState(saveSettingsAction, initial)
  const e = state.errors ?? {}
  const text = (name: keyof SettingsFormValues, label: string, opts: { hint?: string; type?: string; wide?: boolean; max?: number; placeholder?: string } = {}) => (
    <Field name={name} label={label} error={e[name]} hint={opts.hint} wide={opts.wide}>
      <input
        className="adm-input"
        type={opts.type ?? 'text'}
        defaultValue={pick(state, name, settings[name])}
        maxLength={opts.max}
        placeholder={opts.placeholder}
        {...inputProps(name, state)}
      />
    </Field>
  )
  return (
    <form action={action} className="adm-form" key={formKey(state)}>
      <FormMessage state={state} />
      <section className="adm-card adm-form">
        <h2>Головний екран і «Про клуб»</h2>
        {text('tagline', 'Слоган під заголовком', { wide: true, max: 160 })}
        <Field name="about" label="Текст «Про клуб»" error={e.about} hint="Абзаци розділяйте порожнім рядком">
          <textarea className="adm-textarea" defaultValue={pick(state, 'about', settings.about)} maxLength={5000} {...inputProps('about', state)} />
        </Field>
      </section>
      <section className="adm-card adm-form">
        <h2>Контакти</h2>
        <div className="adm-form-grid">
          {text('phone', 'Телефон', { type: 'tel', max: 40, placeholder: '+380 …' })}
          {text('email', 'Email', { type: 'email', max: 120 })}
          {text('address', 'Адреса / Зал', { wide: true, max: 200, placeholder: 'СК «Юність», вул. Прикладна, 1, Київ' })}
          {text('mapQuery', 'Місце на карті', {
            wide: true,
            max: 200,
            placeholder: 'Порожньо — карта за полем «Адреса / Зал»',
            hint: 'Адреса, назва залу або координати (50.4501, 30.5234). Можна вставити повне посилання Google Maps з «@координатами». Короткі посилання maps.app.goo.gl не підходять.',
          })}
          {text('instagram', 'Instagram', { type: 'url', placeholder: 'https://instagram.com/…' })}
          {text('facebook', 'Facebook', { type: 'url', placeholder: 'https://facebook.com/…' })}
          {text('telegram', 'Telegram', { type: 'url', placeholder: 'https://t.me/…' })}
        </div>
      </section>
      <div className="adm-actions">
        <SubmitButton>Зберегти</SubmitButton>
      </div>
    </form>
  )
}

export function NewAdminForm() {
  const [state, action] = useActionState(createAdminAction, initial)
  const e = state.errors ?? {}
  return (
    <form action={action} className="adm-form" key={formKey(state)}>
      <FormMessage state={state} />
      <div className="adm-form-grid">
        <Field name="name" label="Ім'я" error={e.name}>
          <input className="adm-input" required maxLength={80} defaultValue={pick(state, 'name', '')} {...inputProps('name', state)} />
        </Field>
        <Field name="email" label="Email" error={e.email}>
          <input className="adm-input" type="email" required autoComplete="off" defaultValue={pick(state, 'email', '')} {...inputProps('email', state)} />
        </Field>
        <Field name="password" label="Тимчасовий пароль" error={e.password} hint="Мінімум 10 символів. Передайте його особисто." wide>
          <PasswordInput required minLength={10} autoComplete="new-password" {...inputProps('password', state)} />
        </Field>
      </div>
      <div className="adm-actions">
        <SubmitButton pendingText="Додаю…">Додати адміністратора</SubmitButton>
      </div>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initial)
  const e = state.errors ?? {}
  return (
    <form action={action} className="adm-form" key={formKey(state)}>
      <FormMessage state={state} />
      <div className="adm-form-grid">
        <Field name="current" label="Поточний пароль" error={e.current} wide>
          <PasswordInput required autoComplete="current-password" {...inputProps('current', state)} />
        </Field>
        <Field name="next" label="Новий пароль" error={e.next} hint="Мінімум 10 символів">
          <PasswordInput required minLength={10} autoComplete="new-password" {...inputProps('next', state)} />
        </Field>
        <Field name="confirm" label="Повторіть новий пароль" error={e.confirm}>
          <PasswordInput required autoComplete="new-password" {...inputProps('confirm', state)} />
        </Field>
      </div>
      <div className="adm-actions">
        <SubmitButton pendingText="Змінюю…">Змінити пароль</SubmitButton>
      </div>
    </form>
  )
}

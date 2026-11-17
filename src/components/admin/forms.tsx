'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  changePasswordAction,
  createAdminAction,
  loginAction,
  registerAction,
  saveMatchAction,
  savePlayerAction,
  saveSettingsAction,
  saveTeamAction,
  saveVenueAction,
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

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial)
  const e = state.errors ?? {}
  return (
    <form action={action} className="adm-form" key={formKey(state)}>
      <FormMessage state={state} />
      <Field name="name" label="Ім'я" error={e.name}>
        <input className="adm-input" required maxLength={80} autoComplete="name" defaultValue={pick(state, 'name', '')} {...inputProps('name', state)} />
      </Field>
      <Field name="email" label="Email" error={e.email}>
        <input className="adm-input" type="email" required autoComplete="username" defaultValue={pick(state, 'email', '')} {...inputProps('email', state)} />
      </Field>
      <Field name="password" label="Пароль" error={e.password} hint="Мінімум 10 символів">
        <PasswordInput required minLength={10} autoComplete="new-password" {...inputProps('password', state)} />
      </Field>
      <Field name="confirm" label="Повторіть пароль" error={e.confirm}>
        <PasswordInput required autoComplete="new-password" {...inputProps('confirm', state)} />
      </Field>
      <Field name="code" label="Код запрошення" error={e.code} hint="Отримайте його в адміністратора клубу">
        <PasswordInput required autoComplete="off" {...inputProps('code', state)} />
      </Field>
      <SubmitButton pendingText="Реєструю…">Зареєструватися</SubmitButton>
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
  teamId: string | null
  venueId: string | null
}

export type DirectoryOption = { id: string; label: string }

/** Вибір із довідника або введення вручну (з галочкою «додати до довідника»). */
function DirectoryPicker({
  label,
  selectName,
  textName,
  saveName,
  options,
  initialChoice,
  initialText,
  placeholder,
  newLabel,
  saveLabel,
  manageHref,
  error,
  maxLength,
  required,
  initialSave,
}: {
  label: string
  selectName: string
  textName: string
  saveName: string
  options: DirectoryOption[]
  initialChoice: string
  initialText: string
  placeholder: string
  newLabel: string
  saveLabel: string
  manageHref: string
  error?: string
  maxLength: number
  required?: boolean
  initialSave: boolean
}) {
  const [choice, setChoice] = useState(initialChoice)
  const manual = choice === 'new'
  return (
    <div className="adm-field is-wide">
      <label htmlFor={selectName}>{label}</label>
      <div className="adm-picker">
        <select
          id={selectName}
          name={selectName}
          className="adm-select"
          value={choice}
          onChange={(ev) => setChoice(ev.target.value)}
          required={required}
          aria-invalid={error && !manual ? true : undefined}
        >
          <option value="" disabled={required}>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
          <option value="new">{newLabel}</option>
        </select>
        {manual && (
          <input
            className="adm-input"
            id={textName}
            name={textName}
            aria-label={`${label}: назва`}
            defaultValue={initialText}
            maxLength={maxLength}
            required={required}
            autoFocus={initialChoice !== 'new'}
            aria-invalid={error ? true : undefined}
          />
        )}
      </div>
      {manual && (
        <label className="adm-check">
          <input type="checkbox" name={saveName} defaultChecked={initialSave} />
          {saveLabel}
        </label>
      )}
      {error ? (
        <span className="adm-error" role="alert">
          {error}
        </span>
      ) : (
        <span className="adm-hint">
          Список редагується в розділі <Link href={manageHref}>{label === 'Суперник' ? '«Команди»' : '«Зали»'}</Link>.
        </span>
      )}
    </div>
  )
}

export function MatchForm({
  match,
  initialKind = 'official',
  teams,
  venues,
}: {
  match?: MatchFormValues
  initialKind?: 'official' | 'friendly'
  teams: DirectoryOption[]
  venues: DirectoryOption[]
}) {
  const [state, action] = useActionState(saveMatchAction, initial)
  const e = state.errors ?? {}
  const kind = pick(state, 'kind', match?.kind ?? initialKind)
  // Існуючий матч без зв'язку з довідником (старі записи) — показуємо як введений вручну
  const teamChoice = pick(state, 'teamId', match ? (match.teamId ?? 'new') : teams.length ? '' : 'new')
  const venueChoice = pick(state, 'venueId', match ? (match.venueId ?? (match.location ? 'new' : '')) : '')
  // Галочку «додати до довідника» зберігаємо лише якщо поле ручного вводу вже було відкрите
  const v = state.values
  const saveTeam = v?.teamId === 'new' ? v.saveTeam === 'on' : true
  const saveVenue = v?.venueId === 'new' ? v.saveVenue === 'on' : true
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
        <DirectoryPicker
          label="Суперник"
          selectName="teamId"
          textName="opponent"
          saveName="saveTeam"
          options={teams}
          initialChoice={teamChoice}
          initialText={pick(state, 'opponent', match?.opponent)}
          placeholder="Оберіть команду…"
          newLabel="+ Інша команда (ввести назву)"
          saveLabel="Додати команду до довідника"
          manageHref="/admin/teams"
          error={e.opponent}
          maxLength={80}
          required
          initialSave={saveTeam}
        />
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
        <DirectoryPicker
          label="Зал"
          selectName="venueId"
          textName="location"
          saveName="saveVenue"
          options={venues}
          initialChoice={venueChoice}
          initialText={pick(state, 'location', match?.location)}
          placeholder="— Не вказано —"
          newLabel="+ Інший зал (ввести назву)"
          saveLabel="Додати зал до довідника"
          manageHref="/admin/venues"
          error={e.location}
          maxLength={120}
          initialSave={saveVenue}
        />
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

export type TeamFormValues = { id?: string; name: string; city: string | null }

export function TeamForm({ team }: { team?: TeamFormValues }) {
  const [state, action] = useActionState(saveTeamAction, initial)
  const e = state.errors ?? {}
  return (
    <form action={action} className="adm-form adm-card" key={formKey(state)}>
      {team?.id && <input type="hidden" name="id" value={team.id} />}
      <FormMessage state={state} />
      <div className="adm-form-grid">
        <Field name="name" label="Назва команди" error={e.name}>
          <input className="adm-input" defaultValue={pick(state, 'name', team?.name)} required maxLength={80} {...inputProps('name', state)} />
        </Field>
        <Field name="city" label="Місто" error={e.city} hint="Необов'язково">
          <input className="adm-input" defaultValue={pick(state, 'city', team?.city)} maxLength={80} {...inputProps('city', state)} />
        </Field>
      </div>
      {team?.id && <p className="adm-hint">Якщо змінити назву, вона оновиться і в усіх матчах з цією командою.</p>}
      <div className="adm-actions">
        <SubmitButton>{team?.id ? 'Зберегти зміни' : 'Додати команду'}</SubmitButton>
        <Link href="/admin/teams" className="adm-btn">
          Скасувати
        </Link>
      </div>
    </form>
  )
}

export type VenueFormValues = { id?: string; name: string; address: string | null; mapQuery: string | null }

export function VenueForm({ venue }: { venue?: VenueFormValues }) {
  const [state, action] = useActionState(saveVenueAction, initial)
  const e = state.errors ?? {}
  return (
    <form action={action} className="adm-form adm-card" key={formKey(state)}>
      {venue?.id && <input type="hidden" name="id" value={venue.id} />}
      <FormMessage state={state} />
      <div className="adm-form-grid">
        <Field name="name" label="Назва залу" error={e.name} wide>
          <input className="adm-input" defaultValue={pick(state, 'name', venue?.name)} required maxLength={120} placeholder="СК «Юність»" {...inputProps('name', state)} />
        </Field>
        <Field name="address" label="Адреса" error={e.address} wide hint="Необов'язково. Показується підказкою у формі матчу.">
          <input className="adm-input" defaultValue={pick(state, 'address', venue?.address)} maxLength={200} placeholder="вул. Прикладна, 1, Київ" {...inputProps('address', state)} />
        </Field>
        <Field
          name="mapQuery"
          label="Місце на карті"
          error={e.mapQuery}
          wide
          hint="Адреса або координати (50.4501, 30.5234), чи повне посилання Google Maps з «@координатами». Порожньо — карта шукатиме за адресою або назвою."
        >
          <input className="adm-input" defaultValue={pick(state, 'mapQuery', venue?.mapQuery)} maxLength={200} {...inputProps('mapQuery', state)} />
        </Field>
      </div>
      {venue?.id && <p className="adm-hint">Якщо змінити назву, вона оновиться і в усіх матчах у цьому залі.</p>}
      <div className="adm-actions">
        <SubmitButton>{venue?.id ? 'Зберегти зміни' : 'Додати зал'}</SubmitButton>
        <Link href="/admin/venues" className="adm-btn">
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

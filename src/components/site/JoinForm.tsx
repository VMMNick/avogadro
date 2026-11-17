'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { applyAction } from '@/app/join-actions'
import { PLAYER_ROLES } from '@/db/schema'
import { getDict, type Locale } from '@/lib/i18n'
import type { FormState } from '@/lib/validation'

function Submit({ label, pending }: { label: string; pending: string }) {
  const status = useFormStatus()
  return (
    <button type="submit" className="btn-primary join-submit" disabled={status.pending}>
      {status.pending ? pending : label}
    </button>
  )
}

/** Форма «Хочу до команди» із захистом від спаму (пастка + час заповнення + ліміт на сервері). */
export function JoinForm({ locale }: { locale: Locale }) {
  const t = getDict(locale)
  const [state, action] = useActionState<FormState, FormData>(applyAction, {})
  const startedRef = useRef<HTMLInputElement>(null)
  // Час відкриття форми ставить браузер — прості боти без JavaScript її не пройдуть
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now())
  }, [state])

  const e = state.errors ?? {}
  const v = (k: string) => state.values?.[k] ?? ''
  const key = JSON.stringify([state.values ?? null, state.ok ?? null, state.message ?? null])

  if (state.ok) {
    return (
      <div className="join-done" role="status">
        <strong>✓</strong> {state.message}
      </div>
    )
  }

  const err = (k: string) =>
    e[k] ? (
      <span className="join-error" id={`join-${k}-error`} role="alert">
        {e[k]}
      </span>
    ) : null
  const a11y = (k: string) => ({
    'aria-invalid': e[k] ? true : undefined,
    'aria-describedby': e[k] ? `join-${k}-error` : undefined,
  })

  return (
    <form action={action} className="join-form" key={key} noValidate={false}>
      {state.message && (
        <p className="join-error" role="alert">
          {state.message}
        </p>
      )}
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="t" ref={startedRef} defaultValue="" />
      {/* Пастка для ботів: людина цього поля не бачить */}
      <div className="join-trap" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="join-row">
        <label className="join-field">
          <span>{t.join.name}</span>
          <input name="name" required maxLength={80} autoComplete="name" defaultValue={v('name')} {...a11y('name')} />
          {err('name')}
        </label>
        <label className="join-field">
          <span>{t.join.contact}</span>
          <input
            name="contact"
            required
            maxLength={120}
            autoComplete="tel"
            placeholder={t.join.contactHint}
            defaultValue={v('contact')}
            {...a11y('contact')}
          />
          {err('contact')}
        </label>
      </div>
      <div className="join-row">
        <label className="join-field">
          <span>{t.join.experience}</span>
          <select name="experience" required defaultValue={v('experience')} {...a11y('experience')}>
            <option value="" disabled>
              {t.join.choose}
            </option>
            {(['beginner', 'amateur', 'team'] as const).map((k) => (
              <option key={k} value={k}>
                {t.join.experienceOptions[k]}
              </option>
            ))}
          </select>
          {err('experience')}
        </label>
        <label className="join-field">
          <span>
            {t.join.position} <small>({t.join.optional})</small>
          </span>
          <select name="position" defaultValue={v('position')} {...a11y('position')}>
            <option value="">{t.join.choose}</option>
            <option value="any">{t.join.positionAny}</option>
            {PLAYER_ROLES.filter((r) => r !== 'staff').map((r) => (
              <option key={r} value={r}>
                {t.roles[r]}
              </option>
            ))}
          </select>
          {err('position')}
        </label>
      </div>
      <label className="join-field">
        <span>
          {t.join.message} <small>({t.join.optional})</small>
        </span>
        <textarea name="message" rows={3} maxLength={1000} defaultValue={v('message')} {...a11y('message')} />
        {err('message')}
      </label>
      <label className="join-consent">
        <input type="checkbox" name="consent" required defaultChecked={v('consent') === 'on'} {...a11y('consent')} />
        <span>{t.join.consent}</span>
      </label>
      {err('consent')}
      <Submit label={t.join.submit} pending={t.join.sending} />
    </form>
  )
}

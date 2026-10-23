'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { FormState } from '@/lib/validation'

export function SubmitButton({
  children,
  pendingText = 'Зберігаю…',
  className = 'adm-btn adm-btn-primary',
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  )
}

/** Кнопка видалення з підтвердженням другим натисканням (без системних діалогів). */
export function DeleteButton({ label = 'Видалити' }: { label?: string }) {
  const [armed, setArmed] = useState(false)
  const { pending } = useFormStatus()
  return (
    <button
      // Завжди type="button": форма надсилається лише явно, після підтвердження
      type="button"
      className={`adm-btn adm-btn-sm adm-btn-danger${armed ? ' is-armed' : ''}`}
      disabled={pending}
      onClick={(e) => {
        if (armed) {
          e.currentTarget.form?.requestSubmit()
          return
        }
        setArmed(true)
        setTimeout(() => setArmed(false), 4000)
      }}
    >
      {pending ? 'Видаляю…' : armed ? 'Точно видалити?' : label}
    </button>
  )
}

export function Field({
  name,
  label,
  error,
  hint,
  wide,
  children,
}: {
  name: string
  label: string
  error?: string
  hint?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`adm-field${wide ? ' is-wide' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <span className="adm-hint">{hint}</span>}
      {error && (
        <span className="adm-error" id={`${name}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export function inputProps(name: string, state: FormState) {
  const error = state.errors?.[name]
  return {
    id: name,
    name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${name}-error` : undefined,
  } as const
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null
  return (
    <div className={`adm-alert ${state.ok ? 'adm-alert-ok' : 'adm-alert-error'}`} role="status">
      {state.message}
    </div>
  )
}

/** Поле пароля з кнопкою «показати / сховати». */
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="adm-password">
      <input {...props} type={visible ? 'text' : 'password'} className="adm-input" />
      <button
        type="button"
        className="adm-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Сховати пароль' : 'Показати пароль'}
        aria-pressed={visible}
        title={visible ? 'Сховати пароль' : 'Показати пароль'}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

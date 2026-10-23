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

'use client'

import {useId, useState} from 'react'

export function PasswordField({
  label = 'Password',
  name = 'password',
  placeholder = '********',
  autoComplete = 'current-password',
  minLength = 8,
  required = true,
  helper,
}: {
  label?: string
  name?: string
  placeholder?: string
  autoComplete?: string
  minLength?: number
  required?: boolean
  helper?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const fieldId = useId()

  return (
    <label className="form-field form-field--full">
      <span className="form-label">{label}</span>
      <span className="password-field">
        <input
          className="form-input password-field__input"
          id={fieldId}
          type={isVisible ? 'text' : 'password'}
          name={name}
          minLength={minLength}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          className="password-field__toggle"
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-controls={fieldId}
          aria-pressed={isVisible}
        >
          {isVisible ? 'Ocultar' : 'Mostrar'}
        </button>
      </span>
      {helper ? <span className="form-helper">{helper}</span> : null}
    </label>
  )
}

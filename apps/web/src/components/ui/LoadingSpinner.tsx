'use client'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  label = 'Cargando',
  className,
}: LoadingSpinnerProps) {
  return (
    <span
      className={`loading-spinner loading-spinner--${size}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-label={label}
    />
  )
}

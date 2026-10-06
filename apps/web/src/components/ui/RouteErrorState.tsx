'use client'

import {useEffect} from 'react'

export function RouteErrorState({
  error,
  reset,
  title,
  message,
}: {
  error: Error & {digest?: string}
  reset: () => void
  title: string
  message: string
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="route-error-state" role="alert">
      <p className="eyebrow">Error</p>
      <h2>{title}</h2>
      <p className="muted">{message}</p>
      <button className="button button--primary" type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  )
}

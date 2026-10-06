'use client'

import {RouteErrorState} from '@/components/ui/RouteErrorState'

export default function DashboardBandError({
  error,
  reset,
}: {
  error: Error & {digest?: string}
  reset: () => void
}) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="No pudimos abrir esta banda"
      message="El editor no pudo cargar todos los datos. Reintenta para volver a sincronizar la vista."
    />
  )
}

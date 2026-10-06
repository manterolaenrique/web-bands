'use client'

import {RouteErrorState} from '@/components/ui/RouteErrorState'

export default function DashboardDemoTrackError({
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
      title="No pudimos abrir este audio"
      message="El detalle del track no se termino de cargar. Reintenta para volver al reproductor."
    />
  )
}

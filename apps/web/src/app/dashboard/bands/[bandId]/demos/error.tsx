'use client'

import {RouteErrorState} from '@/components/ui/RouteErrorState'

export default function DashboardDemosError({
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
      title="No pudimos abrir los demos"
      message="La vista privada de audios no termino de cargar. Reintenta para recuperar la lista y las playlists."
    />
  )
}

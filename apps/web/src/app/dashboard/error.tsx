'use client'

import {RouteErrorState} from '@/components/ui/RouteErrorState'

export default function DashboardError({
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
      title="No pudimos abrir el dashboard"
      message="Vuelve a intentar. Si el problema sigue, revisa la conexion con Supabase o refresca la sesion."
    />
  )
}

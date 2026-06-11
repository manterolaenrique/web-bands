import Link from 'next/link'

import {signOut} from '@/app/login/actions'
import type {CurrentUserSummary} from '@/lib/auth/user-summary'

import {getUserInitials} from './user-initials'

export function DashboardAccountScreen({
  currentUser,
}: {
  currentUser: CurrentUserSummary | null
}) {
  const displayName = currentUser?.displayName || 'Mi cuenta'
  const email = currentUser?.email || 'Sin email visible'
  const roleLabel = currentUser?.roleLabel || 'Usuario'

  return (
    <>
      <div className="desktop-surface">
        <section className="dashboard-account-hero dashboard-card reveal reveal--visible">
          <div>
            <p className="eyebrow">Cuenta</p>
            <h1 className="dashboard-title">Tu cuenta</h1>
            <p className="lead">
              Revisa tu identidad de acceso y sali de la gestion privada sin mezclar esta vista con el editor.
            </p>
          </div>
          <div className="dashboard-account-hero__actions">
            <Link className="button" href="/dashboard">
              Volver a bandas
            </Link>
            <form action={signOut}>
              <button className="button button--primary" type="submit">
                Cerrar sesion
              </button>
            </form>
          </div>
        </section>

        <section className="dashboard-account-grid reveal reveal--visible">
          <article className="dashboard-card dashboard-account-card">
            <div className="dashboard-account-card__header">
              <span className="dashboard-account-card__avatar">{getUserInitials(displayName)}</span>
              <div>
                <p className="eyebrow">Identidad</p>
                <h2>{displayName}</h2>
                <p className="dashboard-account-card__email">{email}</p>
              </div>
            </div>

            <div className="dashboard-account-card__meta">
              <span className="dashboard-account-card__pill">{roleLabel}</span>
              <span className="dashboard-account-card__pill dashboard-account-card__pill--muted">
                Gestion privada
              </span>
            </div>
          </article>

          <article className="dashboard-card dashboard-account-card">
            <div>
              <p className="eyebrow">Acceso</p>
              <h2>Panel privado</h2>
              <p className="muted">
                Para cambiar permisos de una banda, usa la seccion <strong>Equipo</strong> dentro del workspace
                correspondiente.
              </p>
            </div>

            <div className="dashboard-account-card__actions">
              <Link className="button" href="/dashboard">
                Ver mis bandas
              </Link>
              <form action={signOut}>
                <button className="button button--danger" type="submit">
                  Cerrar sesion
                </button>
              </form>
            </div>
          </article>
        </section>
      </div>

      <div className="mobile-surface dashboard-account-mobile">
        <section className="dashboard-account-mobile__hero">
          <p className="eyebrow">Cuenta</p>
          <h1 className="dashboard-mobile-hero__title">Mi cuenta</h1>
          <p className="dashboard-mobile-hero__copy">
            Separamos este espacio del editor para que la navegacion mobile se sienta mas clara.
          </p>
        </section>

        <article className="dashboard-account-card dashboard-account-card--mobile">
          <div className="dashboard-account-card__header">
            <span className="dashboard-account-card__avatar">{getUserInitials(displayName)}</span>
            <div>
              <p className="eyebrow">Perfil privado</p>
              <h2>{displayName}</h2>
              <p className="dashboard-account-card__email">{email}</p>
            </div>
          </div>

          <div className="dashboard-account-card__meta">
            <span className="dashboard-account-card__pill">{roleLabel}</span>
            <span className="dashboard-account-card__pill dashboard-account-card__pill--muted">
              Gestion privada
            </span>
          </div>
        </article>

        <article className="dashboard-account-card dashboard-account-card--mobile">
          <div>
            <p className="eyebrow">Atajos</p>
            <h2>Desde aca manejas tu acceso</h2>
            <p className="muted">
              Si queres volver a editar o revisar permisos, usa el editor de banda y la seccion Equipo.
            </p>
          </div>

          <div className="dashboard-account-card__actions">
            <Link className="button" href="/dashboard">
              Volver a bandas
            </Link>
            <form action={signOut}>
              <button className="button button--danger" type="submit">
                Cerrar sesion
              </button>
            </form>
          </div>
        </article>
      </div>
    </>
  )
}

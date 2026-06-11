import Image from 'next/image'
import Link from 'next/link'

import {CreateBandForm} from '@/components/dashboard/CreateBandForm'
import {DashboardFlashToast} from '@/components/dashboard/DashboardFlashToast'
import {PendingInvitesPanel} from '@/components/dashboard/PendingInvitesPanel'
import {PlusIcon} from '@/components/layout/MobileNavIcons'
import {canManageBand} from '@/lib/auth/permissions'
import {
  getBandStatusLabel,
  getBandStatusTone,
  getBandVisibilityLabel,
  getBandVisibilityMessage,
  isBandPublic,
} from '@/lib/bands/publication'
import {getDashboardFlash} from '@/lib/dashboard/messages'
import {isSupabaseConfigured} from '@/lib/env'
import {getSanityImageUrl} from '@/lib/sanity/image'
import {getBandByBandId, getBandByDocumentId} from '@/lib/sanity/queries'
import {requireUser} from '@/lib/auth/session'
import {getDashboardBands} from '@/server/bands/dashboard'

type DashboardPageProps = {
  searchParams: Promise<{
    message?: string
  }>
}

function formatDashboardDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export default async function DashboardPage({searchParams}: DashboardPageProps) {
  const {message} = await searchParams
  const flash = getDashboardFlash(message)

  if (!isSupabaseConfigured()) {
    return (
      <div className="setup-card">
        <p className="eyebrow">Setup pendiente</p>
        <h1 className="dashboard-title">Configura Supabase</h1>
        <p className="muted">
          La app ya esta preparada para Auth, RLS y memberships. Crea el proyecto Supabase,
          corre las migraciones y agrega las variables de entorno.
        </p>
      </div>
    )
  }

  const user = await requireUser()
  const data = await getDashboardBands(user.id, user.email)
  const memberships = data.memberships
  const pendingInvites = data.pendingInvites
  const mobileBandCards = await Promise.all(
    memberships.map(async (membership) => {
      const band = membership.band
      const sanityBand =
        (band.sanity_document_id ? await getBandByDocumentId(band.sanity_document_id).catch(() => null) : null) ||
        (await getBandByBandId(band.id).catch(() => null))

      return {
        membership,
        heroImage: getSanityImageUrl(sanityBand?.hero?.imagen, {width: 800, height: 420, fit: 'crop'}),
        genre: sanityBand?.genero || null,
        heroTitle: sanityBand?.hero?.titulo || null,
      }
    })
  )

  return (
    <>
      <DashboardFlashToast flash={flash} />

      <div className="desktop-surface">
        <section className="dashboard-command-surface reveal reveal--visible">
          <div className="dashboard-command-surface__copy">
            <p className="eyebrow">Workspace privado</p>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="lead">
              Gestiona bandas, accesos y estado publico desde un panel mas limpio, compacto y listo para trabajar.
            </p>
          </div>
          <div className="dashboard-command-surface__actions">
            <a className="button button--ghost" href="#dashboard-management">
              Ver gestion
            </a>
            <a className="button button--primary" href="#dashboard-create-band">
              Agregar banda
            </a>
          </div>
        </section>

        <section className="dashboard-metrics dashboard-metrics--private reveal reveal--visible">
          <article className="metric-card metric-card--dashboard">
            <span className="metric-card__label">Bandas asignadas</span>
            <strong>{memberships.length}</strong>
          </article>
          <article className="metric-card metric-card--dashboard">
            <span className="metric-card__label">Invitaciones activas</span>
            <strong>{pendingInvites.length}</strong>
          </article>
          <article className="metric-card metric-card--dashboard">
            <span className="metric-card__label">Perfiles publicos</span>
            <strong>{memberships.filter((membership) => isBandPublic(membership.band.status)).length}</strong>
          </article>
          <article className="metric-card metric-card--dashboard">
            <span className="metric-card__label">Studio interno</span>
            <strong>{memberships.length > 0 ? 'Activo' : 'Listo'}</strong>
          </article>
        </section>

        {data.loadError ? (
          <div className="status status--error">
            No se pudieron cargar las bandas. Revisa las politicas RLS y las migraciones.
          </div>
        ) : null}

        <section className="dashboard-management" id="dashboard-management">
          <div className="dashboard-management__header">
            <div>
              <p className="eyebrow">Gestion central</p>
              <h2>Band management</h2>
              <p className="muted">
                Abre cada banda, revisa su estado publico y salta al editor o al espacio privado de demos sin perder contexto.
              </p>
            </div>
            <div className="dashboard-management__header-meta">
              <span className="dashboard-management__count">
                {memberships.length} {memberships.length === 1 ? 'banda' : 'bandas'}
              </span>
            </div>
          </div>
          <div className="dashboard-management__grid">
            <div className="dashboard-management__main">
              {memberships.length > 0 ? (
                <div className="dashboard-band-list" role="list" aria-label="Bandas asignadas">
                  {mobileBandCards.map(({membership, heroImage, genre, heroTitle}) => (
                    <article className="dashboard-band-row" key={membership.band.id} role="listitem">
                      <div className="dashboard-band-row__identity">
                        <div className="dashboard-band-row__thumb">
                          {heroImage ? (
                            <Image
                              src={heroImage}
                              alt={membership.band.name ? `Imagen de ${membership.band.name}` : 'Imagen de la banda'}
                              width={128}
                              height={128}
                              sizes="96px"
                            />
                          ) : (
                            <span>{membership.band.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="dashboard-band-row__copy">
                          <div className="dashboard-band-row__title-row">
                            <h3>{membership.band.name}</h3>
                            <div className="pill-row">
                              <span className="pill">{membership.role}</span>
                              <span className={`pill pill--${getBandStatusTone(membership.band.status)}`}>
                                {getBandStatusLabel(membership.band.status)}
                              </span>
                              <span className={`pill pill--${membership.publicBandHref ? 'success' : 'muted'}`}>
                                {getBandVisibilityLabel(membership.band.status)}
                              </span>
                            </div>
                          </div>
                          <p className="dashboard-band-row__slug">/{membership.band.slug}</p>
                          <p className="dashboard-band-row__description">
                            {heroTitle || getBandVisibilityMessage(membership.band.status)}
                          </p>
                          <div className="dashboard-band-row__meta">
                            <span>{genre || 'Banda'}</span>
                            <span>Actualizado {formatDashboardDate(membership.band.updated_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="dashboard-band-row__actions">
                        <Link href={`/dashboard/bands/${membership.band.id}`} className="button button--primary">
                          Editar
                        </Link>
                        <Link href={`/dashboard/bands/${membership.band.id}/demos`} className="button button--ghost">
                          Demos
                        </Link>
                        {canManageBand(membership.role) ? (
                          <Link href={`/dashboard/bands/${membership.band.id}/team`} className="button button--ghost">
                            Equipo
                          </Link>
                        ) : null}
                        {membership.publicBandHref ? (
                          <Link href={membership.publicBandHref} className="button button--ghost">
                            Ver publica
                          </Link>
                        ) : (
                          <span className="button button--disabled" aria-disabled="true">
                            No publica
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-card dashboard-card--empty-dashboard">
                  <p className="eyebrow">Primer paso</p>
                  <h3>Crea tu primera banda</h3>
                  <p className="muted">
                    Apenas abras una banda, vas a poder editar su web publica, gestionar miembros y usar el workspace privado.
                  </p>
                  <a className="button button--primary" href="#dashboard-create-band">
                    Crear banda
                  </a>
                </div>
              )}
            </div>

            <aside className="dashboard-management__side">
              <section
                className={`dashboard-card dashboard-create-card${memberships.length === 0 ? ' dashboard-create-card--empty' : ''}`}
                id="dashboard-create-band"
              >
                <div className="dashboard-section-heading">
                  <div>
                    <p className="eyebrow">Nueva banda</p>
                    <h2>{memberships.length === 0 ? 'Crea tu primera banda' : 'Agregar otra banda'}</h2>
                    <p className="muted">
                      Mantene el mismo backend multiusuario y abre un nuevo espacio editable desde este mismo dashboard.
                    </p>
                  </div>
                </div>
                <CreateBandForm />
              </section>

              <PendingInvitesPanel invites={pendingInvites} />
            </aside>
          </div>
        </section>
      </div>

      <div className="mobile-surface dashboard-mobile-screen">
        <section className="dashboard-mobile-hero">
          <p className="eyebrow">Dashboard privado</p>
          <h1 className="dashboard-mobile-hero__title">Mis bandas</h1>
          <p className="dashboard-mobile-hero__copy">
            Gestiona accesos, estado publico y edicion de cada banda desde una interfaz mobile mas
            compacta.
          </p>
        </section>

        <section className="dashboard-mobile-stats" aria-label="Metricas del dashboard">
          <article className="dashboard-mobile-stat-card">
            <span className="metric-card__label">Bandas</span>
            <strong>{memberships.length}</strong>
          </article>
          <article className="dashboard-mobile-stat-card">
            <span className="metric-card__label">Invites</span>
            <strong>{pendingInvites.length}</strong>
          </article>
          <article className="dashboard-mobile-stat-card">
            <span className="metric-card__label">Publicas</span>
            <strong>{memberships.filter((membership) => isBandPublic(membership.band.status)).length}</strong>
          </article>
        </section>

        {data.loadError ? (
          <div className="status status--error">
            No se pudieron cargar las bandas. Revisa las politicas RLS y las migraciones.
          </div>
        ) : null}

        <PendingInvitesPanel invites={pendingInvites} />

        <section className="dashboard-mobile-create-card dashboard-card" id="dashboard-create-band">
          <div>
            <p className="eyebrow">Nueva banda</p>
            <h2>{memberships.length === 0 ? 'Crea tu primera banda' : 'Agregar otra banda'}</h2>
            <p className="muted">
              Usa el mismo backend multiusuario y suma una nueva banda desde esta misma app.
            </p>
          </div>
          <CreateBandForm />
        </section>

        {mobileBandCards.length > 0 ? (
          <div className="dashboard-mobile-band-list">
            {mobileBandCards.map(({membership, heroImage, genre, heroTitle}) => (
              <article className="dashboard-mobile-band-card" key={membership.band.id}>
                <div className="dashboard-mobile-band-card__media">
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={membership.band.name ? `Imagen de ${membership.band.name}` : 'Imagen de la banda'}
                      width={800}
                      height={420}
                      sizes="100vw"
                    />
                  ) : (
                    <div className="dashboard-mobile-band-card__fallback" aria-hidden="true">
                      <span>{membership.band.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="dashboard-mobile-band-card__overlay" />
                  <div className="dashboard-mobile-band-card__chips">
                    <span className="dashboard-mobile-band-card__chip">{membership.role}</span>
                    <span className={`dashboard-mobile-band-card__chip dashboard-mobile-band-card__chip--${getBandStatusTone(membership.band.status)}`}>
                      {getBandStatusLabel(membership.band.status)}
                    </span>
                  </div>
                </div>
                <div className="dashboard-mobile-band-card__body">
                  <div className="dashboard-mobile-band-card__header">
                    <div>
                      <h2>{membership.band.name}</h2>
                      <p className="muted">
                        {genre || 'Banda'} {membership.band.slug ? ` /${membership.band.slug}` : ''}
                      </p>
                    </div>
                    <span className={`pill pill--${membership.publicBandHref ? 'success' : 'muted'}`}>
                      {getBandVisibilityLabel(membership.band.status)}
                    </span>
                  </div>
                  <p className="muted">
                    {heroTitle || getBandVisibilityMessage(membership.band.status)}
                  </p>
                  <div className="dashboard-mobile-band-card__actions">
                    <Link href={`/dashboard/bands/${membership.band.id}`} className="button button--primary">
                      Editar
                    </Link>
                    <Link href={`/dashboard/bands/${membership.band.id}/demos`} className="button button--ghost">
                      Demos
                    </Link>
                    {canManageBand(membership.role) ? (
                      <Link href={`/dashboard/bands/${membership.band.id}/team`} className="button button--ghost">
                        Equipo
                      </Link>
                    ) : null}
                    {membership.publicBandHref ? (
                      <Link href={membership.publicBandHref} className="button button--ghost">
                        Ver publica
                      </Link>
                    ) : (
                      <span className="button button--disabled" aria-disabled="true">
                        No publica
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <a className="dashboard-mobile-cta" href="#dashboard-create-band" aria-label="Crear banda">
          <span className="dashboard-mobile-cta__icon" aria-hidden="true">
            <PlusIcon />
          </span>
          <span className="dashboard-mobile-cta__label">Crear</span>
        </a>
      </div>
    </>
  )
}

import Link from 'next/link'
import {notFound} from 'next/navigation'

import {requireUser} from '@/lib/auth/session'
import {
  getBandStatusLabel,
  getBandStatusTone,
  getBandVisibilityLabel,
  getBandVisibilityMessage,
} from '@/lib/bands/publication'
import {getDashboardFlash} from '@/lib/dashboard/messages'
import {getBandEditorPayload} from '@/server/bands/editor-payload'
import {DashboardFlashToast} from '@/components/dashboard/DashboardFlashToast'
import {BandEditorForm} from '@/components/dashboard/BandEditorForm'
import {BandTeamPanel} from '@/components/dashboard/BandTeamPanel'
import {
  MOBILE_EDITOR_SECTIONS,
  type MobileEditorSectionKey,
} from '@/components/dashboard/mobile-editor-sections'

export async function BandEditorScreen({
  bandId,
  message,
  routeSection = 'overview',
}: {
  bandId: string
  message?: string
  routeSection?: MobileEditorSectionKey
}) {
  const flash = getDashboardFlash(message)
  const user = await requireUser()
  const payload = await getBandEditorPayload(user.id, bandId)

  if (!payload) {
    notFound()
  }

  const sectionMeta = MOBILE_EDITOR_SECTIONS[routeSection]
  const isOverview = routeSection === 'overview'
  const isTeamRoute = routeSection === 'team'
  const teamReturnTo = isTeamRoute ? `/dashboard/bands/${payload.band.id}/team` : `/dashboard/bands/${payload.band.id}`

  if (isTeamRoute && !payload.canManage) {
    notFound()
  }

  return (
    <>
      <DashboardFlashToast flash={flash} />

      <div className="dashboard-header editor-page-header">
        <div>
          <p className="eyebrow">{isOverview ? 'Editor privado' : `Editor mobile · ${sectionMeta.label}`}</p>
          <h1 className="dashboard-title">{payload.band.name}</h1>
          <div className="pill-row">
            <span className={`pill pill--${getBandStatusTone(payload.band.status)}`}>
              {getBandStatusLabel(payload.band.status)}
            </span>
            <span className={`pill pill--${payload.publicBandHref ? 'success' : 'muted'}`}>
              {getBandVisibilityLabel(payload.band.status)}
            </span>
          </div>
          <p className="muted">
            {isOverview
              ? 'Los cambios se validan en servidor, se sincronizan con Sanity y se revalida la pagina publica.'
              : sectionMeta.description}
          </p>
          <p className="muted">{getBandVisibilityMessage(payload.band.status)}</p>
        </div>
        <div className="row-actions row-actions--stack-mobile">
          <Link className="button button--primary" href={`/dashboard/bands/${payload.band.id}/demos`}>
            Demos
          </Link>
          {payload.canManage && !isTeamRoute ? (
            <Link className="button button--ghost" href={`/dashboard/bands/${payload.band.id}/team`}>
              Equipo
            </Link>
          ) : null}
          {payload.publicBandHref ? (
            <Link className="button" href={payload.publicBandHref}>
              Ver publica
            </Link>
          ) : null}
          {!isOverview ? (
            <Link className="button" href={`/dashboard/bands/${payload.band.id}`}>
              Indice del editor
            </Link>
          ) : null}
          <Link className="button" href="/dashboard">
            Volver
          </Link>
        </div>
      </div>

      <section className="mobile-surface editor-mobile-hero-card">
        <p className="eyebrow">{isOverview ? 'App mobile' : sectionMeta.label}</p>
        <h2>{isOverview ? payload.band.name : sectionMeta.title}</h2>
        <p className="muted">
          {isOverview
            ? 'Editor privado reorganizado para que el celular entre por un indice y no por un formulario eterno.'
            : sectionMeta.description}
        </p>
      </section>

      {!payload.canEdit ? (
        <div className="status status--warning">
          Tu rol actual es `{payload.role}`. Podes ver esta banda, pero no editarla.
        </div>
      ) : !isTeamRoute ? (
        <BandEditorForm
          bandId={payload.band.id}
          initialValues={payload.initialValues}
          initialImages={payload.initialImages}
          previewBandBase={payload.previewBandBase}
          initialServerSavedAt={payload.initialServerSavedAt}
          routeSection={routeSection}
          canManage={payload.canManage}
        />
      ) : null}

      {payload.canManage && isTeamRoute ? (
        <BandTeamPanel
          bandId={payload.band.id}
          currentUserId={user.id}
          managerRole={payload.role as NonNullable<typeof payload.role>}
          members={payload.teamMembers}
          invites={payload.pendingInvites}
          returnTo={teamReturnTo}
        />
      ) : null}
    </>
  )
}

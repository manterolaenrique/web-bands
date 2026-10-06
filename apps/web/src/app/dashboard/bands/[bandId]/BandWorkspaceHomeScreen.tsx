import {notFound} from 'next/navigation'

import {DashboardFlashToast} from '@/components/dashboard/DashboardFlashToast'
import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {
  getBandWorkspaceSectionsByGroup,
  type BandWorkspaceGroupKey,
} from '@/components/dashboard/band-workspace-sections'
import {PendingLink} from '@/components/ui/PendingLink'
import {requireUser} from '@/lib/auth/session'
import {getDashboardFlash} from '@/lib/dashboard/messages'
import {getBandEditorPayload} from '@/server/bands/editor-payload'

function WorkspaceGroup({
  title,
  copy,
  sections,
}: {
  title: string
  copy: string
  sections: ReturnType<typeof getBandWorkspaceSectionsByGroup>
}) {
  if (sections.length === 0) {
    return null
  }

  return (
    <section className="dashboard-card band-workspace-home__group">
      <div className="band-workspace-home__group-header">
        <p className="eyebrow">{title}</p>
        <h2>{copy}</h2>
      </div>

      <div className="band-workspace-home__grid">
        {sections.map((section) => (
          <PendingLink
            key={section.key}
            href={section.href}
            className="band-workspace-card"
            pendingLabel={`Abriendo ${section.label.toLowerCase()}...`}
          >
            <span className="band-workspace-card__label">{section.label}</span>
            <strong>{section.title}</strong>
            <p>{section.description}</p>
          </PendingLink>
        ))}
      </div>
    </section>
  )
}

function buildGroupTitle(group: BandWorkspaceGroupKey) {
  if (group === 'public') {
    return {
      eyebrow: 'Sitio publico',
      title: 'Todo lo que impacta en la web publica de la banda.',
    }
  }

  if (group === 'private') {
    return {
      eyebrow: 'Herramientas privadas',
      title: 'Material interno para trabajar demos, prensa y fechas sin mezclarlo con la web publica.',
    }
  }

  return {
    eyebrow: 'Administracion',
    title: 'Permisos, equipo y accesos de quienes gestionan la banda.',
  }
}

export async function BandWorkspaceHomeScreen({
  bandId,
  message,
}: {
  bandId: string
  message?: string
}) {
  const flash = getDashboardFlash(message)
  const user = await requireUser()
  const payload = await getBandEditorPayload(user.id, bandId)

  if (!payload) {
    notFound()
  }

  const publicSections = getBandWorkspaceSectionsByGroup(payload.band.id, payload.canManage, 'public').filter(
    (section) => section.key !== 'summary'
  )
  const privateSections = getBandWorkspaceSectionsByGroup(payload.band.id, payload.canManage, 'private')
  const adminSections = getBandWorkspaceSectionsByGroup(payload.band.id, payload.canManage, 'admin')

  const publicGroup = buildGroupTitle('public')
  const privateGroup = buildGroupTitle('private')
  const adminGroup = buildGroupTitle('admin')

  return (
    <>
      <DashboardFlashToast flash={flash} />

      <BandWorkspaceHeader
        bandId={payload.band.id}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={payload.publicBandHref}
        canManage={payload.canManage}
        activeSection="summary"
        eyebrow="Workspace de banda"
        description="Entradas claras para editar el sitio publico, usar herramientas privadas y ubicar rapido cada modulo de la banda."
      />

      <div className="band-workspace-home">
        <section className="dashboard-card band-workspace-home__hero">
          <div className="band-workspace-home__hero-copy">
            <p className="eyebrow">Resumen rapido</p>
            <h2>Una subpagina clara para saber que puedes hacer aca.</h2>
            <p className="muted">
              Empieza por `Sitio publico` si quieres tocar la web de la banda. Usa `Demos`, `Setlists` y `Centro de prensa`
              cuando trabajas puertas adentro con material privado.
            </p>
          </div>

          <div className="band-workspace-home__stats">
            <article className="band-workspace-home__stat">
              <span>Tu rol</span>
              <strong>{payload.role}</strong>
            </article>
            <article className="band-workspace-home__stat">
              <span>Edicion</span>
              <strong>{payload.canEdit ? 'Activa' : 'Solo lectura'}</strong>
            </article>
            <article className="band-workspace-home__stat">
              <span>Publicacion</span>
              <strong>{payload.publicBandHref ? 'Visible' : 'No publica'}</strong>
            </article>
          </div>
        </section>

        {!payload.canEdit ? (
          <div className="status status--warning">
            Tu rol actual es `{payload.role}`. Puedes recorrer el workspace, pero no editar el contenido de esta banda.
          </div>
        ) : null}

        <WorkspaceGroup title={publicGroup.eyebrow} copy={publicGroup.title} sections={publicSections} />
        <WorkspaceGroup title={privateGroup.eyebrow} copy={privateGroup.title} sections={privateSections} />
        <WorkspaceGroup title={adminGroup.eyebrow} copy={adminGroup.title} sections={adminSections} />
      </div>
    </>
  )
}

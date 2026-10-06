import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {PendingLink} from '@/components/ui/PendingLink'
import {
  MOBILE_EDITOR_SECTIONS,
  SITE_EDITOR_SECTION_KEYS,
  getSiteEditorHref,
} from '@/components/dashboard/mobile-editor-sections'
import {requireUser} from '@/lib/auth/session'
import {getBandEditorPayload} from '@/server/bands/editor-payload'

export async function BandSiteOverviewScreen({
  bandId,
}: {
  bandId: string
}) {
  const user = await requireUser()
  const payload = await getBandEditorPayload(user.id, bandId)

  if (!payload) {
    notFound()
  }

  return (
    <>
      <BandWorkspaceHeader
        bandId={payload.band.id}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={payload.publicBandHref}
        canManage={payload.canManage}
        activeSection="site"
        eyebrow="Sitio publico"
        description="Resumen del contenido que impacta en la web publica: entra por una seccion clara en vez de caer a un formulario eterno."
      />

      {!payload.canEdit ? (
        <div className="status status--warning">
          Tu rol actual es `{payload.role}`. Puedes ver el mapa del sitio publico, pero no editarlo.
        </div>
      ) : null}

      <div className="band-workspace-home">
        <section className="dashboard-card band-workspace-home__hero">
          <div className="band-workspace-home__hero-copy">
            <p className="eyebrow">Mapa del sitio</p>
            <h2>Elige que parte de la web publica quieres editar.</h2>
            <p className="muted">
              Cada entrada abre una vista enfocada. Asi es mas facil encontrar rapido imagenes, bio, integrantes, redes,
              shows o la preview final.
            </p>
          </div>

          <div className="band-workspace-home__stats">
            <article className="band-workspace-home__stat">
              <span>Estado</span>
              <strong>{payload.initialValues.status}</strong>
            </article>
            <article className="band-workspace-home__stat">
              <span>Slug</span>
              <strong>/{payload.initialValues.slug}</strong>
            </article>
            <article className="band-workspace-home__stat">
              <span>Preview</span>
              <strong>{payload.publicBandHref ? 'Lista' : 'Pendiente'}</strong>
            </article>
          </div>
        </section>

        <section className="dashboard-card band-workspace-home__group">
          <div className="band-workspace-home__group-header">
            <p className="eyebrow">Secciones del sitio</p>
            <h2>Accesos claros para editar la web publica de la banda.</h2>
          </div>

          <div className="band-workspace-home__grid">
            {SITE_EDITOR_SECTION_KEYS.filter((section) => section !== 'overview').map((section) => (
              <PendingLink
                key={section}
                href={getSiteEditorHref(payload.band.id, section)}
                className="band-workspace-card"
                pendingLabel={`Abriendo ${MOBILE_EDITOR_SECTIONS[section].label.toLowerCase()}...`}
              >
                <span className="band-workspace-card__label">{MOBILE_EDITOR_SECTIONS[section].label}</span>
                <strong>{MOBILE_EDITOR_SECTIONS[section].title}</strong>
                <p>{MOBILE_EDITOR_SECTIONS[section].description}</p>
              </PendingLink>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

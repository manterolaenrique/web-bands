import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {DashboardFlashToast} from '@/components/dashboard/DashboardFlashToast'
import {BandEditorForm} from '@/components/dashboard/BandEditorForm'
import {
  MOBILE_EDITOR_SECTIONS,
  type SiteEditorSectionKey,
} from '@/components/dashboard/mobile-editor-sections'
import {requireUser} from '@/lib/auth/session'
import {getDashboardFlash} from '@/lib/dashboard/messages'
import {getBandEditorPayload} from '@/server/bands/editor-payload'

export async function BandEditorScreen({
  bandId,
  message,
  routeSection,
}: {
  bandId: string
  message?: string
  routeSection: SiteEditorSectionKey
}) {
  const flash = getDashboardFlash(message)
  const user = await requireUser()
  const payload = await getBandEditorPayload(user.id, bandId)

  if (!payload) {
    notFound()
  }

  const sectionMeta = MOBILE_EDITOR_SECTIONS[routeSection]

  return (
    <>
      <DashboardFlashToast flash={flash} />

      <BandWorkspaceHeader
        bandId={payload.band.id}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={payload.publicBandHref}
        canManage={payload.canManage}
        activeSection="site"
        eyebrow={`Sitio publico · ${sectionMeta.label}`}
        description={sectionMeta.description}
      />

      {!payload.canEdit ? (
        <div className="status status--warning">
          Tu rol actual es `{payload.role}`. Podes ver esta banda, pero no editarla.
        </div>
      ) : (
        <BandEditorForm
          bandId={payload.band.id}
          initialValues={payload.initialValues}
          initialImages={payload.initialImages}
          previewBandBase={payload.previewBandBase}
          initialServerSavedAt={payload.initialServerSavedAt}
          routeSection={routeSection}
          canManage={payload.canManage}
        />
      )}
    </>
  )
}

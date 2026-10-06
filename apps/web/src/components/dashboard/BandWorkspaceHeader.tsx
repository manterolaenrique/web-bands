import type {ReactNode} from 'react'

import type {BandStatus} from '@web-bands/bands-domain'

import {
  getBandStatusLabel,
  getBandStatusTone,
  getBandVisibilityLabel,
  getBandVisibilityMessage,
} from '@/lib/bands/publication'
import {PendingLink} from '@/components/ui/PendingLink'

import {
  getVisibleBandWorkspaceSections,
  type BandWorkspaceSectionKey,
} from './band-workspace-sections'

export function BandWorkspaceHeader({
  bandId,
  bandName,
  bandStatus,
  publicBandHref,
  canManage,
  activeSection,
  eyebrow,
  description,
  actions,
  backHref = '/dashboard',
  backLabel = 'Volver a mis bandas',
}: {
  bandId: string
  bandName: string
  bandStatus: BandStatus
  publicBandHref?: string | null
  canManage?: boolean
  activeSection: BandWorkspaceSectionKey
  eyebrow: string
  description: string
  actions?: ReactNode
  backHref?: string
  backLabel?: string
}) {
  const sections = getVisibleBandWorkspaceSections(bandId, Boolean(canManage))

  return (
    <div className="band-workspace-header">
      <div className="dashboard-header editor-page-header band-workspace-header__top">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="dashboard-title">{bandName}</h1>
          <div className="pill-row">
            <span className={`pill pill--${getBandStatusTone(bandStatus)}`}>{getBandStatusLabel(bandStatus)}</span>
            <span className={`pill pill--${publicBandHref ? 'success' : 'muted'}`}>{getBandVisibilityLabel(bandStatus)}</span>
          </div>
          <p className="muted">{description}</p>
          <p className="muted">{getBandVisibilityMessage(bandStatus)}</p>
        </div>

        <div className="row-actions row-actions--stack-mobile band-workspace-header__actions">
          {actions}
          {publicBandHref ? (
            <a className="button button--primary" href={publicBandHref}>
              Ver publica
            </a>
          ) : null}
          <PendingLink className="button" href={backHref} pendingLabel="Volviendo al dashboard...">
            {backLabel}
          </PendingLink>
        </div>
      </div>

      <nav className="band-workspace-nav" aria-label="Navegacion del workspace de banda">
        {sections.map((section) => (
          <PendingLink
            key={section.key}
            href={section.href}
            className={`band-workspace-nav__pill${section.key === activeSection ? ' band-workspace-nav__pill--active' : ''}`}
            pendingLabel={`Abriendo ${section.label.toLowerCase()}...`}
          >
            {section.label}
          </PendingLink>
        ))}
      </nav>
    </div>
  )
}

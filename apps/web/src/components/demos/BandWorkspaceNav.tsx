import {PendingLink} from '@/components/ui/PendingLink'

type SectionKey = 'demos' | 'playlists' | 'upload'

export function BandWorkspaceNav({
  bandId,
  active,
}: {
  bandId: string
  active: SectionKey
}) {
  const items = [
    {key: 'demos' as const, label: 'Demos', href: `/dashboard/bands/${bandId}/demos`},
    {key: 'playlists' as const, label: 'Playlists', href: `/dashboard/bands/${bandId}/demos/playlists`},
    {key: 'upload' as const, label: 'Subir', href: `/dashboard/bands/${bandId}/demos/upload`},
  ]

  return (
    <div className="demos-workspace-nav" aria-label="Navegacion del workspace de banda">
      {items.map((item) => (
        <PendingLink
          key={item.key}
          href={item.href}
          className={`demos-workspace-nav__pill${item.key === active ? ' demos-workspace-nav__pill--active' : ''}`}
          pendingLabel={`Abriendo ${item.label.toLowerCase()}...`}
        >
          {item.label}
        </PendingLink>
      ))}
    </div>
  )
}

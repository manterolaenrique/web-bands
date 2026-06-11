import Link from 'next/link'

type SectionKey = 'demos' | 'playlists' | 'upload' | 'editor'

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
    {key: 'editor' as const, label: 'Editor', href: `/dashboard/bands/${bandId}`},
  ]

  return (
    <div className="demos-workspace-nav" aria-label="Navegacion del workspace de banda">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`demos-workspace-nav__pill${item.key === active ? ' demos-workspace-nav__pill--active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

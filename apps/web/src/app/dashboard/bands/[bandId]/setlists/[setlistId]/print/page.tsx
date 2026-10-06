import {notFound} from 'next/navigation'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {SetlistPrintButton} from '@/components/dashboard/SetlistPrintButton'
import {SetlistPrintStyleControls} from '@/components/dashboard/SetlistPrintStyleControls'
import {requireUser} from '@/lib/auth/session'
import {formatSetlistDate} from '@/lib/setlists/format'
import {getSetlistPrintPaperClassName} from '@/lib/setlists/print-style'
import {getBandSetlistPrintPayload} from '@/server/bands/setlists'

type PageProps = {
  params: Promise<{
    bandId: string
    setlistId: string
  }>
}

export default async function BandSetlistPrintPage({params}: PageProps) {
  const {bandId, setlistId} = await params
  const user = await requireUser()
  const payload = await getBandSetlistPrintPayload(user.id, bandId, setlistId)

  if (!payload) {
    notFound()
  }

  return (
    <div className="setlist-print-screen">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        activeSection="setlists"
        eyebrow="Herramientas privadas · Vista A4"
        description={`${formatSetlistDate(payload.setlist.showDate)}${payload.setlist.location ? ` - ${payload.setlist.location}` : ''}`}
        actions={
          <>
            <a className="button" href={`/dashboard/bands/${bandId}/setlists/${setlistId}`}>
              Editar
            </a>
            <SetlistPrintButton />
          </>
        }
      />

      <SetlistPrintStyleControls bandId={bandId} setlist={payload.setlist} />

      <div className={getSetlistPrintPaperClassName(payload.setlist.printFontPreset, payload.setlist.printAllCaps)}>
        <header className="setlist-print-paper__header">
          <div className="setlist-print-paper__copy">
            {payload.setlist.title ? <p className="setlist-print-paper__eyebrow">{payload.setlist.title}</p> : null}
            <h2>{payload.band.name}</h2>
            <p className="setlist-print-paper__meta">
              {formatSetlistDate(payload.setlist.showDate)} - {payload.setlist.venueName}
              {payload.setlist.location ? ` - ${payload.setlist.location}` : ''}
            </p>
          </div>
          {payload.logo?.previewUrl ? (
            <div className="setlist-print-paper__logo">
              <img alt={payload.logo.label} src={payload.logo.previewUrl} />
            </div>
          ) : null}
        </header>

        <ol className="setlist-print-paper__list">
          {payload.setlist.items.map((item, index) => (
            <li
              className={`setlist-print-paper__item${
                item.itemType === 'block' ? ' setlist-print-paper__item--block' : ''
              }`}
              key={item.id}
            >
              <div className="setlist-print-paper__item-row">
                <div className="setlist-print-paper__item-title">
                  <span>{index + 1}</span>
                  <strong>{item.itemType === 'song' ? item.songTitleSnapshot : item.blockLabel}</strong>
                </div>
                {item.notesOverride ? (
                  <p className="setlist-print-paper__item-note">{item.notesOverride}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

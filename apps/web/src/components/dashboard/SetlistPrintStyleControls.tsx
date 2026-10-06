'use client'

import type {BandSetlistDetail, BandSetlistPrintFontPreset} from '@web-bands/bands-domain'

import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

import {updateSetlistRequest} from '@/lib/dashboard/setlists-api'
import {SETLIST_PRINT_FONT_LABELS} from '@/lib/setlists/print-style'

export function SetlistPrintStyleControls({
  bandId,
  setlist,
}: {
  bandId: string
  setlist: BandSetlistDetail
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [printFontPreset, setPrintFontPreset] = useState<BandSetlistPrintFontPreset>(setlist.printFontPreset)
  const [printAllCaps, setPrintAllCaps] = useState(setlist.printAllCaps)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = () => {
    setMessage(null)
    startTransition(async () => {
      const response = await updateSetlistRequest(bandId, setlist.id, {
        title: setlist.title,
        showDate: setlist.showDate,
        venueName: setlist.venueName,
        location: setlist.location,
        pressLogoAssetId: setlist.pressLogoAssetId,
        printFontPreset,
        printAllCaps,
        linkedShowKey: setlist.linkedShowKey,
      })

      if (!response.ok || !response.body?.setlist) {
        setMessage(response.body?.message || 'No se pudo guardar el estilo de impresion.')
        return
      }

      setMessage('Estilo guardado.')
      router.refresh()
    })
  }

  return (
    <section className="dashboard-card setlists-card setlists-print-style-card">
      <div className="setlists-card__header">
        <div>
          <p className="eyebrow">Vista A4</p>
          <h2>Tipografia y estilo de hoja</h2>
          <p className="muted">Ajusta la personalidad visual de esta fecha y dejala guardada para la preview y la impresion.</p>
        </div>
      </div>

      <div className="setlists-print-style-card__controls">
        <label className="form-field">
          <span className="form-label">Preset tipografico</span>
          <select
            className="form-select"
            disabled={isPending}
            value={printFontPreset}
            onChange={(event) => setPrintFontPreset(event.currentTarget.value as BandSetlistPrintFontPreset)}
          >
            {Object.entries(SETLIST_PRINT_FONT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-field form-field">
          <input
            checked={printAllCaps}
            disabled={isPending}
            type="checkbox"
            onChange={(event) => setPrintAllCaps(event.currentTarget.checked)}
          />
          <span>Lista en mayusculas</span>
        </label>

        <button className="button" disabled={isPending} type="button" onClick={handleSave}>
          {isPending ? 'Guardando...' : 'Guardar estilo'}
        </button>
      </div>

      {message ? <p className="muted">{message}</p> : null}
    </section>
  )
}

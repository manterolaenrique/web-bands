'use client'

import type {BandSetlistSummary, BandSetlistsHubPayload, BandSongLibraryItem} from '@web-bands/bands-domain'

import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

import {PendingLink} from '@/components/ui/PendingLink'
import {
  createSetlistRequest,
  createSongLibraryItemRequest,
  deleteSetlistRequest,
  deleteSongLibraryItemRequest,
  duplicateSetlistRequest,
  updateSongLibraryItemRequest,
  type SetlistsValidationIssue,
} from '@/lib/dashboard/setlists-api'
import {formatCompactSetlistDate, formatSetlistDuration} from '@/lib/setlists/format'

type SongDraft = {
  title: string
  defaultNotes: string
  defaultDurationSeconds: string
}

function summarizeSongNotes(value: string | null | undefined) {
  const trimmed = (value || '').trim()
  if (!trimmed) {
    return 'Sin nota por defecto.'
  }

  if (trimmed.length <= 96) {
    return trimmed
  }

  return `${trimmed.slice(0, 93)}...`
}

function buildSongDraft(song: BandSongLibraryItem): SongDraft {
  return {
    title: song.title,
    defaultNotes: song.defaultNotes || '',
    defaultDurationSeconds: song.defaultDurationSeconds ? String(song.defaultDurationSeconds) : '',
  }
}

function buildFieldErrors(errors: unknown) {
  if (!Array.isArray(errors)) {
    return {}
  }

  return errors.reduce<Record<string, string[]>>((result, error) => {
    const typedError = error as SetlistsValidationIssue
    if (!typedError?.path || !typedError?.message) {
      return result
    }

    result[typedError.path] = [...(result[typedError.path] || []), typedError.message]
    return result
  }, {})
}

function FieldError({errors}: {errors?: string[]}) {
  if (!errors?.length) {
    return null
  }

  return <p className="field-error">{errors[0]}</p>
}

function parseSeconds(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

function asSetlistSummary(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<BandSetlistSummary>

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.bandId !== 'string' ||
    typeof candidate.showDate !== 'string' ||
    typeof candidate.venueName !== 'string'
  ) {
    return null
  }

  return candidate as BandSetlistSummary
}

function sortSetlists(list: BandSetlistSummary[]) {
  return [...list].sort((left, right) => {
    const byDate = right.showDate.localeCompare(left.showDate)
    if (byDate !== 0) {
      return byDate
    }

    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

export function BandSetlistsWorkspace({
  bandId,
  payload,
}: {
  bandId: string
  payload: BandSetlistsHubPayload
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [songs, setSongs] = useState(payload.songs)
  const [setlists, setSetlists] = useState(payload.setlists)
  const [songDrafts, setSongDrafts] = useState<Record<string, SongDraft>>(() =>
    Object.fromEntries(payload.songs.map((song) => [song.id, buildSongDraft(song)]))
  )
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null)
  const [libraryErrors, setLibraryErrors] = useState<Record<string, string[]>>({})
  const [newSong, setNewSong] = useState<SongDraft>({
    title: '',
    defaultNotes: '',
    defaultDurationSeconds: '',
  })
  const [createSetlistValues, setCreateSetlistValues] = useState({
    linkedShowKey: '',
    title: '',
    showDate: '',
    venueName: '',
    location: '',
    pressLogoAssetId: '',
  })
  const [setlistMessage, setSetlistMessage] = useState<string | null>(null)
  const [setlistErrors, setSetlistErrors] = useState<Record<string, string[]>>({})
  const [workingSongId, setWorkingSongId] = useState<string | null>(null)
  const [workingSetlistId, setWorkingSetlistId] = useState<string | null>(null)
  const [editingSongId, setEditingSongId] = useState<string | null>(null)

  const editingSong = editingSongId ? songs.find((song) => song.id === editingSongId) || null : null
  const editingSongDraft = editingSong ? songDrafts[editingSong.id] || buildSongDraft(editingSong) : null

  const filteredSongs = songs.filter((song) => {
    const query = libraryQuery.trim().toLowerCase()
    if (!query) {
      return true
    }

    return (
      song.title.toLowerCase().includes(query) ||
      (song.defaultNotes || '').toLowerCase().includes(query)
    )
  })

  const openEditor = (setlistId: string, mode: 'new' | 'edit' = 'edit') => {
    const suffix = mode === 'new' ? '?mode=new' : ''
    router.push(`/dashboard/bands/${bandId}/setlists/${setlistId}${suffix}`)
  }

  const handleCreateSong = () => {
    setLibraryMessage(null)
    startTransition(async () => {
      const response = await createSongLibraryItemRequest(bandId, {
        title: newSong.title,
        defaultNotes: newSong.defaultNotes,
        defaultDurationSeconds: parseSeconds(newSong.defaultDurationSeconds),
      })

      if (!response.ok || !response.body?.song) {
        setLibraryErrors(buildFieldErrors(response.body?.errors))
        setLibraryMessage(response.body?.message || 'No se pudo crear el tema.')
        return
      }

      const nextSong = response.body.song
      setSongs((current) => [...current, nextSong].sort((left, right) => left.title.localeCompare(right.title, 'es')))
      setSongDrafts((current) => ({
        ...current,
        [nextSong.id]: buildSongDraft(nextSong),
      }))
      setNewSong({title: '', defaultNotes: '', defaultDurationSeconds: ''})
      setLibraryErrors({})
      setLibraryMessage('Tema agregado a la biblioteca.')
    })
  }

  const handleSaveSong = (songId: string) => {
    const draft = songDrafts[songId]
    if (!draft) {
      return
    }

    setWorkingSongId(songId)
    setLibraryMessage(null)
    startTransition(async () => {
      const response = await updateSongLibraryItemRequest(bandId, songId, {
        title: draft.title,
        defaultNotes: draft.defaultNotes,
        defaultDurationSeconds: parseSeconds(draft.defaultDurationSeconds),
      })

      setWorkingSongId(null)
      if (!response.ok || !response.body?.song) {
        setLibraryMessage(response.body?.message || 'No se pudo guardar el tema.')
        return
      }

      setSongs((current) =>
        current
          .map((song) => (song.id === songId ? response.body!.song! : song))
          .sort((left, right) => left.title.localeCompare(right.title, 'es'))
      )
      setLibraryMessage('Tema actualizado.')
    })
  }

  const handleDeleteSong = (songId: string) => {
    if (!window.confirm('Eliminar este tema de la biblioteca? Los setlists conservaran el texto ya guardado.')) {
      return
    }

    setWorkingSongId(songId)
    setLibraryMessage(null)
    startTransition(async () => {
      const response = await deleteSongLibraryItemRequest(bandId, songId)
      setWorkingSongId(null)

      if (!response.ok) {
        setLibraryMessage(response.body?.message || 'No se pudo eliminar el tema.')
        return
      }

      setSongs((current) => current.filter((song) => song.id !== songId))
      setSongDrafts((current) => {
        const next = {...current}
        delete next[songId]
        return next
      })
      if (editingSongId === songId) {
        setEditingSongId(null)
      }
      setLibraryMessage('Tema eliminado.')
    })
  }

  const applyShowPrefill = (showKey: string) => {
    if (!showKey) {
      setCreateSetlistValues((current) => ({...current, linkedShowKey: ''}))
      return
    }

    const show = payload.showPrefills.find((entry) => entry.key === showKey)
    if (!show) {
      return
    }

    setCreateSetlistValues((current) => ({
      ...current,
      linkedShowKey: showKey,
      showDate: show.date.slice(0, 10),
      venueName: show.venue,
      location: show.location || '',
      title: current.title || '',
    }))
  }

  const handleCreateSetlist = () => {
    setSetlistMessage(null)
    startTransition(async () => {
      const response = await createSetlistRequest(bandId, {
        title: createSetlistValues.title,
        showDate: createSetlistValues.showDate,
        venueName: createSetlistValues.venueName,
        location: createSetlistValues.location,
        pressLogoAssetId: createSetlistValues.pressLogoAssetId || undefined,
        linkedShowKey: createSetlistValues.linkedShowKey || undefined,
      })

      if (!response.ok) {
        setSetlistErrors(buildFieldErrors(response.body?.errors))
        setSetlistMessage(response.body?.message || 'No se pudo crear el setlist.')
        return
      }

      const nextSetlist = asSetlistSummary(response.body?.setlist)
      if (!nextSetlist) {
        setSetlistMessage('El setlist se creo, pero no pudimos abrirlo.')
        return
      }

      setSetlists((current) => sortSetlists([nextSetlist, ...current.filter((entry) => entry.id !== nextSetlist.id)]))
      setCreateSetlistValues({
        linkedShowKey: '',
        title: '',
        showDate: '',
        venueName: '',
        location: '',
        pressLogoAssetId: '',
      })
      setSetlistErrors({})
      setSetlistMessage('Setlist creado. Ahora puedes seguir armando los temas en la vista dedicada.')
      openEditor(nextSetlist.id, 'new')
    })
  }

  const handleDeleteSetlist = (setlistId: string) => {
    if (!window.confirm('Eliminar este setlist?')) {
      return
    }

    setWorkingSetlistId(setlistId)
    setSetlistMessage(null)
    startTransition(async () => {
      const response = await deleteSetlistRequest(bandId, setlistId)
      setWorkingSetlistId(null)

      if (!response.ok) {
        setSetlistMessage(response.body?.message || 'No se pudo eliminar el setlist.')
        return
      }

      setSetlists((current) => current.filter((setlist) => setlist.id !== setlistId))
      setSetlistMessage('Setlist eliminado.')
    })
  }

  const handleDuplicateSetlist = (setlistId: string) => {
    setWorkingSetlistId(setlistId)
    setSetlistMessage(null)
    startTransition(async () => {
      const response = await duplicateSetlistRequest(bandId, setlistId)
      setWorkingSetlistId(null)

      if (!response.ok) {
        setSetlistMessage(response.body?.message || 'No se pudo duplicar el setlist.')
        return
      }

      const nextSetlist = asSetlistSummary(response.body?.setlist)
      if (!nextSetlist) {
        setSetlistMessage('El setlist se duplico, pero no pudimos abrirlo.')
        return
      }

      setSetlists((current) => sortSetlists([nextSetlist, ...current.filter((entry) => entry.id !== nextSetlist.id)]))
      setSetlistMessage('Setlist duplicado.')
      openEditor(nextSetlist.id, 'edit')
    })
  }

  return (
    <div className="setlists-workspace">
      <section className="dashboard-card setlists-hub-hero">
        <div>
          <p className="eyebrow">Setlists privadas</p>
          <h2>Biblioteca reusable y hojas A4 listas para imprimir</h2>
          <p className="muted">
            Mantengan el repertorio ordenado una sola vez, creen cada fecha con sus datos base y terminen el armado en una vista dedicada antes de pasar a la preview.
          </p>
        </div>

        <div className="setlists-hub-hero__grid">
          <article className="setlists-hub-metric">
            <span>Temas en biblioteca</span>
            <strong>{songs.length}</strong>
            <small>Listos para reutilizar en cualquier fecha</small>
          </article>
          <article className="setlists-hub-metric">
            <span>Setlists creadas</span>
            <strong>{setlists.length}</strong>
            <small>Con preview A4 e impresion directa</small>
          </article>
          <article className="setlists-hub-metric">
            <span>Logos disponibles</span>
            <strong>{payload.availableLogos.length}</strong>
            <small>Traidos desde Centro de prensa</small>
          </article>
        </div>
      </section>

      <div className="setlists-grid setlists-grid--hub">
        <section className="dashboard-card setlists-card">
          <div className="setlists-card__header">
            <div>
              <p className="eyebrow">Biblioteca de temas</p>
              <h2>Catalogo privado reusable</h2>
              <p className="muted">Carga el repertorio una vez y deja abajo una lista compacta para revisarlo o editarlo sin estirar toda la pantalla.</p>
            </div>
          </div>

          <div className="setlists-library-create">
            <div className="setlists-library-create__header">
              <p className="eyebrow">1. Cargar tema a la biblioteca</p>
              <h3>Primero carga los temas aca</h3>
              <p className="muted">
                Despues apareceran abajo para buscarlos, editarlos y usarlos dentro de un setlist.
              </p>
            </div>

            <div className="setlists-library-form">
              <label className="form-field">
                <span className="form-label">Titulo del tema</span>
                <input
                  className="form-input"
                  value={newSong.title}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setNewSong((current) => ({...current, title: value}))
                  }}
                  placeholder="Nombre del tema"
                />
                <FieldError errors={libraryErrors.title} />
              </label>
              <label className="form-field">
                <span className="form-label">Duracion estimada (segundos)</span>
                <input
                  className="form-input"
                  inputMode="numeric"
                  value={newSong.defaultDurationSeconds}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setNewSong((current) => ({...current, defaultDurationSeconds: value}))
                  }}
                  placeholder="240"
                />
                <FieldError errors={libraryErrors.defaultDurationSeconds} />
              </label>
              <label className="form-field form-field--full">
                <span className="form-label">Nota por defecto</span>
                <textarea
                  className="form-textarea"
                  value={newSong.defaultNotes}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setNewSong((current) => ({...current, defaultNotes: value}))
                  }}
                  placeholder="Afinacion, arranque, corte o referencia util."
                />
                <FieldError errors={libraryErrors.defaultNotes} />
              </label>
              <button className="button button--primary" type="button" disabled={isPending} onClick={handleCreateSong}>
                {isPending ? 'Guardando...' : 'Guardar tema en biblioteca'}
              </button>
            </div>
          </div>

          <div className="setlists-library-saved">
            <div className="setlists-library-saved__header">
              <p className="eyebrow">2. Temas guardados</p>
              <h3>Buscar, revisar y editar temas ya cargados</h3>
              <p className="muted">Los temas de abajo ya estan guardados. Si cambias algo, usa `Guardar` en cada tarjeta.</p>
            </div>

            <div className="setlists-library-toolbar">
              <input
                className="form-input"
                type="search"
                value={libraryQuery}
                onChange={(event) => setLibraryQuery(event.currentTarget.value)}
                placeholder="Buscar temas ya cargados..."
              />
            </div>
          </div>

          {libraryMessage ? <p className="muted">{libraryMessage}</p> : null}

          <div className="setlists-library-list">
            {filteredSongs.length === 0 ? (
              <div className="setlists-empty">
                <h3>Todavia no hay temas cargados</h3>
                <p className="muted">Completa el formulario de arriba y toca `Guardar tema en biblioteca`.</p>
              </div>
            ) : (
              filteredSongs.map((song) => {
                const isWorking = workingSongId === song.id

                return (
                  <article className="setlists-song-row" key={song.id}>
                    <div className="setlists-song-row__copy">
                      <div className="setlists-song-row__headline">
                        <h3>{song.title}</h3>
                        <span className="setlists-song-row__duration">
                          {song.defaultDurationSeconds ? formatSetlistDuration(song.defaultDurationSeconds) : 'Sin duracion'}
                        </span>
                      </div>
                      <p>{summarizeSongNotes(song.defaultNotes)}</p>
                    </div>
                    <div className="setlists-song-row__actions">
                      <button className="button" type="button" disabled={isPending} onClick={() => setEditingSongId(song.id)}>
                        Editar
                      </button>
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={isWorking || isPending}
                        onClick={() => handleDeleteSong(song.id)}
                      >
                        {isWorking ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>

        <section className="dashboard-card setlists-card">
          <div className="setlists-card__header">
            <div>
              <p className="eyebrow">Setlists por fecha</p>
              <h2>Crear hoja A4 para escenario</h2>
              <p className="muted">La parte activa del flujo vive aca: crear la fecha, abrir el editor y mantener a mano las ultimas hojas armadas.</p>
            </div>
            <PendingLink
              className="button"
              href={`/dashboard/bands/${bandId}/press-kit`}
              pendingLabel="Abriendo centro de prensa..."
            >
              Abrir prensa
            </PendingLink>
          </div>

          <div className="setlists-create-feature">
            <div className="setlists-create-feature__header">
              <div>
                <p className="eyebrow">Crear setlist</p>
                <h3>Datos base antes del armado</h3>
                <p className="muted">
                  Carga nombre, fecha, venue, logo y luego abrimos la vista dedicada para elegir canciones, ordenar y pasar a la preview.
                </p>
              </div>
            </div>

            <div className="setlists-create-form">
              <label className="form-field">
                <span className="form-label">Prefill desde shows</span>
                <select
                  className="form-select"
                  value={createSetlistValues.linkedShowKey}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    if (!value) {
                      setCreateSetlistValues((current) => ({...current, linkedShowKey: ''}))
                      return
                    }

                    applyShowPrefill(value)
                  }}
                >
                  <option value="">Sin prefill</option>
                  {payload.showPrefills.map((show) => (
                    <option key={show.key} value={show.key}>
                      {show.date.slice(0, 10)} - {show.venue}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Logo de prensa</span>
                <select
                  className="form-select"
                  value={createSetlistValues.pressLogoAssetId}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setCreateSetlistValues((current) => ({...current, pressLogoAssetId: value}))
                  }}
                >
                  <option value="">Sin logo</option>
                  {payload.availableLogos.map((logo) => (
                    <option key={logo.id} value={logo.id}>
                      {logo.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={setlistErrors.pressLogoAssetId} />
              </label>
              <label className="form-field">
                <span className="form-label">Fecha</span>
                <input
                  className="form-input"
                  type="date"
                  value={createSetlistValues.showDate}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setCreateSetlistValues((current) => ({...current, showDate: value}))
                  }}
                />
                <FieldError errors={setlistErrors.showDate} />
              </label>
              <label className="form-field">
                <span className="form-label">Venue</span>
                <input
                  className="form-input"
                  value={createSetlistValues.venueName}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setCreateSetlistValues((current) => ({...current, venueName: value}))
                  }}
                  placeholder="Lugar donde tocan"
                />
                <FieldError errors={setlistErrors.venueName} />
              </label>
              <label className="form-field">
                <span className="form-label">Ubicacion</span>
                <input
                  className="form-input"
                  value={createSetlistValues.location}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setCreateSetlistValues((current) => ({...current, location: value}))
                  }}
                  placeholder="Ciudad"
                />
                <FieldError errors={setlistErrors.location} />
              </label>
              <label className="form-field">
                <span className="form-label">Titulo opcional</span>
                <input
                  className="form-input"
                  value={createSetlistValues.title}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setCreateSetlistValues((current) => ({...current, title: value}))
                  }}
                  placeholder="Set principal / version acustica"
                />
                <FieldError errors={setlistErrors.title} />
              </label>
              <button className="button button--primary" type="button" disabled={isPending} onClick={handleCreateSetlist}>
                {isPending ? 'Creando...' : 'Crear y abrir editor'}
              </button>
            </div>
          </div>

          {setlistMessage ? <p className="muted">{setlistMessage}</p> : null}

          <div className="setlists-list">
            {setlists.length === 0 ? (
              <div className="setlists-empty">
                <h3>No hay setlists creados</h3>
                <p className="muted">Crea la primera hoja A4 y luego arma sus canciones en la vista dedicada antes de imprimir.</p>
              </div>
            ) : (
              <div className="setlists-list-grid">
                {setlists.map((setlist) => (
                  <article className="setlists-card-item" key={setlist.id}>
                    <div className="setlists-card-item__copy">
                      <div className="setlists-card-item__topline">
                        <p className="eyebrow">{formatCompactSetlistDate(setlist.showDate)}</p>
                        <span className="setlists-card-item__pill">
                          {setlist.itemCount} {setlist.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <h3>{setlist.title || setlist.venueName}</h3>
                      <p className="muted">
                        {setlist.venueName}
                        {setlist.location ? ` - ${setlist.location}` : ''}
                      </p>
                      <p className="muted">
                        {setlist.pressLogoAssetId ? 'Con logo de prensa listo para imprimir.' : 'Sin logo de prensa asignado.'}
                      </p>
                    </div>
                    <div className="setlists-card-item__actions">
                      <button className="button button--primary" type="button" onClick={() => openEditor(setlist.id, 'edit')}>
                        Editar
                      </button>
                      <PendingLink
                        className="button"
                        href={`/dashboard/bands/${bandId}/setlists/${setlist.id}/print`}
                        pendingLabel="Abriendo vista A4..."
                      >
                        A4
                      </PendingLink>
                      <button
                        className="button"
                        type="button"
                        disabled={workingSetlistId === setlist.id || isPending}
                        onClick={() => handleDuplicateSetlist(setlist.id)}
                      >
                        Duplicar
                      </button>
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={workingSetlistId === setlist.id || isPending}
                        onClick={() => handleDeleteSetlist(setlist.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <SetlistSongEditSheet
        draft={editingSongDraft}
        isPending={isPending && workingSongId === editingSong?.id}
        song={editingSong}
        onChange={(nextDraft) => {
          if (!editingSong) {
            return
          }

          setSongDrafts((current) => ({
            ...current,
            [editingSong.id]: nextDraft,
          }))
        }}
        onClose={() => setEditingSongId(null)}
        onDelete={handleDeleteSong}
        onSave={handleSaveSong}
      />
    </div>
  )
}

function SetlistSongEditSheet({
  song,
  draft,
  isPending,
  onChange,
  onClose,
  onDelete,
  onSave,
}: {
  song: BandSongLibraryItem | null
  draft: SongDraft | null
  isPending: boolean
  onChange: (draft: SongDraft) => void
  onClose: () => void
  onDelete: (songId: string) => void
  onSave: (songId: string) => void
}) {
  if (!song || !draft) {
    return null
  }

  return (
    <div className="demos-sheet setlists-inline-sheet" role="dialog" aria-modal="true" aria-label="Editar tema de la biblioteca">
      <button className="demos-sheet__backdrop" type="button" onClick={onClose} aria-label="Cerrar edicion del tema" />
      <div className="demos-sheet__panel demos-sheet__panel--dialog setlists-inline-sheet__panel">
        <div className="setlists-item-sheet__header">
          <div>
            <p className="eyebrow">Editar tema</p>
            <h2>{song.title}</h2>
            <p className="muted">Actualiza el titulo, la duracion estimada o la nota por defecto sin abrir toda la tarjeta en la pantalla principal.</p>
          </div>
        </div>

        <div className="setlists-item-sheet__form">
          <label className="form-field">
            <span className="form-label">Tema</span>
            <input
              className="form-input"
              value={draft.title}
              onChange={(event) => onChange({...draft, title: event.currentTarget.value})}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Duracion estimada (segundos)</span>
            <input
              className="form-input"
              inputMode="numeric"
              value={draft.defaultDurationSeconds}
              onChange={(event) => onChange({...draft, defaultDurationSeconds: event.currentTarget.value})}
              placeholder="240"
            />
            <small>{formatSetlistDuration(parseSeconds(draft.defaultDurationSeconds))}</small>
          </label>

          <label className="form-field">
            <span className="form-label">Nota por defecto</span>
            <textarea
              className="form-textarea"
              value={draft.defaultNotes}
              onChange={(event) => onChange({...draft, defaultNotes: event.currentTarget.value})}
              placeholder="Afinacion, arranque, corte o referencia util."
            />
          </label>
        </div>

        <div className="setlists-item-sheet__footer">
          <button
            className="button button--ghost"
            type="button"
            disabled={isPending}
            onClick={() => {
              if (window.confirm('Eliminar este tema de la biblioteca? Los setlists conservaran el texto ya guardado.')) {
                onDelete(song.id)
              }
            }}
          >
            Eliminar
          </button>
          <button className="button" type="button" onClick={onClose} disabled={isPending}>
            Cancelar
          </button>
          <button className="button button--primary" type="button" onClick={() => onSave(song.id)} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

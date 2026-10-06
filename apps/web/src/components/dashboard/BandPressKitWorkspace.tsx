'use client'

import type {
  BandPressKitPayload,
  BandPrivateAsset,
  BandInternalKitLinkKind,
  PressKitSharePreset,
} from '@web-bands/bands-domain'

import {useState, type ChangeEvent, type FormEvent} from 'react'

import {createBandEditorKey} from '@/lib/bands/content'
import {
  createPressKitShareLinkRequest,
  deletePressKitAssetRequest,
  updatePressKitRequest,
  uploadPressKitAssetRequest,
  type PressKitValidationIssue,
} from '@/lib/dashboard/press-kit-api'

type PressKitFormValues = {
  shortPitch: string
  bioShort: string
  bioLong: string
  shareNotes: string
  contactName: string
  contactEmail: string
  contactPhone: string
  bookingNotes: string
  keyLinks: Array<{
    _key: string
    label: string
    url: string
    kind: BandInternalKitLinkKind
  }>
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'finalizing'

function buildFormValues(payload: BandPressKitPayload): PressKitFormValues {
  return {
    shortPitch: payload.internalKit.shortPitch || '',
    bioShort: payload.internalKit.bioShort || '',
    bioLong: payload.internalKit.bioLong || '',
    shareNotes: payload.internalKit.shareNotes || '',
    contactName: payload.internalKit.contactName || '',
    contactEmail: payload.internalKit.contactEmail || '',
    contactPhone: payload.internalKit.contactPhone || '',
    bookingNotes: payload.internalKit.bookingNotes || '',
    keyLinks: (payload.internalKit.keyLinks || []).map((link, index) => ({
      _key: link._key || createBandEditorKey(`press-link-${index}`),
      label: link.label || '',
      url: link.url || '',
      kind: link.kind || 'other',
    })),
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatPresetLabel(preset: PressKitSharePreset) {
  if (preset === '1h') {
    return '1 hora'
  }

  if (preset === '24h') {
    return '24 horas'
  }

  return '7 dias'
}

function buildFieldErrors(errors: unknown) {
  if (!Array.isArray(errors)) {
    return {}
  }

  return errors.reduce<Record<string, string[]>>((result, error) => {
    const typedError = error as PressKitValidationIssue
    if (!typedError?.path || !typedError?.message) {
      return result
    }

    result[typedError.path] = [...(result[typedError.path] || []), typedError.message]
    return result
  }, {})
}

function legacyCopyToClipboard(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  textarea.style.inset = '-9999px'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, value.length)

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  return legacyCopyToClipboard(value)
}

function FieldError({errors}: {errors?: string[]}) {
  if (!errors?.length) {
    return null
  }

  return <p className="field-error">{errors[0]}</p>
}

export function BandPressKitWorkspace({
  bandId,
  payload,
}: {
  bandId: string
  payload: BandPressKitPayload
}) {
  const [values, setValues] = useState<PressKitFormValues>(() => buildFormValues(payload))
  const [baseline, setBaseline] = useState<PressKitFormValues>(() => buildFormValues(payload))
  const [assets, setAssets] = useState<BandPrivateAsset[]>(payload.assets)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<PressKitSharePreset>('24h')
  const [uploadLabel, setUploadLabel] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [riderFile, setRiderFile] = useState<File | null>(null)
  const [riderPhase, setRiderPhase] = useState<UploadPhase>('idle')
  const [riderMessage, setRiderMessage] = useState<string | null>(null)
  const [workingAssetId, setWorkingAssetId] = useState<string | null>(null)

  const logos = assets.filter((asset) => asset.kind === 'logo')
  const technicalRider = assets.find((asset) => asset.kind === 'technical_rider') || null
  const hasPendingChanges = JSON.stringify(values) !== JSON.stringify(baseline)
  const checklist = [
    {
      label: 'Logo PNG cargado',
      done: logos.length > 0,
    },
    {
      label: 'Biografia corta completa',
      done: values.bioShort.trim().length > 0,
    },
    {
      label: 'Biografia larga completa',
      done: values.bioLong.trim().length > 0,
    },
    {
      label: 'Al menos un link util',
      done: values.keyLinks.some((link) => link.label.trim() && link.url.trim()),
    },
    {
      label: 'Texto listo para compartir',
      done: values.shareNotes.trim().length > 0,
    },
    {
      label: 'Rider tecnico cargado',
      done: Boolean(technicalRider),
    },
  ]
  const completedCount = checklist.filter((item) => item.done).length
  const completionRatio = Math.round((completedCount / checklist.length) * 100)
  const nextMissingItem = checklist.find((item) => !item.done)

  const setFieldValue = (field: keyof PressKitFormValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
    setFieldErrors((current) => {
      const next = {...current}
      delete next[field]
      return next
    })
    setSaveState('idle')
    setSaveMessage(null)
  }

  const handleLinkChange = (
    index: number,
    field: keyof PressKitFormValues['keyLinks'][number],
    value: string
  ) => {
    setValues((current) => ({
      ...current,
      keyLinks: current.keyLinks.map((link, linkIndex) =>
        linkIndex === index ? {...link, [field]: value} : link
      ),
    }))
    setSaveState('idle')
    setSaveMessage(null)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveState('saving')
    setSaveMessage(null)
    setCopyFeedback(null)
    setShareFeedback(null)

    const response = await updatePressKitRequest(bandId, values)
    if (!response.ok) {
      const nextFieldErrors = buildFieldErrors(response.body?.errors)
      setFieldErrors(nextFieldErrors)
      setSaveState('error')
      setSaveMessage(response.body?.message || 'No se pudo guardar el centro de prensa.')
      return
    }

    setBaseline(values)
    setFieldErrors({})
    setSaveState('saved')
    setSaveMessage('Centro de prensa guardado.')
  }

  const handleCopy = async (label: string, value: string) => {
    if (!value.trim()) {
      setCopyFeedback(`No hay contenido en ${label.toLowerCase()}.`)
      return
    }

    try {
      const copied = await copyText(value)
      setCopyFeedback(copied ? `${label} copiado.` : `No pudimos copiar ${label.toLowerCase()}.`)
    } catch {
      setCopyFeedback(`No pudimos copiar ${label.toLowerCase()}.`)
    }
  }

  const handleUploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0] || null
    setUploadFile(nextFile)
    if (nextFile && !uploadLabel.trim()) {
      setUploadLabel(nextFile.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadMessage('Selecciona un logo PNG antes de subir.')
      return
    }

    if (!uploadLabel.trim()) {
      setUploadMessage('Ponle un nombre al logo para organizar la biblioteca.')
      return
    }

    setUploadMessage(null)
    const response = await uploadPressKitAssetRequest(
      bandId,
      {
        kind: 'logo',
        label: uploadLabel.trim(),
        file: uploadFile,
      },
      {
        onPhaseChange: (phase) => {
          setUploadPhase(phase)
        },
      }
    )

    if (!response.ok || !response.body?.asset) {
      setUploadPhase('idle')
      setUploadMessage(response.body?.errors?.[0]?.message || response.body?.message || 'No se pudo subir el logo.')
      return
    }

    setAssets((current) => [response.body!.asset as BandPrivateAsset, ...current])
    setUploadFile(null)
    setUploadLabel('')
    setUploadPhase('idle')
    setUploadMessage('Logo cargado al centro de prensa.')
  }

  const handleRiderUpload = async () => {
    if (!riderFile) {
      setRiderMessage('Selecciona un PDF antes de subir.')
      return
    }

    setRiderMessage(null)
    const response = await uploadPressKitAssetRequest(
      bandId,
      {
        kind: 'technical_rider',
        label: 'Rider tecnico',
        file: riderFile,
      },
      {
        onPhaseChange: setRiderPhase,
      }
    )

    if (!response.ok || !response.body?.asset) {
      setRiderPhase('idle')
      setRiderMessage(response.body?.errors?.[0]?.message || response.body?.message || 'No se pudo subir el rider.')
      return
    }

    const nextRider = response.body.asset as BandPrivateAsset
    setAssets((current) => [nextRider, ...current.filter((asset) => asset.kind !== 'technical_rider')])
    setRiderFile(null)
    setRiderPhase('idle')
    setRiderMessage(technicalRider ? 'Rider tecnico reemplazado.' : 'Rider tecnico cargado.')
  }

  const handleDeleteAsset = async (assetId: string) => {
    const asset = assets.find((current) => current.id === assetId)
    const assetLabel = asset?.kind === 'technical_rider' ? 'rider tecnico' : 'logo'
    if (!window.confirm(`Eliminar este ${assetLabel} del centro de prensa?`)) {
      return
    }

    setWorkingAssetId(assetId)
    setShareFeedback(null)
    const response = await deletePressKitAssetRequest(bandId, assetId)
    setWorkingAssetId(null)

    if (!response.ok) {
      setShareFeedback(response.body?.message || `No se pudo eliminar el ${assetLabel}.`)
      return
    }

    setAssets((current) => current.filter((asset) => asset.id !== assetId))
    setShareFeedback(`${assetLabel === 'logo' ? 'Logo' : 'Rider tecnico'} eliminado.`)
  }

  const handleShareLink = async (assetId: string, mode: 'copy' | 'download') => {
    setWorkingAssetId(assetId)
    setShareFeedback(null)

    const response = await createPressKitShareLinkRequest(bandId, assetId, selectedPreset)
    setWorkingAssetId(null)

    if (!response.ok || !response.body?.share) {
      setShareFeedback(response.body?.message || 'No se pudo generar el link temporal.')
      return
    }

    if (mode === 'download') {
      window.open(response.body.share.url, '_blank', 'noopener,noreferrer')
      setShareFeedback(`Descarga preparada con vigencia de ${formatPresetLabel(selectedPreset)}.`)
      return
    }

    try {
      const copied = await copyText(response.body.share.url)
      setShareFeedback(
        copied
          ? `Link temporal copiado. Vence en ${formatPresetLabel(selectedPreset)}.`
          : 'No pudimos copiar el link temporal.'
      )
    } catch {
      setShareFeedback('No pudimos copiar el link temporal.')
    }
  }

  return (
    <form className="press-kit-workspace" onSubmit={handleSave}>
      <section className="dashboard-card press-kit-summary-card">
        <div className="press-kit-summary-card__header">
          <div>
            <p className="eyebrow">Estado del kit</p>
            <h2 className="press-kit-summary-card__title">{completionRatio}% listo para compartir</h2>
            <p className="muted">
              {nextMissingItem
                ? `Siguiente pendiente: ${nextMissingItem.label}.`
                : 'El centro de prensa ya tiene lo esencial para compartir con terceros.'}
            </p>
          </div>
          <div className="press-kit-summary-card__meta">
            <strong>{completedCount}/{checklist.length}</strong>
            <span>items completos</span>
          </div>
        </div>
        <div className="press-kit-summary-card__progress" aria-hidden="true">
          <span style={{width: `${completionRatio}%`}} />
        </div>
        <div className="press-kit-checklist">
          {checklist.map((item) => (
            <div
              className={`press-kit-checklist__item${item.done ? ' press-kit-checklist__item--done' : ''}`}
              key={item.label}
            >
              <span className="press-kit-checklist__dot" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="press-kit-grid">
        <section className="dashboard-card press-kit-card">
          <div className="press-kit-card__header">
            <div>
              <p className="eyebrow">Biografias</p>
              <h2>Textos listos para copiar</h2>
            </div>
            <div className="press-kit-card__actions">
              <button
                className="button"
                type="button"
                onClick={() => void handleCopy('Biografia corta', values.bioShort)}
              >
                Copiar bio corta
              </button>
              <button
                className="button"
                type="button"
                onClick={() => void handleCopy('Biografia larga', values.bioLong)}
              >
                Copiar bio larga
              </button>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-label">Pitch interno</span>
              <textarea
                className="form-textarea"
                value={values.shortPitch}
                onChange={(event) => setFieldValue('shortPitch', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.shortPitch} />
            </label>
            <label className="form-field form-field--full">
              <span className="form-label">Biografia corta</span>
              <textarea
                className="form-textarea"
                value={values.bioShort}
                onChange={(event) => setFieldValue('bioShort', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.bioShort} />
            </label>
            <label className="form-field form-field--full">
              <span className="form-label">Biografia larga</span>
              <textarea
                className="form-textarea press-kit-textarea--lg"
                value={values.bioLong}
                onChange={(event) => setFieldValue('bioLong', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.bioLong} />
            </label>
          </div>
        </section>

        <section className="dashboard-card press-kit-card">
          <div className="press-kit-card__header">
            <div>
              <p className="eyebrow">Logos</p>
              <h2>Biblioteca PNG privada</h2>
              <p className="muted">Solo se aceptan PNG de hasta 20 MB. Cada logo puede generar un link temporal vencible.</p>
            </div>
            <label className="form-field press-kit-preset-field">
              <span className="form-label">Vigencia de links</span>
              <select
                className="form-select"
                value={selectedPreset}
                onChange={(event) => setSelectedPreset(event.currentTarget.value as PressKitSharePreset)}
              >
                <option value="1h">1 hora</option>
                <option value="24h">24 horas</option>
                <option value="7d">7 dias</option>
              </select>
            </label>
          </div>
          <div className="press-kit-upload">
            <label className="form-field">
              <span className="form-label">Nombre del logo</span>
              <input
                className="form-input"
                value={uploadLabel}
                onChange={(event) => setUploadLabel(event.currentTarget.value)}
                placeholder="Logo principal transparente"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Archivo PNG</span>
              <input className="form-input" accept="image/png" type="file" onChange={handleUploadFileChange} />
            </label>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void handleUpload()}
              disabled={uploadPhase !== 'idle'}
            >
              {uploadPhase === 'preparing'
                ? 'Preparando upload...'
                : uploadPhase === 'uploading'
                  ? 'Subiendo logo...'
                  : uploadPhase === 'finalizing'
                    ? 'Guardando logo...'
                    : 'Subir logo PNG'}
            </button>
          </div>
          {uploadMessage ? <p className="muted">{uploadMessage}</p> : null}
          <div className="press-kit-assets">
            {logos.length === 0 ? (
              <div className="press-kit-empty">
                <h3>No hay logos cargados</h3>
                <p className="muted">Sube al menos un PNG para completar el kit y compartirlo con un link temporal.</p>
              </div>
            ) : (
              logos.map((asset) => (
                <article className="press-kit-asset-card" key={asset.id}>
                  <div className="press-kit-asset-card__preview">
                    {asset.previewUrl ? (
                      <img alt={asset.label} src={asset.previewUrl} />
                    ) : (
                      <div className="press-kit-asset-card__placeholder">PNG</div>
                    )}
                  </div>
                  <div className="press-kit-asset-card__copy">
                    <strong>{asset.label}</strong>
                    <span>{asset.originalFileName}</span>
                    <span>{formatBytes(asset.fileSizeBytes)}</span>
                  </div>
                  <div className="press-kit-asset-card__actions">
                    <button
                      className="button"
                      type="button"
                      disabled={workingAssetId === asset.id}
                      onClick={() => void handleShareLink(asset.id, 'download')}
                    >
                      Descargar
                    </button>
                    <button
                      className="button"
                      type="button"
                      disabled={workingAssetId === asset.id}
                      onClick={() => void handleShareLink(asset.id, 'copy')}
                    >
                      Generar link
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      disabled={workingAssetId === asset.id}
                      onClick={() => void handleDeleteAsset(asset.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-card press-kit-card">
          <div className="press-kit-card__header">
            <div>
              <p className="eyebrow">Rider tecnico</p>
              <h2>PDF vigente para venues y produccion</h2>
              <p className="muted">
                Guarda un unico rider oficial de hasta 25 MB. Al subir otro, el anterior se reemplaza solo
                cuando el nuevo queda guardado correctamente.
              </p>
            </div>
          </div>

          <div className="press-kit-upload press-kit-upload--rider">
            <label className="form-field">
              <span className="form-label">Archivo PDF</span>
              <input
                className="form-input"
                accept="application/pdf,.pdf"
                type="file"
                onChange={(event) => setRiderFile(event.currentTarget.files?.[0] || null)}
              />
            </label>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void handleRiderUpload()}
              disabled={riderPhase !== 'idle'}
            >
              {riderPhase === 'preparing'
                ? 'Preparando upload...'
                : riderPhase === 'uploading'
                  ? 'Subiendo rider...'
                  : riderPhase === 'finalizing'
                    ? 'Guardando rider...'
                    : technicalRider
                      ? 'Reemplazar rider PDF'
                      : 'Subir rider PDF'}
            </button>
          </div>
          {riderMessage ? <p className="muted">{riderMessage}</p> : null}

          <div className="press-kit-assets">
            {technicalRider ? (
              <article className="press-kit-asset-card press-kit-asset-card--document">
                <div className="press-kit-asset-card__preview press-kit-asset-card__preview--document">PDF</div>
                <div className="press-kit-asset-card__copy">
                  <strong>Rider tecnico vigente</strong>
                  <span>{technicalRider.originalFileName}</span>
                  <span>{formatBytes(technicalRider.fileSizeBytes)}</span>
                </div>
                <div className="press-kit-asset-card__actions">
                  <button
                    className="button"
                    type="button"
                    disabled={workingAssetId === technicalRider.id}
                    onClick={() => void handleShareLink(technicalRider.id, 'download')}
                  >
                    Ver / Descargar
                  </button>
                  <button
                    className="button"
                    type="button"
                    disabled={workingAssetId === technicalRider.id}
                    onClick={() => void handleShareLink(technicalRider.id, 'copy')}
                  >
                    Generar link
                  </button>
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={workingAssetId === technicalRider.id}
                    onClick={() => void handleDeleteAsset(technicalRider.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ) : (
              <div className="press-kit-empty">
                <h3>No hay un rider tecnico cargado</h3>
                <p className="muted">Sube el PDF que la banda envia a venues, tecnicos y produccion.</p>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card press-kit-card">
          <div className="press-kit-card__header">
            <div>
              <p className="eyebrow">Recursos</p>
              <h2>Notas, contacto y links</h2>
            </div>
            <button
              className="button"
              type="button"
              onClick={() => void handleCopy('Notas para compartir', values.shareNotes)}
            >
              Copiar notas
            </button>
          </div>
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-label">Texto listo para compartir</span>
              <textarea
                className="form-textarea"
                value={values.shareNotes}
                onChange={(event) => setFieldValue('shareNotes', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.shareNotes} />
            </label>
            <label className="form-field">
              <span className="form-label">Nombre de contacto</span>
              <input
                className="form-input"
                value={values.contactName}
                onChange={(event) => setFieldValue('contactName', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.contactName} />
            </label>
            <label className="form-field">
              <span className="form-label">Email de contacto</span>
              <input
                className="form-input"
                value={values.contactEmail}
                onChange={(event) => setFieldValue('contactEmail', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.contactEmail} />
            </label>
            <label className="form-field">
              <span className="form-label">Telefono de contacto</span>
              <input
                className="form-input"
                value={values.contactPhone}
                onChange={(event) => setFieldValue('contactPhone', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.contactPhone} />
            </label>
            <label className="form-field form-field--full">
              <span className="form-label">Notas internas</span>
              <textarea
                className="form-textarea"
                value={values.bookingNotes}
                onChange={(event) => setFieldValue('bookingNotes', event.currentTarget.value)}
              />
              <FieldError errors={fieldErrors.bookingNotes} />
            </label>
          </div>
          <div className="press-kit-links">
            <div className="row-actions row-actions--split">
              <div>
                <h3 className="press-kit-links__title">Links clave</h3>
                <p className="muted">Drive, press, demos o cualquier recurso que necesiten abrir rapido.</p>
              </div>
              <button
                className="button"
                type="button"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    keyLinks: [
                      ...current.keyLinks,
                      {_key: createBandEditorKey('press-link'), label: '', url: '', kind: 'other'},
                    ],
                  }))
                }
              >
                Agregar link
              </button>
            </div>
            {values.keyLinks.length === 0 ? (
              <div className="press-kit-empty">
                <p className="muted">Todavia no hay links privados cargados.</p>
              </div>
            ) : (
              values.keyLinks.map((link, index) => (
                <div className="press-kit-link-row" key={link._key}>
                  <input
                    className="form-input"
                    placeholder="Etiqueta"
                    value={link.label}
                    onChange={(event) => handleLinkChange(index, 'label', event.currentTarget.value)}
                  />
                  <select
                    className="form-select"
                    value={link.kind}
                    onChange={(event) => handleLinkChange(index, 'kind', event.currentTarget.value)}
                  >
                    <option value="press">Press</option>
                    <option value="demo">Demo</option>
                    <option value="drive">Drive</option>
                    <option value="instagram">Instagram</option>
                    <option value="spotify">Spotify</option>
                    <option value="youtube">YouTube</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    className="form-input press-kit-link-row__url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(event) => handleLinkChange(index, 'url', event.currentTarget.value)}
                  />
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() =>
                      setValues((current) => ({
                        ...current,
                        keyLinks: current.keyLinks.filter((entry) => entry._key !== link._key),
                      }))
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
            <FieldError errors={fieldErrors.keyLinks} />
          </div>
        </section>
      </div>

      <section className="dashboard-card press-kit-savebar" aria-live="polite">
        <div>
          <p className="eyebrow">Acciones rapidas</p>
          <h2>{hasPendingChanges ? 'Hay cambios pendientes' : 'Todo guardado'}</h2>
          <p className="muted">
            {saveState === 'saving'
              ? 'Guardando informacion privada del centro de prensa...'
              : saveMessage || 'Desde aca guardas biografias, notas y links privados de la banda.'}
          </p>
          {copyFeedback ? <p className="muted">{copyFeedback}</p> : null}
          {shareFeedback ? <p className="muted">{shareFeedback}</p> : null}
        </div>
        <div className="press-kit-savebar__actions">
          <span className={`press-kit-savebar__status press-kit-savebar__status--${saveState}`}>
            {saveState === 'saving'
              ? 'Guardando...'
              : saveState === 'saved'
                ? 'Guardado'
                : saveState === 'error'
                  ? 'Con errores'
                  : hasPendingChanges
                    ? 'Pendiente'
                    : 'Sin cambios'}
          </span>
          <button
            className="button button--primary"
            disabled={saveState === 'saving' || !hasPendingChanges}
            type="submit"
          >
            {saveState === 'saving' ? 'Guardando...' : 'Guardar centro de prensa'}
          </button>
        </div>
      </section>
    </form>
  )
}

'use client'

import type {BandPublicSectionKey} from '@/lib/bands/presentation'

const SECTION_LABELS: Record<BandPublicSectionKey, string> = {
  featured: 'Lanzamiento destacado',
  listen: 'Escuchanos',
  about: 'Historia',
  members: 'Integrantes',
  timeline: 'Timeline',
  shows: 'Shows',
  gallery: 'Galeria',
  contact: 'Contacto',
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, movedItem)
  return nextItems
}

export function SectionOrderEditor({
  value,
  onChange,
}: {
  value: BandPublicSectionKey[]
  onChange: (nextValue: BandPublicSectionKey[]) => void
}) {
  return (
    <div className="section-order-list">
      {value.map((sectionKey, index) => (
        <div
          className="section-order-item"
          key={sectionKey}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', sectionKey)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(event) => {
            event.preventDefault()
            const draggedKey = event.dataTransfer.getData('text/plain') as BandPublicSectionKey
            const fromIndex = value.indexOf(draggedKey)
            onChange(reorderItems(value, fromIndex, index))
          }}
        >
          <div className="section-order-item__meta">
            <span className="section-order-item__handle" aria-hidden="true">
              ::
            </span>
            <div>
              <strong>{SECTION_LABELS[sectionKey]}</strong>
              <p className="muted">Seccion publica configurable</p>
            </div>
          </div>
          <div className="section-order-item__actions">
            <button
              className="button"
              type="button"
              onClick={() => {
                onChange(reorderItems(value, index, index - 1))
              }}
              disabled={index === 0}
            >
              Subir
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                onChange(reorderItems(value, index, index + 1))
              }}
              disabled={index === value.length - 1}
            >
              Bajar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

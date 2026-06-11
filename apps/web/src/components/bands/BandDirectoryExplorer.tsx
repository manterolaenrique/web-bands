'use client'

import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react'

import type {PublicBandListItem} from '@/types/band'

import {BandCard} from './BandCard'

function normalizeGenre(value: string | undefined) {
  return value?.trim() || 'Sin genero'
}

export function BandDirectoryExplorer({
  bands,
  variant = 'desktop',
  autoFocusSearch = false,
  searchInputId,
}: {
  bands: PublicBandListItem[]
  variant?: 'desktop' | 'mobile'
  autoFocusSearch?: boolean
  searchInputId?: string
}) {
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('Todos')
  const deferredQuery = useDeferredValue(query)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const genres = useMemo(() => {
    return ['Todos', ...Array.from(new Set(bands.map((band) => normalizeGenre(band.genero)))).sort()]
  }, [bands])

  const filteredBands = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return bands.filter((band) => {
      const matchesGenre = activeGenre === 'Todos' || normalizeGenre(band.genero) === activeGenre
      const haystack = [band.nombre, band.genero, band.heroTitle, band.slug?.current]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery)

      return matchesGenre && matchesQuery
    })
  }, [activeGenre, bands, deferredQuery])

  useEffect(() => {
    if (!autoFocusSearch || !searchInputRef.current) {
      return
    }

    searchInputRef.current.scrollIntoView({behavior: 'smooth', block: 'center'})
    searchInputRef.current.focus()
    searchInputRef.current.select()
  }, [autoFocusSearch])

  if (variant === 'mobile') {
    return (
      <>
        <section className="mobile-directory-toolbar reveal reveal--visible">
          <div className="mobile-directory-search">
            <input
              id={searchInputId}
              ref={searchInputRef}
              className="mobile-directory-search__input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Buscar bandas..."
              aria-label="Buscar bandas"
            />
          </div>
          <div className="mobile-directory-chip-row" role="tablist" aria-label="Filtrar por genero">
            {genres.map((genre) => {
              const isActive = genre === activeGenre

              return (
                <button
                  key={genre}
                  type="button"
                  className={`mobile-directory-chip${isActive ? ' mobile-directory-chip--active' : ''}`}
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </section>

        {filteredBands.length === 0 ? (
          <div className="empty-state reveal reveal--visible">
            <h2>No encontramos bandas para esa busqueda</h2>
            <p className="muted">Proba con otro genero, otro nombre o limpia los filtros activos.</p>
          </div>
        ) : (
          <div className="mobile-band-grid">
            {filteredBands.map((band, index) => (
              <BandCard key={band._id} band={band} index={index} variant="mobile" />
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <section className="directory-toolbar reveal reveal--visible">
          <div className="directory-search">
            <span className="directory-search__icon" aria-hidden="true">
              /
            </span>
            <input
              id={searchInputId}
              ref={searchInputRef}
              className="directory-search__input"
              type="text"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Buscar por nombre, genero o slug..."
            aria-label="Buscar bandas"
          />
        </div>
        <div className="directory-chip-row" role="tablist" aria-label="Filtrar por genero">
          {genres.map((genre) => {
            const isActive = genre === activeGenre

            return (
              <button
                key={genre}
                type="button"
                className={`directory-chip${isActive ? ' directory-chip--active' : ''}`}
                onClick={() => setActiveGenre(genre)}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </section>

      {filteredBands.length === 0 ? (
        <div className="empty-state reveal reveal--visible">
          <h2>No encontramos bandas para esa busqueda</h2>
          <p className="muted">Proba con otro genero, otro nombre o limpia los filtros activos.</p>
        </div>
      ) : (
        <div className="band-grid">
          {filteredBands.map((band, index) => (
            <BandCard key={band._id} band={band} index={index} />
          ))}
        </div>
      )}
    </>
  )
}

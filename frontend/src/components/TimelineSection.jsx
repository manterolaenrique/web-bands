import React, { useState, useEffect, useRef } from 'react'
import { getGalleryImageUrl } from '../utils/sanityImage'
import { getSecondaryColors } from '../utils/colorUtils'

const TimelineSection = ({ timelineSection, colores }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null)
  const [activeEvent, setActiveEvent] = useState(null)
  const timelineRef = useRef(null)
  const scrollContainerRef = useRef(null)

  // Validaciones defensivas
  if (!timelineSection?.enabled || !timelineSection?.events?.length) {
    return null
  }

  const secondaryColors = getSecondaryColors(colores)

  // Ordenar eventos por fecha y validar datos
  const sortedEvents = timelineSection.events
    .filter(event => event?.name && event?.date) // Filtrar eventos válidos
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (sortedEvents.length === 0) {
    return null
  }

  // Función para obtener iconos según el tipo de evento (fallback)
  const getEventIcon = (event, importance) => {
    // DEBUG: Verificar qué datos llegan del evento
    console.log('Evento recibido:', event)
    console.log('Icono del evento:', event?.icon)
    
    // Si hay un icono configurado en Sanity, usarlo PRIORITARIAMENTE
    if (event?.icon && event.icon.trim() !== '') {
      console.log('Usando icono de Sanity:', event.icon)
      return event.icon
    }
    
    // Fallback a la lógica automática basada en el nombre
    const name = event?.name?.toLowerCase() || ''
    console.log('Nombre del evento para fallback:', name)
    
    // Iconos contextuales según el contenido del nombre
    if (name.includes('concierto') || name.includes('show') || name.includes('gig')) return '🎤'
    if (name.includes('álbum') || name.includes('disco') || name.includes('cd')) return '💿'
    if (name.includes('single') || name.includes('canción')) return '🎵'
    if (name.includes('video') || name.includes('clip') || name.includes('youtube')) return '🎬'
    if (name.includes('premio') || name.includes('reconocimiento')) return '🏆'
    if (name.includes('inicio') || name.includes('formación') || name.includes('banda')) return '🎸'
    if (name.includes('tour') || name.includes('gira')) return '🚌'
    if (name.includes('colaboración') || name.includes('feat')) return '🤝'
    
    // Iconos por importancia si no hay contexto específico
    switch (importance) {
      case 'principal': return '⭐'
      case 'secundario': return '🎯'
      case 'tercero': return '📅'
      default: return '📌'
    }
  }

  // Función para obtener estilos según la importancia
  const getEventStyles = (importance) => {
    const baseStyles = {
      transition: 'all var(--transition-normal)',
      cursor: 'pointer',
    }

    switch (importance) {
      case 'principal':
        return {
          ...baseStyles,
          circleSize: 'clamp(60px, 8vw, 80px)',
          fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
          fontWeight: 'bold',
          color: colores?.primario || 'var(--color-primary)',
          backgroundColor: colores?.primario || 'var(--color-primary)',
          shadow: 'var(--shadow-lg)',
        }
      case 'secundario':
        return {
          ...baseStyles,
          circleSize: 'clamp(50px, 6vw, 60px)',
          fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
          fontWeight: '600',
          color: colores?.secundario || 'var(--color-secondary)',
          backgroundColor: colores?.secundario || 'var(--color-secondary)',
          shadow: 'var(--shadow-md)',
        }
      case 'tercero':
        return {
          ...baseStyles,
          circleSize: 'clamp(40px, 5vw, 50px)',
          fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
          fontWeight: '500',
          color: secondaryColors.light || 'var(--color-gray-600)',
          backgroundColor: secondaryColors.light || 'var(--color-gray-600)',
          shadow: 'var(--shadow-sm)',
        }
      default:
        return {
          ...baseStyles,
          circleSize: 'clamp(45px, 5.5vw, 55px)',
          fontSize: 'clamp(0.8rem, 1.6vw, 1rem)',
          fontWeight: '500',
          color: 'var(--color-gray-700)',
          backgroundColor: 'var(--color-gray-700)',
          shadow: 'var(--shadow-sm)',
        }
    }
  }

  // Función para formatear fecha
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.getFullYear().toString()
    } catch (error) {
      console.warn('Error formateando fecha:', dateString)
      return 'N/A'
    }
  }

  // Función para validar URL
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    try {
      new URL(url)
      return true
    } catch (error) {
      console.warn('URL inválida:', url)
      return false
    }
  }

  // Función para scroll suave
  const scrollToEvent = (index) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const eventElement = container.children[index]
    
    if (eventElement) {
      eventElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }

  // Función para manejar clic en enlace
  const handleLinkClick = (e, url) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Abriendo enlace:', url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Efecto para limpiar estados al desmontar
  useEffect(() => {
    return () => {
      setHoveredEvent(null)
      setActiveEvent(null)
    }
  }, [])

  return (
    <section
      className="timeline"
      id="timeline"
      style={{ 
        backgroundColor: secondaryColors.dark,
        '--timeline-primary-color': colores?.primario || 'var(--color-primary)',
        '--timeline-secondary-color': secondaryColors.main || 'var(--color-secondary)'
      }}
    >
      <div className="container">
        {/* Header de la sección */}
        <div className="timeline__header">
          <h2 className="timeline__title timeline__title--dynamic">
            {timelineSection.titulo || 'Nuestra Historia'}
          </h2>
          {timelineSection.descripcion && (
            <p className="timeline__description">
              {timelineSection.descripcion}
            </p>
          )}
          <div className="timeline__underline timeline__underline--dynamic" />
        </div>

        {/* Controles de navegación */}
        <div className="timeline__controls">
          <button 
            className="timeline__control-btn btn btn-secondary"
            onClick={() => scrollToEvent(0)}
            aria-label="Ir al primer evento"
          >
            ⏮️ Inicio
          </button>
        </div>

        {/* Línea de tiempo */}
        <div className="timeline__container" ref={timelineRef}>
          {/* Línea central */}
          <div className="timeline__line" />
          
          {/* Contenedor de eventos con scroll horizontal */}
          <div 
            className="timeline__events-container"
            ref={scrollContainerRef}
          >
            {sortedEvents.map((event, index) => {
              const eventStyles = getEventStyles(event.importance)
              const year = formatDate(event.date)
              const isEven = index % 2 === 0
              const isHovered = hoveredEvent === index
              const isActive = activeEvent === index
              const hasValidLink = event.link && isValidUrl(event.link)

              return (
                <div
                  key={`${event.name}-${event.date}-${index}`}
                  className={`timeline__event ${isHovered ? 'timeline__event--hovered' : ''} ${isActive ? 'timeline__event--active' : ''}`}
                  onMouseEnter={() => setHoveredEvent(index)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onClick={() => setActiveEvent(isActive ? null : index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveEvent(isActive ? null : index)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Evento: ${event.name} en ${year}. ${event.descripcion || ''}`}
                  aria-expanded={isActive}
                >
                  {/* Contenido del evento */}
                  <div className={`timeline__event-content ${isEven ? 'timeline__event-content--top' : 'timeline__event-content--bottom'}`}>
                    {/* Nombre del evento */}
                    <h3 className="timeline__event-name">
                      {event.name}
                    </h3>

                    {/* Año */}
                    <span className="timeline__event-year timeline__event-year--dynamic">
                      {year}
                    </span>

                    {/* Descripción */}
                    {event.descripcion && (
                      <p className="timeline__event-description">
                        {event.descripcion}
                      </p>
                    )}

                    {/* Enlace del evento - CORREGIDO */}
                    {hasValidLink && (
                      <div className="timeline__event-link-container">
                        <span className="timeline__event-link-indicator">
                          📎 Enlace disponible
                        </span>
                        <button 
                          className="timeline__event-link timeline__event-link--dynamic"
                          onClick={(e) => handleLinkClick(e, event.link)}
                          aria-label={`Ver más sobre ${event.name}`}
                        >
                          🔗 Ver más
                        </button>
                      </div>
                    )}
                    {event.link && !isValidUrl(event.link) && (
                      <div className="timeline__event-link-container timeline__event-link-container--error">
                        <span className="timeline__event-link-indicator timeline__event-link-indicator--error">
                          ⚠️ Enlace inválido
                        </span>
                        <span className="timeline__event-link-error">
                          URL mal formada: {event.link}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Círculo del evento */}
                  <div 
                    className="timeline__event-circle"
                    style={{
                      width: eventStyles.circleSize,
                      height: eventStyles.circleSize,
                      backgroundColor: eventStyles.backgroundColor,
                      boxShadow: eventStyles.shadow,
                    }}
                  >
                    {/* Icono del evento - CORREGIDO */}
                    <div className="timeline__event-icon">
                      {getEventIcon(event, event.importance)}
                    </div>
                  </div>

                  {/* Imagen del evento - CORREGIDA para que no ocupe tanto espacio */}
                  {event.image && (
                    <div className={`timeline__event-image ${isHovered || isActive ? 'timeline__event-image--visible' : ''}`}>
                      <img
                        src={getGalleryImageUrl(event.image)}
                        alt={`Imagen de ${event.name}`}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center'
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Indicadores de navegación */}
        <div className="timeline__indicators">
          {sortedEvents.map((_, index) => (
            <button
              key={index}
              className={`timeline__indicator timeline__indicator--dynamic ${activeEvent === index ? 'timeline__indicator--active' : ''}`}
              onClick={() => scrollToEvent(index)}
              aria-label={`Ir al evento ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TimelineSection 
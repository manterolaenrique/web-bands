import React, { useState } from 'react'
import { getGalleryImageUrl } from '../utils/sanityImage'
import { getSecondaryColors } from '../utils/colorUtils'

const TimelineSection = ({ timelineSection, colores }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null)
  const [hoveredImage, setHoveredImage] = useState(null)

  if (!timelineSection || !timelineSection.enabled || !timelineSection.events || timelineSection.events.length === 0) {
    return null
  }

  const secondaryColors = getSecondaryColors(colores)

  // Ordenar eventos por fecha
  const sortedEvents = [...timelineSection.events].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Función para obtener estilos según la importancia
  const getEventStyles = (importance) => {
    const baseStyles = {
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }

    switch (importance) {
      case 'principal':
        return {
          ...baseStyles,
          circleSize: '80px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: colores?.primario || '#333',
          backgroundColor: colores?.primario || '#333',
        }
      case 'secundario':
        return {
          ...baseStyles,
          circleSize: '60px',
          fontSize: '1rem',
          fontWeight: '600',
          color: colores?.secundario || '#666',
          backgroundColor: colores?.secundario || '#666',
        }
      case 'tercero':
        return {
          ...baseStyles,
          circleSize: '50px',
          fontSize: '0.9rem',
          fontWeight: '500',
          color: secondaryColors.light || '#999',
          backgroundColor: secondaryColors.light || '#999',
        }
      default:
        return baseStyles
    }
  }

  return (
    <section
      className="timeline-section"
      style={{
        padding: '5rem 2rem',
        backgroundColor: secondaryColors.dark,
        position: 'relative',
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Header de la sección */}
        <div
          className="timeline-header"
          style={{
            textAlign: 'center',
            marginBottom: '4rem',
          }}
        >
          <h2
            className="timeline-title"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              color: colores?.primario || '#333',
              marginBottom: '1rem',
            }}
          >
            {timelineSection.titulo || 'Nuestra Historia'}
          </h2>
          {timelineSection.descripcion && (
            <p
              className="timeline-description"
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.6',
                color: '#666',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              {timelineSection.descripcion}
            </p>
          )}
          <div
            className="title-underline"
            style={{
              width: '80px',
              height: '4px',
              backgroundColor: secondaryColors.main,
              margin: '2rem auto 0',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Línea de tiempo */}
        <div
          className="timeline-container"
          style={{
            position: 'relative',
            padding: '2rem 0',
          }}
        >
          {/* Línea central */}
          <div
            className="timeline-line"
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '4px',
              backgroundColor: secondaryColors.light || '#e0e0e0',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
          />

          {/* Contenedor de eventos */}
          <div
            className="timeline-events"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${sortedEvents.length}, 1fr)`,
              gap: '1rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {sortedEvents.map((event, index) => {
              const eventStyles = getEventStyles(event.importance)
              const year = new Date(event.date).getFullYear()
              const isEven = index % 2 === 0

              return (
                <div
                  key={index}
                  className="timeline-event"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                  onMouseEnter={() => {
                    setHoveredEvent(index)
                    if (event.image) {
                      setHoveredImage(event.image)
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredEvent(null)
                    setHoveredImage(null)
                  }}
                >
                  {/* Contenido del evento */}
                  <div
                    className="event-content"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      order: isEven ? 1 : 3,
                      marginBottom: isEven ? '1rem' : '0',
                      marginTop: isEven ? '0' : '1rem',
                    }}
                  >
                    {/* Nombre del evento */}
                    <h3
                      className="event-name"
                      style={{
                        fontSize: eventStyles.fontSize,
                        fontWeight: eventStyles.fontWeight,
                        color: eventStyles.color,
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                        lineHeight: '1.2',
                        maxWidth: '120px',
                      }}
                    >
                      {event.name}
                    </h3>

                    {/* Año */}
                    <span
                      className="event-year"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#666',
                        backgroundColor: '#f5f5f5',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '15px',
                        border: `2px solid ${eventStyles.color}`,
                      }}
                    >
                      {year}
                    </span>
                  </div>

                  {/* Círculo del evento */}
                  <div
                    className="event-circle"
                    style={{
                      width: eventStyles.circleSize,
                      height: eventStyles.circleSize,
                      borderRadius: '50%',
                      backgroundColor: eventStyles.backgroundColor,
                      border: `4px solid #fff`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      order: 2,
                      position: 'relative',
                      zIndex: 3,
                      transform: hoveredEvent === index ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Icono del evento (puedes personalizar según el tipo de evento) */}
                    <div
                      className="event-icon"
                      style={{
                        width: '60%',
                        height: '60%',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: eventStyles.backgroundColor,
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Descripción del evento (solo en hover) */}
                  {event.descripcion && (
                    <div
                      className="event-description"
                      style={{
                        position: 'absolute',
                        top: isEven ? '100%' : 'auto',
                        bottom: isEven ? 'auto' : '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#fff',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxWidth: '200px',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        color: '#333',
                        opacity: hoveredEvent === index ? 1 : 0,
                        visibility: hoveredEvent === index ? 'visible' : 'hidden',
                        transition: 'all 0.3s ease',
                        zIndex: 10,
                        border: `2px solid ${eventStyles.color}`,
                      }}
                    >
                      {event.descripcion}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal de imagen en hover */}
        {hoveredImage && (
          <div
            className="image-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              padding: '1rem',
              maxWidth: '400px',
              maxHeight: '400px',
            }}
          >
            <img
              src={getGalleryImageUrl(hoveredImage)}
              alt="Evento"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
      </div>

      {/* Estilos responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .timeline-events {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .event-content {
            order: 1 !important;
            margin-bottom: 1rem !important;
            margin-top: 0 !important;
          }
          
          .event-circle {
            order: 2 !important;
          }
          
          .timeline-line {
            left: 50% !important;
            right: auto !important;
            width: 4px !important;
            height: 100% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
          }
        }
      `}</style>
    </section>
  )
}

export default TimelineSection 
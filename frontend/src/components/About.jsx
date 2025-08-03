import React from 'react'
import { getGalleryImageUrl, getAvatarImageUrl } from '../utils/sanityImage'
import { getSecondaryColors } from '../utils/colorUtils'

const About = ({ about, colores }) => {
  if (!about) return null

  const secondaryColors = getSecondaryColors(colores)

  return (
    <section 
      className="about"
      id="about"
      style={{ backgroundColor: secondaryColors.light }}
    >
      <div className="container">
        <div className="about__header">
          <h2 className="about__title">
            {about.titulo || 'Quiénes Somos'}
          </h2>
          <div className="about__underline" />
        </div>

        <div className="about__content">
          {/* Contenido de texto */}
          <div className="about__text">
            <p className="about__description">
              {about.contenido}
            </p>
            
            {/* Botón de acción */}
            <button 
              className="about__cta btn btn-primary"
              onClick={() => {
                const timelineSection = document.querySelector('.timeline-section')
                if (timelineSection) {
                  timelineSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }
              }}
            >
              Conoce más sobre nosotros
            </button>
          </div>

          {/* Imagen de la banda */}
          {about.imagen && (
            <div className="about__image">
              <img 
                src={getGalleryImageUrl(about.imagen)}
                alt="La banda"
                className="about__band-image"
              />
            </div>
          )}
        </div>

        {/* Sección de integrantes */}
        {about.integrantes && about.integrantes.length > 0 && (
          <div className="about__integrantes">
            <h3 className="about__integrantes-title">
              Nuestros Integrantes
            </h3>
            
            <div className="about__integrantes-grid">
              {about.integrantes.map((integrante, index) => (
                <div 
                  key={index}
                  className="about__integrante-card card"
                >
                  {integrante.foto && (
                    <img 
                      src={getAvatarImageUrl(integrante.foto)}
                      alt={integrante.nombre}
                      className="about__integrante-photo"
                    />
                  )}
                  <h4 className="about__integrante-name">
                    {integrante.nombre}
                  </h4>
                  <p className="about__integrante-instrument">
                    {integrante.instrumento}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS */}
      <style jsx>{`
        .about {
          padding: var(--space-20) var(--space-4);
          color: var(--color-white);
        }

        .about__header {
          text-align: center;
          margin-bottom: var(--space-16);
        }

        .about__title {
          font-size: var(--text-4xl);
          font-weight: bold;
          color: ${colores?.primario || 'var(--color-primary)'};
          margin-bottom: var(--space-4);
          line-height: 1.2;
        }

        .about__underline {
          width: 80px;
          height: 4px;
          background-color: ${secondaryColors.main};
          margin: 0 auto;
          border-radius: 2px;
        }

        .about__content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-16);
          align-items: center;
          margin-bottom: var(--space-20);
        }

        .about__text {
          order: 1;
        }

        .about__description {
          font-size: var(--text-lg);
          line-height: 1.8;
          color: var(--color-white);
          margin-bottom: var(--space-8);
          opacity: 0.9;
        }

        .about__cta {
          background-color: ${colores?.primario || 'var(--color-primary)'};
          color: var(--color-white);
          font-size: var(--text-base);
          padding: var(--space-3) var(--space-6);
          border-radius: var(--border-radius-full);
          transition: all var(--transition-normal);
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .about__cta:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          background-color: ${colores?.primario ? 'hsl(' + (parseInt(colores.primario.replace('#', ''), 16) + 10) + ', 70%, 60%)' : 'var(--color-primary)'};
        }

        .about__image {
          order: 2;
          text-align: center;
        }

        .about__band-image {
          width: 100%;
          max-width: 500px;
          height: auto;
          border-radius: var(--border-radius-2xl);
          box-shadow: var(--shadow-xl);
          transition: transform var(--transition-normal);
        }

        .about__band-image:hover {
          transform: scale(1.02);
        }

        .about__integrantes {
          margin-top: var(--space-20);
        }

        .about__integrantes-title {
          font-size: var(--text-3xl);
          font-weight: bold;
          text-align: center;
          color: ${colores?.primario || 'var(--color-primary)'};
          margin-bottom: var(--space-12);
        }

        .about__integrantes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-8);
        }

        .about__integrante-card {
          background-color: var(--color-white);
          border-radius: var(--border-radius-2xl);
          padding: var(--space-8);
          text-align: center;
          box-shadow: var(--shadow-lg);
          transition: transform var(--transition-normal);
          color: var(--color-gray-900);
        }

        .about__integrante-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
        }

        .about__integrante-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: var(--space-4);
          border: 4px solid ${colores?.secundario || 'var(--color-gray-200)'};
          transition: transform var(--transition-normal);
        }

        .about__integrante-card:hover .about__integrante-photo {
          transform: scale(1.05);
        }

        .about__integrante-name {
          font-size: var(--text-xl);
          font-weight: bold;
          color: ${colores?.primario || 'var(--color-primary)'};
          margin-bottom: var(--space-2);
        }

        .about__integrante-instrument {
          font-size: var(--text-base);
          color: var(--color-gray-600);
          font-style: italic;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .about {
            padding: var(--space-12) var(--space-4);
          }

          .about__content {
            grid-template-columns: 1fr;
            gap: var(--space-8);
            text-align: center;
          }

          .about__text {
            order: 2;
          }

          .about__image {
            order: 1;
          }

          .about__title {
            font-size: var(--text-3xl);
          }

          .about__description {
            font-size: var(--text-base);
          }

          .about__integrantes-title {
            font-size: var(--text-2xl);
          }

          .about__integrantes-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--space-6);
          }

          .about__integrante-card {
            padding: var(--space-6);
          }
        }

        @media (max-width: 480px) {
          .about {
            padding: var(--space-8) var(--space-3);
          }

          .about__title {
            font-size: var(--text-2xl);
          }

          .about__description {
            font-size: var(--text-sm);
          }

          .about__integrantes-grid {
            grid-template-columns: 1fr;
          }

          .about__integrante-photo {
            width: 100px;
            height: 100px;
          }
        }

        /* Mejoras para pantallas grandes */
        @media (min-width: 1024px) {
          .about__content {
            gap: var(--space-20);
          }

          .about__title {
            font-size: var(--text-5xl);
          }

          .about__description {
            font-size: var(--text-xl);
          }

          .about__integrantes-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
        }

        /* Accesibilidad */
        .about__cta:focus-visible {
          outline: 2px solid ${colores?.primario || 'var(--color-primary)'};
          outline-offset: 4px;
        }

        /* Reducir movimiento */
        @media (prefers-reduced-motion: reduce) {
          .about__band-image,
          .about__integrante-card,
          .about__integrante-photo,
          .about__cta {
            transition: none;
          }

          .about__cta:hover {
            transform: none;
          }

          .about__integrante-card:hover {
            transform: none;
          }

          .about__integrante-card:hover .about__integrante-photo {
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}

export default About 
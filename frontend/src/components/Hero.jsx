import React from 'react'
import { getHeroImageUrl } from '../utils/sanityImage'

const Hero = ({ hero, colores, nombre }) => {
  if (!hero) return null

  const imageUrl = getHeroImageUrl(hero.imagen)
    ? `url(${getHeroImageUrl(hero.imagen)})`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <section 
      className="hero"
      id="hero"
      style={{ backgroundImage: imageUrl }}
    >
      {/* Overlay para mejorar legibilidad */}
      <div className="hero__overlay" />
      
      {/* Contenido del hero */}
      <div className="hero__content container">
        <h1 className="hero__title">
          {hero.titulo}
        </h1>
        
        {hero.subtitulo && (
          <h2 className="hero__subtitle">
            {hero.subtitulo}
          </h2>
        )}
        
        {hero.descripcion && (
          <p className="hero__description">
            {hero.descripcion}
          </p>
        )}
        
        {/* Botón de acción */}
        <button 
          className="hero__cta btn btn-primary"
          onClick={() => {
            const aboutSection = document.getElementById('escuchanos')
            if (aboutSection) {
              aboutSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          Descubre Nuestra Música
        </button>
      </div>
      
      {/* Scroll indicator */}
      <div className="hero__scroll-indicator">
        <span className="hero__scroll-icon">↓</span>
      </div>
      
      {/* Estilos CSS */}
      <style jsx>{`
        .hero {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: var(--space-8) 0;
        }

        .hero__overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          z-index: 1;
        }

        .hero__content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: var(--color-white);
          max-width: 800px;
          padding: 0 var(--space-4);
        }

        .hero__title {
          font-size: var(--text-5xl);
          font-weight: bold;
          margin-bottom: var(--space-4);
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          line-height: 1.2;
        }

        .hero__subtitle {
          font-size: var(--text-2xl);
          font-weight: 300;
          margin-bottom: var(--space-6);
          opacity: 0.9;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          line-height: 1.3;
        }

        .hero__description {
          font-size: var(--text-lg);
          line-height: 1.6;
          margin-bottom: var(--space-8);
          opacity: 0.8;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero__cta {
          background-color: ${colores?.primario || 'var(--color-primary)'};
          color: var(--color-white);
          font-size: var(--text-lg);
          padding: var(--space-4) var(--space-8);
          border-radius: var(--border-radius-full);
          box-shadow: var(--shadow-lg);
          transition: all var(--transition-normal);
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .hero__cta:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
          background-color: ${colores?.primario ? 'hsl(' + (parseInt(colores.primario.replace('#', ''), 16) + 10) + ', 70%, 60%)' : 'var(--color-primary)'};
        }

        .hero__scroll-indicator {
          position: absolute;
          bottom: var(--space-8);
          left: 50%;
          transform: translateX(-50%);
          color: var(--color-white);
          font-size: var(--text-3xl);
          animation: bounce 2s infinite;
          z-index: 2;
        }

        .hero__scroll-icon {
          display: block;
          opacity: 0.8;
          transition: opacity var(--transition-fast);
        }

        .hero__scroll-indicator:hover .hero__scroll-icon {
          opacity: 1;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero {
            padding: var(--space-6) 0;
            min-height: 90vh;
          }

          .hero__content {
            padding: 0 var(--space-3);
          }

          .hero__title {
            font-size: var(--text-4xl);
            margin-bottom: var(--space-3);
          }

          .hero__subtitle {
            font-size: var(--text-xl);
            margin-bottom: var(--space-4);
          }

          .hero__description {
            font-size: var(--text-base);
            margin-bottom: var(--space-6);
          }

          .hero__cta {
            font-size: var(--text-base);
            padding: var(--space-3) var(--space-6);
          }

          .hero__scroll-indicator {
            bottom: var(--space-6);
            font-size: var(--text-2xl);
          }
        }

        @media (max-width: 480px) {
          .hero__title {
            font-size: var(--text-3xl);
          }

          .hero__subtitle {
            font-size: var(--text-lg);
          }

          .hero__description {
            font-size: var(--text-sm);
          }
        }

        /* Accesibilidad */
        .hero__cta:focus-visible {
          outline: 2px solid var(--color-white);
          outline-offset: 4px;
        }

        /* Reducir movimiento */
        @media (prefers-reduced-motion: reduce) {
          .hero__scroll-indicator {
            animation: none;
          }

          .hero__cta:hover {
            transform: none;
          }
        }

        /* Mejoras para pantallas grandes */
        @media (min-width: 1024px) {
          .hero__content {
            max-width: 900px;
          }

          .hero__title {
            font-size: var(--text-6xl);
          }

          .hero__subtitle {
            font-size: var(--text-3xl);
          }

          .hero__description {
            font-size: var(--text-xl);
          }
        }

        /* Optimización para pantallas ultra anchas */
        @media (min-width: 1536px) {
          .hero__content {
            max-width: 1000px;
          }
        }
      `}</style>
    </section>
  )
}

export default Hero 
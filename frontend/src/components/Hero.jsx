import React from 'react'
import { getHeroImageUrl } from '../utils/sanityImage'

const Hero = ({ hero, colores, nombre }) => {
  if (!hero) return null

  const imageUrl = getHeroImageUrl(hero.imagen)
    ? `url(${getHeroImageUrl(hero.imagen)})`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <section 
      className="hero-section"
      style={{
        backgroundImage: imageUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Overlay para mejorar legibilidad */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
      />
      
      {/* Contenido del hero */}
      <div 
        className="hero-content"
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: '#fff',
          maxWidth: '800px',
          padding: '0 2rem',
        }}
      >
        <h1 
          className="hero-title"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {hero.titulo}
        </h1>
        
        {hero.subtitulo && (
          <h2 
            className="hero-subtitle"
            style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              fontWeight: '300',
              marginBottom: '1.5rem',
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {hero.subtitulo}
          </h2>
        )}
        
        {hero.descripcion && (
          <p 
            className="hero-description"
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '2rem',
              opacity: 0.8,
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {hero.descripcion}
          </p>
        )}
        
        {/* Botón de acción */}
        <button 
          className="hero-cta"
          style={{
            backgroundColor: colores?.primario || '#fff',
            color: colores?.primario ? '#fff' : '#000',
            border: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          Descubre Nuestra Música
        </button>
      </div>
      
      {/* Scroll indicator */}
      <div 
        className="scroll-indicator"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: '2rem',
          animation: 'bounce 2s infinite',
        }}
      >
        ↓
      </div>
      
      <style jsx>{`
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
      `}</style>
    </section>
  )
}

export default Hero 
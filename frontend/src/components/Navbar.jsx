import React, { useState, useEffect } from 'react'
import { getSmallLogoImageUrl } from '../utils/sanityImage'

const Navbar = ({ nombre, colores, logo, escuchanos, contacto,slug }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Función para verificar si la sección Escúchanos tiene contenido
  const hasEscuchanosContent = () => {
    if (!escuchanos) return false
    
    // Verificar si YouTube está habilitado y tiene videos
    const hasYouTube = escuchanos.youtube?.habilitado && 
                      escuchanos.youtube?.videos && 
                      escuchanos.youtube.videos.length > 0
    
    // Verificar si Spotify está habilitado y tiene contenido
    const hasSpotify = escuchanos.spotify?.habilitado && 
                      (escuchanos.spotify?.perfil_url || 
                       (escuchanos.spotify?.playlists && escuchanos.spotify.playlists.length > 0))
    
    return hasYouTube || hasSpotify
  }

  // Función para verificar si la sección Contacto tiene contenido
  const hasContactContent = () => {
    if (!contacto) return false
    
    // Verificar si hay información básica de contacto
    const hasBasicInfo = contacto.email || contacto.telefono || contacto.ubicacion
    
    // Verificar si hay redes sociales
    const hasSocialMedia = contacto.redes && Object.values(contacto.redes).some(url => url)
    
    return hasBasicInfo || hasSocialMedia
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <nav 
      className="navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: isScrolled 
          ? 'rgba(0, 0, 0, 0.9)' 
          : 'transparent',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.3s ease',
        padding: isScrolled ? '1rem 2rem' : '2rem',
      }}
    >
      <div 
        className="navbar-container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo/Nombre de la banda */}
        <div 
          className="navbar-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
          onClick={() => window.location.href = `/banda/${banda.slug?.current}`}
        >
          {/* Logo de la banda o icono por defecto */}
          {logo ? (
            <img 
              src={getSmallLogoImageUrl(logo)}
              alt={`Logo de ${nombre}`}
              style={{
                width: isScrolled ? '32px' : '70px',
                height: isScrolled ? '32px' : '70px',
                objectFit: 'contain',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: `2px solid ${colores?.primario || '#fff'}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)'
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
              }}

            />
          ) : (
            <div 
              style={{
                width: isScrolled ? '32px' : '40px',
                height: isScrolled ? '32px' : '40px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${colores?.primario || '#fff'}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)'
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              <span 
                style={{
                  fontSize: isScrolled ? '1rem' : '1.2rem',
                  color: colores?.primario || '#fff',
                  fontWeight: 'bold',
                }}
              >
                🎸
              </span>
            </div>
          )}
          
          {/* Nombre de la banda */}
          <span 
            style={{
              fontSize: isScrolled ? '1.2rem' : '1.5rem',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              transition: 'font-size 0.3s ease',
            }}
          >
            {nombre || 'Mi Banda'}
          </span>
        </div>

        {/* Menú de navegación desktop */}
        <div 
          className="navbar-menu desktop-menu"
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <button 
            onClick={() => scrollToSection('hero')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '25px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            Inicio
          </button>
          
          <button 
            onClick={() => scrollToSection('about')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '25px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            Quiénes Somos
          </button>
          
          {hasEscuchanosContent() && (
            <button 
              onClick={() => scrollToSection('escuchanos')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              Escúchanos
            </button>
          )}
          
          {hasContactContent() && (
            <button 
              onClick={() => scrollToSection('contact')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              Contacto
            </button>
          )}
        </div>

        {/* Botón de menú móvil */}
        <div 
          className="mobile-menu-button"
          style={{
            display: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            color: '#fff',
          }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </div>
      </div>

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <button 
            onClick={() => scrollToSection('hero')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: '1rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            Inicio
          </button>
          
          <button 
            onClick={() => scrollToSection('about')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: '1rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            Quiénes Somos
          </button>
          
          {hasEscuchanosContent() && (
            <button 
              onClick={() => scrollToSection('escuchanos')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '1rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              Escúchanos
            </button>
          )}
          
          {hasContactContent() && (
            <button 
              onClick={() => scrollToSection('contact')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '1rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              Contacto
            </button>
          )}
        </div>
      )}

      {/* Estilos responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          
          .mobile-menu-button {
            display: block !important;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navbar 
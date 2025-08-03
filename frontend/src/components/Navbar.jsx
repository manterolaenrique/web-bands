import React, { useState, useEffect } from 'react'
import { getSmallLogoImageUrl } from '../utils/sanityImage'

const Navbar = ({ nombre, colores, logo, escuchanos, contacto, slug }) => {
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
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container container">
        {/* Logo/Nombre de la banda */}
        <div 
          className="navbar__brand"
          onClick={() => window.location.href = `/banda/${slug?.current}`}
        >
          {/* Logo de la banda o icono por defecto */}
          {logo ? (
            <img 
              src={getSmallLogoImageUrl(logo)}
              alt={`Logo de ${nombre}`}
              className={`navbar__logo ${isScrolled ? 'navbar__logo--scrolled' : ''}`}
            />
          ) : (
            <div className={`navbar__logo-placeholder ${isScrolled ? 'navbar__logo-placeholder--scrolled' : ''}`}>
              <span className="navbar__logo-icon">🎸</span>
            </div>
          )}
          
          {/* Nombre de la banda */}
          <span className={`navbar__title ${isScrolled ? 'navbar__title--scrolled' : ''}`}>
            {nombre || 'Mi Banda'}
          </span>
        </div>

        {/* Menú de navegación desktop */}
        <div className="navbar__menu navbar__menu--desktop">
          <button 
            onClick={() => scrollToSection('hero')}
            className="navbar__link"
          >
            Inicio
          </button>
          
          <button 
            onClick={() => scrollToSection('about')}
            className="navbar__link"
          >
            Quiénes Somos
          </button>
          
          {hasEscuchanosContent() && (
            <button 
              onClick={() => scrollToSection('escuchanos')}
              className="navbar__link"
            >
              Escúchanos
            </button>
          )}
          
          {hasContactContent() && (
            <button 
              onClick={() => scrollToSection('contact')}
              className="navbar__link"
            >
              Contacto
            </button>
          )}
        </div>

        {/* Botón de menú móvil */}
        <button 
          className="navbar__mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className="navbar__mobile-icon">☰</span>
        </button>
      </div>

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div className="navbar__mobile-menu">
          <button 
            onClick={() => scrollToSection('hero')}
            className="navbar__mobile-link"
          >
            Inicio
          </button>
          
          <button 
            onClick={() => scrollToSection('about')}
            className="navbar__mobile-link"
          >
            Quiénes Somos
          </button>
          
          {hasEscuchanosContent() && (
            <button 
              onClick={() => scrollToSection('escuchanos')}
              className="navbar__mobile-link"
            >
              Escúchanos
            </button>
          )}
          
          {hasContactContent() && (
            <button 
              onClick={() => scrollToSection('contact')}
              className="navbar__mobile-link"
            >
              Contacto
            </button>
          )}
        </div>
      )}

      {/* Estilos CSS */}
      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-fixed);
          background-color: transparent;
          backdrop-filter: none;
          transition: all var(--transition-normal);
          padding: var(--space-8);
        }

        .navbar--scrolled {
          background-color: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          padding: var(--space-4);
        }

        .navbar__container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar__brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .navbar__brand:hover {
          transform: scale(1.05);
        }

        .navbar__logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          border-radius: 50%;
          background-color: rgba(255,255,255,0.1);
          border: 2px solid ${colores?.primario || '#fff'};
          box-shadow: var(--shadow-lg);
          transition: all var(--transition-normal);
        }

        .navbar__logo--scrolled {
          width: 32px;
          height: 32px;
        }

        .navbar__logo:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-xl);
        }

        .navbar__logo-placeholder {
          width: 40px;
          height: 40px;
          background-color: rgba(255,255,255,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid ${colores?.primario || '#fff'};
          box-shadow: var(--shadow-lg);
          transition: all var(--transition-normal);
        }

        .navbar__logo-placeholder--scrolled {
          width: 32px;
          height: 32px;
        }

        .navbar__logo-placeholder:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-xl);
        }

        .navbar__logo-icon {
          font-size: var(--text-xl);
          color: ${colores?.primario || '#fff'};
          font-weight: bold;
        }

        .navbar__title {
          font-size: var(--text-2xl);
          font-weight: bold;
          color: var(--color-white);
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          transition: font-size var(--transition-normal);
        }

        .navbar__title--scrolled {
          font-size: var(--text-lg);
        }

        .navbar__menu {
          display: flex;
          gap: var(--space-8);
          align-items: center;
        }

        .navbar__menu--desktop {
          display: flex;
        }

        .navbar__link {
          color: var(--color-white);
          font-size: var(--text-base);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--border-radius-full);
          transition: all var(--transition-normal);
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .navbar__link:hover {
          background-color: ${colores?.primario || 'rgba(255,255,255,0.1)'};
          transform: translateY(-1px);
        }

        .navbar__mobile-toggle {
          display: none;
          cursor: pointer;
          font-size: var(--text-2xl);
          color: var(--color-white);
          background: none;
          border: none;
          padding: var(--space-2);
        }

        .navbar__mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          animation: slideDown var(--transition-normal) ease-out;
        }

        .navbar__mobile-link {
          color: var(--color-white);
          font-size: var(--text-lg);
          padding: var(--space-4);
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .navbar__mobile-link:hover {
          background-color: ${colores?.primario || 'rgba(255,255,255,0.1)'};
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .navbar__menu--desktop {
            display: none;
          }
          
          .navbar__mobile-toggle {
            display: block;
          }

          .navbar {
            padding: var(--space-4);
          }

          .navbar--scrolled {
            padding: var(--space-3);
          }
        }

        @media (min-width: 769px) {
          .navbar__mobile-toggle {
            display: none;
          }
        }

        /* Accesibilidad */
        .navbar__link:focus-visible,
        .navbar__mobile-link:focus-visible,
        .navbar__mobile-toggle:focus-visible {
          outline: 2px solid ${colores?.primario || '#fff'};
          outline-offset: 2px;
        }

        /* Reducir movimiento */
        @media (prefers-reduced-motion: reduce) {
          .navbar,
          .navbar__logo,
          .navbar__logo-placeholder,
          .navbar__title,
          .navbar__link,
          .navbar__mobile-link,
          .navbar__mobile-menu {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navbar 
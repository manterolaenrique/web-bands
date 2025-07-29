import React from 'react'
import Logo from './Logo'
import SocialIcons from './SocialIcons'

const Footer = ({ nombre, contacto, colores }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="footer"
      style={{
        backgroundColor: '#000000',
        color: '#fff',
        padding: '3rem 2rem 1rem',
      }}
    >
      <div 
        className="footer-container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div 
          className="footer-content"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            marginBottom: '2rem',
          }}
        >
          {/* Información de la banda */}
          <div 
            className="footer-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 
              className="footer-title"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: colores?.primario || '#fff',
                marginBottom: '1rem',
              }}
            >
              {nombre || 'Mi Banda'}
            </h3>
            <p 
              className="footer-description"
              style={{
                lineHeight: '1.6',
                opacity: 0.8,
              }}
            >
              Creando música que conecta con el alma. 
              Cada nota cuenta una historia, cada acorde despierta una emoción.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div 
            className="footer-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h4 
              className="footer-subtitle"
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: colores?.primario || '#fff',
                marginBottom: '1rem',
              }}
            >
              Enlaces Rápidos
            </h4>
            <div 
              className="footer-links"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <button 
                onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: 0.8,
                  transition: 'opacity 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.8'
                }}
              >
                Inicio
              </button>
              <button 
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: 0.8,
                  transition: 'opacity 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.8'
                }}
              >
                Quiénes Somos
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: 0.8,
                  transition: 'opacity 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.8'
                }}
              >
                Contacto
              </button>
            </div>
          </div>

          {/* Información de contacto */}
          <div 
            className="footer-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h4 
              className="footer-subtitle"
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: colores?.primario || '#fff',
                marginBottom: '1rem',
              }}
            >
              Contacto
            </h4>
            <div 
              className="footer-contact"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {contacto?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📧</span>
                  <a 
                    href={`mailto:${contacto.email}`}
                    style={{
                      color: '#fff',
                      textDecoration: 'none',
                      opacity: 0.8,
                      transition: 'opacity 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '0.8'
                    }}
                  >
                    {contacto.email}
                  </a>
                </div>
              )}
              {contacto?.telefono && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📞</span>
                  <a 
                    href={`tel:${contacto.telefono}`}
                    style={{
                      color: '#fff',
                      textDecoration: 'none',
                      opacity: 0.8,
                      transition: 'opacity 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '0.8'
                    }}
                  >
                    {contacto.telefono}
                  </a>
                </div>
              )}
              {contacto?.ubicacion && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📍</span>
                  <span style={{ opacity: 0.8 }}>
                    {contacto.ubicacion}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Redes sociales */}
          <div 
            className="footer-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h4 
              className="footer-subtitle"
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: colores?.primario || '#fff',
                marginBottom: '1rem',
              }}
            >
              Síguenos
            </h4>
            <div 
              className="footer-social"
              style={{
                display: 'flex',
                gap: '1rem',
              }}
            >
              {contacto?.redes && Object.entries(contacto.redes).map(([platform, url]) => {
                if (!url) return null
                
                return (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%',
                      textDecoration: 'none',
                      fontSize: '1.2rem',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colores?.primario || 'rgba(255,255,255,0.2)'
                      e.target.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'
                      e.target.style.transform = 'translateY(0)'
                    }}
                  >
                    <SocialIcons platform={platform} size={20} color="#fff" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div 
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '2rem',
          }}
        />

        {/* Copyright */}
        <div 
          className="footer-bottom"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <p 
            className="copyright"
            style={{
              opacity: 0.7,
              fontSize: '0.9rem',
            }}
          >
            © {currentYear} {nombre || 'Mi Banda'}. Todos los derechos reservados.
          </p>
          
          <div 
            className="footer-credits"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              opacity: 0.7,
              fontSize: '0.9rem',
            }}
          >
            <span>Desarrollado con ❤️ para bandas de música</span>
            <Logo size="small" color="rgba(255,255,255,0.7)" showText={true} />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 
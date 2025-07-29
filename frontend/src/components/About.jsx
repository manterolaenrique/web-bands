import React from 'react'
import { getGalleryImageUrl, getAvatarImageUrl } from '../utils/sanityImage'
import { getSecondaryColors } from '../utils/colorUtils'

const About = ({ about, colores }) => {
  if (!about) return null

  const secondaryColors = getSecondaryColors(colores)

  return (
    <section 
      className="about-section"
      style={{
        padding: '5rem 2rem',
        backgroundColor: secondaryColors.light,
      }}
    >
      <div 
        className="container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div 
          className="about-header"
          style={{
            textAlign: 'center',
            marginBottom: '4rem',
          }}
        >
          <h2 
            className="about-title"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              color: colores?.primario || '#333',
              marginBottom: '1rem',
            }}
          >
            {about.titulo || 'Quiénes Somos'}
          </h2>
          <div 
            className="title-underline"
            style={{
              width: '80px',
              height: '4px',
              backgroundColor: secondaryColors.main,
              margin: '0 auto',
              borderRadius: '2px',
            }}
          />
        </div>

        <div 
          className="about-content"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Contenido de texto */}
          <div 
            className="about-text"
            style={{
              order: about.imagen ? 1 : 1,
            }}
          >
            <p 
              className="about-description"
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                color: '#fff',
                marginBottom: '2rem',
              }}
            >
              {about.contenido}
            </p>
            
            {/* Botón de acción */}
            <button 
              className="about-cta"
              style={{
                backgroundColor: colores?.primario || '#333',
                color: '#fff',
                border: 'none',
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Conoce mas sobre nosotros
            </button>
          </div>

          {/* Imagen de la banda */}
          {about.imagen && (
            <div 
              className="about-image"
              style={{
                order: 2,
                textAlign: 'center',
              }}
            >
              <img 
                src={getGalleryImageUrl(about.imagen)}
                alt="La banda"
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  borderRadius: '15px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          )}
        </div>

        {/* Sección de integrantes */}
        {about.integrantes && about.integrantes.length > 0 && (
          <div 
            className="integrantes-section"
            style={{
              marginTop: '5rem',
            }}
          >
            <h3 
              className="integrantes-title"
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textAlign: 'center',
                color: colores?.primario || '#333',
                marginBottom: '3rem',
              }}
            >
              Nuestros Integrantes
            </h3>
            
            <div 
              className="integrantes-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
              }}
            >
              {about.integrantes.map((integrante, index) => (
                <div 
                  key={index}
                  className="integrante-card"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '15px',
                    padding: '2rem',
                    textAlign: 'center',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  {integrante.foto && (
                    <img 
                      src={getAvatarImageUrl(integrante.foto)}
                      alt={integrante.nombre}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: '1rem',
                        border: `4px solid ${colores?.secundario || '#ddd'}`,
                      }}
                    />
                  )}
                  <h4 
                    className="integrante-nombre"
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: colores?.primario || '#333',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {integrante.nombre}
                  </h4>
                  <p 
                    className="integrante-instrumento"
                    style={{
                      fontSize: '1rem',
                      color: '#666',
                      fontStyle: 'italic',
                    }}
                  >
                    {integrante.instrumento}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default About 
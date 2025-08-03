import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getBandaBySlug } from '../sanityClient'
import { log, logError, getAppInfo } from '../config'
import { createBandaTitle, createErrorTitle } from '../utils/titleUtils'
import { updateFavicon, resetToDefaultFavicon } from '../utils/faviconUtils'
import Navbar from './Navbar'
import Hero from './Hero'
import About from './About'
import TimelineSection from './TimelineSection'
import Escuchanos from './Escuchanos'
import Contact from './Contact'
import Footer from './Footer'

const BandaPage = () => {
  const { slug } = useParams()
  const [banda, setBanda] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBanda = async () => {
      try {
        setLoading(true)
        log(`Iniciando carga de banda: ${slug}`)
        
        const data = await getBandaBySlug(slug)
        
        if (data) {
          setBanda(data)
          log(`Banda cargada exitosamente: ${data.nombre}`)
          
          // Actualizar el título de la pestaña
          document.title = createBandaTitle(data.nombre, data.genero)
       
          // Actualizar el favicon con el logo de la banda
          if (data.logo_favicon) {
            updateFavicon(data.logo_favicon.asset._ref).catch(() => {
              resetToDefaultFavicon()
            })
          } else {
            resetToDefaultFavicon()
          }
        } else {
          log('Banda no encontrada')
          setError('Banda no encontrada')
          document.title = createErrorTitle('Banda no encontrada')
          resetToDefaultFavicon()
        }
      } catch (err) {
        logError('Error al cargar banda', err)
        setError('Error al cargar la información de la banda')
        document.title = createErrorTitle('Banda Musical')
        resetToDefaultFavicon()
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchBanda()
    }
    }, [slug])

  // Loading state
  if (loading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          fontSize: '1.2rem',
          color: '#666',
        }}
      >
        <div 
          style={{
            textAlign: 'center',
          }}
        >
          <div 
            style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p>Cargando información de la banda...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          fontSize: '1.2rem',
          color: '#e74c3c',
        }}
      >
        <div 
          style={{
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div 
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}
          >
            😞
          </div>
          <h2>¡Ups! Algo salió mal</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.history.back()}
            style={{
              marginTop: '1rem',
              padding: '0.8rem 1.5rem',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Si no hay datos de la banda
  if (!banda) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          fontSize: '1.2rem',
          color: '#666',
        }}
      >
        <div 
          style={{
            textAlign: 'center',
          }}
        >
          <div 
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}
          >
            🎵
          </div>
          <h2>Banda no encontrada</h2>
          <p>La banda que buscas no existe o ha sido removida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="banda-page">
      {/* Navbar */}
      <Navbar 
        nombre={banda.nombre} 
        colores={banda.colores} 
        logo={banda.logo}
        escuchanos={banda.escuchanos}
        contacto={banda.contacto}
      />
      
      {/* Hero Section */}
      <section id="hero">
        <Hero 
          hero={banda.hero} 
          colores={banda.colores} 
          nombre={banda.nombre} 
        />
      </section>
      
      {/* About Section */}
      <section id="about">
        <About 
          about={banda.about} 
          colores={banda.colores} 
        />
      </section>
      
      {/* Timeline Section */}
      <section id="timeline">
        <TimelineSection 
          timelineSection={banda.timelineSection} 
          colores={banda.colores} 
        />
      </section>
      
      {/* Escúchanos Section */}
      <section id="escuchanos">
        <Escuchanos 
          escuchanos={banda.escuchanos} 
          colores={banda.colores} 
        />
      </section>
      
      {/* Contact Section */}
      <section id="contact">
        <Contact 
          contacto={banda.contacto} 
          colores={banda.colores} 
          nombre={banda.nombre} 
        />
      </section>
      
      {/* Footer */}
      <Footer 
        nombre={banda.nombre} 
        contacto={banda.contacto} 
        colores={banda.colores} 
      />
      
      {/* Estilos específicos de la página */}
      <style jsx>{`
        .banda-page {
          width: 100%;
          min-height: 100vh;
        }
      `}</style>
    </div>
  )
}

export default BandaPage 
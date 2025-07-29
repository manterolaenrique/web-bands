import React, { useEffect, useState } from 'react'
import { getAllBandas } from '../sanityClient'
import { getUrls, log, logError, getAppInfo } from '../config'
import { getCardImageUrl, getSmallLogoImageUrl } from '../utils/sanityImage'
import { createBandasListTitle, createErrorTitle } from '../utils/titleUtils'
import { resetToDefaultFavicon } from '../utils/faviconUtils'
import Logo from './Logo'

const BandasList = () => {
  const [bandas, setBandas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBandas = async () => {
      try {
        setLoading(true)
        log('Iniciando carga de bandas...')
        
        const data = await getAllBandas()
        setBandas(data)
        log(`Bandas cargadas: ${data.length}`)
        
        // Actualizar el título de la pestaña
        document.title = createBandasListTitle()
        
        // Resetear al favicon por defecto para la lista de bandas
        resetToDefaultFavicon()
      } catch (err) {
        logError('Error al cargar bandas', err)
        setError('Error al cargar las bandas')
        document.title = createErrorTitle('Bandas Musicales')
        resetToDefaultFavicon()
      } finally {
        setLoading(false)
      }
    }

    fetchBandas()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ fontSize: '1.2rem' }}>Cargando bandas...</p>
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '3rem',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😞</div>
          <h3>Error al cargar las bandas</h3>
          <p style={{ opacity: 0.8, marginBottom: '2rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem 2rem',
      }}>
        {/* Logo principal */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}>
          <Logo size="xlarge" color="#fff" showText={true} />
        </div>
        
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          marginBottom: '1rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        }}>
          Descubre increíbles bandas de música
        </h1>
        <p style={{
          fontSize: '1.3rem',
          marginBottom: '2rem',
          opacity: 0.9,
        }}>
          Explora el talento musical de diferentes artistas
        </p>
        
        {/* Botón para ir al CMS */}
        <a 
          href={getUrls().sanityStudio} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '0.8rem 1.5rem',
            borderRadius: '25px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'inline-block',
            marginBottom: '2rem',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          🎛️ Administrar Bandas
        </a>
      </div>

      {/* Lista de bandas */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 4rem',
      }}>
        {bandas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '3rem',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎸</div>
            <h3>No hay bandas disponibles</h3>
            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
              Aún no se han creado bandas en el sistema.
            </p>
            <a 
              href={getUrls().sanityStudio} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '0.8rem 1.5rem',
                borderRadius: '25px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-block',
              }}
            >
              🎛️ Crear Primera Banda
            </a>
          </div>
        ) : (
          <>
            <h2 style={{
              textAlign: 'center',
              marginBottom: '3rem',
              fontSize: '2rem',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}>
              Bandas Disponibles ({bandas.length})
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}>
              {bandas.map((banda, index) => (
                <div 
                  key={banda._id || index}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '15px',
                    padding: '2rem',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)'
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'
                    e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'
                    e.target.style.boxShadow = 'none'
                  }}
                  onClick={() => window.location.href = `/banda/${banda.slug?.current}`}
                >
                  {/* Header de la tarjeta con logo y nombre */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}>
                    {/* Logo de la banda */}
                    {banda.logo ? (
                      <img 
                        src={getSmallLogoImageUrl(banda.logo)}
                        alt={`Logo de ${banda.nombre}`}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'contain',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          border: '2px solid rgba(255,255,255,0.3)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(255,255,255,0.3)',
                        fontSize: '1.5rem',
                      }}>
                        🎸
                      </div>
                    )}
                    
                    {/* Nombre de la banda */}
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      margin: 0,
                    }}>
                      {banda.nombre || 'Banda sin nombre'}
                    </h3>
                  </div>
                  
                  {/* Imagen de la banda */}
                  {banda.heroImage ? (
                    <img 
                      src={getCardImageUrl(banda.heroImage)}
                      alt={banda.nombre}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '150px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                    }}>
                      🎵
                    </div>
                  )}
                  
                  {/* Información de la banda */}
                  {banda.heroTitle && (
                    <p style={{
                      opacity: 0.8,
                      marginBottom: '1rem',
                      fontSize: '1rem',
                    }}>
                      {banda.heroTitle}
                    </p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '0.9rem',
                      opacity: 0.7,
                    }}>
                      Slug: {banda.slug?.current || 'N/A'}
                    </span>
                    <button style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'
                    }}>
                      → Ver Banda
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Estilos globales */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

export default BandasList 
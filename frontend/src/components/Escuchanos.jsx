import React from 'react'
import SocialIcons from './SocialIcons'
import { getSecondaryColors } from '../utils/colorUtils'

const Escuchanos = ({ escuchanos, colores }) => {
  if (!escuchanos) return null

  const secondaryColors = getSecondaryColors(colores)

  // Función para extraer el ID del video de YouTube
  const getYouTubeVideoId = (url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Función para extraer el ID de la playlist de Spotify
  const getSpotifyPlaylistId = (url) => {
    if (!url) return null
    const regExp = /playlist\/([a-zA-Z0-9]+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  // Función para extraer el ID del artista de Spotify
  const getSpotifyArtistId = (url) => {
    if (!url) return null
    const regExp = /artist\/([a-zA-Z0-9]+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  return (
    <section
      className="escuchanos-section"
      style={{
        padding: '5rem 2rem',
        backgroundColor: secondaryColors.dark,
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
          className="escuchanos-header"
          style={{
            textAlign: 'center',
            marginBottom: '4rem',
          }}
        >
          <h2
            className="escuchanos-title"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              color: colores?.primario || '#333',
              marginBottom: '1rem',
            }}
          >
            {escuchanos.titulo || 'Escúchanos'}
          </h2>

          {escuchanos.descripcion && (
            <p
              className="escuchanos-description"
              style={{
                fontSize: '1.2rem',
                color: '#666',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: '1.6',
              }}
            >
              {escuchanos.descripcion}
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

        {/* Contenido de YouTube y Spotify */}
        <div
          className="escuchanos-content"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'start',
          }}
        >
          {/* Sección de YouTube */}
          {escuchanos.youtube?.habilitado && escuchanos.youtube?.videos && escuchanos.youtube.videos.length > 0 && (
            <div
              className="youtube-section"
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '15px',
                padding: '2rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                className="youtube-title"
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: colores?.primario || '#333',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <SocialIcons platform="youtube" size={28} color="#FF0000" />
                {escuchanos.youtube.titulo || 'Videos en YouTube'}
              </h3>

              <div
                className="youtube-videos"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2rem',
                }}
              >
                {escuchanos.youtube.videos.map((video, index) => {
                  const videoId = getYouTubeVideoId(video.url)
                  if (!videoId) return null

                  return (
                    <div
                      key={index}
                      className="video-item"
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div
                        className="video-embed"
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '0',
                          paddingBottom: '56.25%', // 16:9 aspect ratio
                        }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={video.titulo}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      <div
                        className="video-info"
                        style={{
                          padding: '1rem',
                        }}
                      >
                        <h4
                          className="video-title"
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {video.titulo}
                        </h4>

                        {video.descripcion && (
                          <p
                            className="video-description"
                            style={{
                              fontSize: '0.9rem',
                              color: '#666',
                              lineHeight: '1.4',
                            }}
                          >
                            {video.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sección de Spotify */}
          {escuchanos.spotify?.habilitado && (
            <div
              className="spotify-section"
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '15px',
                padding: '2rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                className="spotify-title"
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: colores?.primario || '#333',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <SocialIcons platform="spotify" size={28} color="#1DB954" />
                {escuchanos.spotify.titulo || 'Música en Spotify'}
              </h3>

              {/* Perfil de Spotify */}
              {escuchanos.spotify.perfil_url && (
                <div
                  className="spotify-profile"
                  style={{
                    marginBottom: '2rem',
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  <h4
                    className="profile-title"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: '1rem',
                    }}
                  >
                    Perfil de Artista
                  </h4>

                  <a
                    href={escuchanos.spotify.perfil_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#1DB954',
                      color: '#fff',
                      padding: '0.8rem 1.5rem',
                      borderRadius: '25px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <SocialIcons platform="spotify" size={20} color="#fff" style={{ marginRight: '8px' }} />
                    Ver Perfil en Spotify
                  </a>
                </div>
              )}

              {/* Playlists de Spotify */}
              {escuchanos.spotify.playlists && escuchanos.spotify.playlists.length > 0 && (
                <div
                  className="spotify-playlists"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <h4
                    className="playlists-title"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: '1rem',
                    }}
                  >
                    Playlists Destacadas
                  </h4>

                  {escuchanos.spotify.playlists.map((playlist, index) => {
                    const playlistId = getSpotifyPlaylistId(playlist.url)
                    if (!playlistId) return null

                    return (
                      <div
                        key={index}
                        className="playlist-item"
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '10px',
                          padding: '1rem',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        }}
                      >
                        <h5
                          className="playlist-name"
                          style={{
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {playlist.titulo}
                        </h5>

                        {playlist.descripcion && (
                          <p
                            className="playlist-description"
                            style={{
                              fontSize: '0.9rem',
                              color: '#666',
                              marginBottom: '1rem',
                              lineHeight: '1.4',
                            }}
                          >
                            {playlist.descripcion}
                          </p>
                        )}

                        <iframe
                          src={`https://open.spotify.com/embed/playlist/${playlistId}`}
                          width="100%"
                          height="80"
                          style={{
                            border: 'none',
                            borderRadius: '8px',
                          }}
                          allow="encrypted-media"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estilos responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .escuchanos-content {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </section>
  )
}

export default Escuchanos 
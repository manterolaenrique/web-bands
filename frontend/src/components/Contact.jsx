import React, { useState } from 'react'
import SocialIcons from './SocialIcons'
import { getSecondaryColors } from '../utils/colorUtils'
import { sendEmail, validateFormData, validateEmailJSConfig } from '../utils/emailService'

const Contact = ({ contacto, colores, nombre }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success', 'error', null
  const [errors, setErrors] = useState([])

  if (!contacto) return null

  // Verificar si el formulario de contacto está habilitado
  const emailjsConfig = contacto.emailjs_config
  const isEmailEnabled = emailjsConfig?.habilitado && validateEmailJSConfig(emailjsConfig).isValid

  const secondaryColors = getSecondaryColors(colores)

  const socialNames = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    spotify: 'Spotify',
    tiktok: 'TikTok'
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([])
      setSubmitStatus(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar formulario
    const validation = validateFormData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setErrors([])
    setSubmitStatus(null)

    try {
      await sendEmail(formData, emailjsConfig, nombre)
      setSubmitStatus('success')
      setFormData({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
      })
    } catch (error) {
      console.error('Error al enviar email:', error)
      setSubmitStatus('error')
      setErrors([error.message || 'Error al enviar el mensaje. Intenta nuevamente.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusMessage = () => {
    if (submitStatus === 'success') {
      return {
        text: emailjsConfig?.mensaje_exito || '¡Mensaje enviado exitosamente! Te responderemos pronto.',
        style: {
          color: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }
      }
    }
    if (submitStatus === 'error') {
      return {
        text: emailjsConfig?.mensaje_error || 'Error al enviar el mensaje. Verifica los datos e intenta nuevamente.',
        style: {
          color: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }
      }
    }
    return null
  }

  const statusMessage = getStatusMessage()

  return (
    <section 
      className="contact-section"
      style={{
        padding: '5rem 2rem',
        backgroundColor: secondaryColors.light,
        color: '#fff',
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
          className="contact-header"
          style={{
            textAlign: 'center',
            marginBottom: '4rem',
          }}
        >
          <h2 
            className="contact-title"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            Contáctanos
          </h2>
          <p 
            className="contact-subtitle"
            style={{
              fontSize: '1.2rem',
              opacity: 0.9,
            }}
          >
            ¿Quieres que toquemos en tu evento? ¡Escríbenos!
          </p>
        </div>

        <div 
          className="contact-content"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
          }}
        >
          {/* Información de contacto */}
          <div 
            className="contact-info"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3 
              className="contact-info-title"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                color: colores?.primario || '#fff',
              }}
            >
              Información de Contacto
            </h3>
            
            <div 
              className="contact-details"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {contacto.email && (
                <div 
                  className="contact-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📧</span>
                  <div>
                    <strong>Email:</strong>
                    <br />
                    <a 
                      href={`mailto:${contacto.email}`}
                      style={{
                        color: colores?.primario || '#fff',
                        textDecoration: 'none',
                      }}
                    >
                      {contacto.email}
                    </a>
                  </div>
                </div>
              )}
              
              {contacto.telefono && (
                <div 
                  className="contact-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📞</span>
                  <div>
                    <strong>Teléfono:</strong>
                    <br />
                    <a 
                      href={`tel:${contacto.telefono}`}
                      style={{
                        color: colores?.primario || '#fff',
                        textDecoration: 'none',
                      }}
                    >
                      {contacto.telefono}
                    </a>
                  </div>
                </div>
              )}
              
              {contacto.ubicacion && (
                <div 
                  className="contact-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📍</span>
                  <div>
                    <strong>Ubicación:</strong>
                    <br />
                    {contacto.ubicacion}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Redes sociales */}
          <div 
            className="social-media"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3 
              className="social-title"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                color: colores?.primario || '#fff',
              }}
            >
              Síguenos en Redes Sociales
            </h3>
            
            <div 
              className="social-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem',
              }}
            >
              {contacto.redes && Object.entries(contacto.redes).map(([platform, url]) => {
                if (!url) return null
                
                return (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px)'
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      <SocialIcons platform={platform} size={32} color="#fff" />
                    </span>
                    <span style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                      {socialNames[platform] || platform}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div 
          className="contact-form-section"
          style={{
            marginTop: '4rem',
            textAlign: 'center',
          }}
        >
          <h3 
            className="form-title"
            style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
            }}
          >
            Envíanos un Mensaje
          </h3>

          {/* Estado de configuración de EmailJS */}
          {!isEmailEnabled && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '2rem',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              marginBottom: '2rem',
            }}>
              <h4 style={{
                color: '#ff9800',
                marginBottom: '1rem',
                fontSize: '1.2rem',
              }}>
                ⚠️ Formulario de contacto no disponible
              </h4>
              <p style={{
                color: '#fff',
                opacity: 0.8,
                marginBottom: '1rem',
              }}>
                El formulario de contacto no está configurado para esta banda.
              </p>
              {emailjsConfig && !emailjsConfig.habilitado && (
                <p style={{
                  color: '#fff',
                  opacity: 0.7,
                  fontSize: '0.9rem',
                }}>
                  Para habilitarlo, activa la opción "Habilitar envío de emails" en Sanity.
                </p>
              )}
              {emailjsConfig?.habilitado && !validateEmailJSConfig(emailjsConfig).isValid && (
                <div style={{
                  color: '#fff',
                  opacity: 0.7,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                }}>
                  <p><strong>Configuración incompleta:</strong></p>
                  <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                    {!emailjsConfig.service_id && <li>Service ID de EmailJS</li>}
                    {!emailjsConfig.template_id && <li>Template ID de EmailJS</li>}
                    {!emailjsConfig.public_key && <li>Public Key de EmailJS</li>}
                    {!emailjsConfig.email_destino && !contacto.email && <li>Email de destino</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Solo mostrar el formulario si está habilitado */}
          {isEmailEnabled && (
            <>
              {/* Mensaje de estado */}
              {statusMessage && (
                <div style={statusMessage.style}>
                  {statusMessage.text}
                </div>
              )}

              {/* Lista de errores */}
              {errors.length > 0 && (
                <div style={{
                  color: '#f44336',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}>
                  <strong>Errores:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <form 
                className="contact-form"
                onSubmit={handleSubmit}
                style={{
                  maxWidth: '600px',
                  margin: '0 auto',
                  display: 'grid',
                  gap: '1rem',
                }}
              >
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <input 
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                style={{
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
                disabled={isSubmitting}
              />
              <input 
                type="email"
                name="email"
                placeholder="Tu email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
                disabled={isSubmitting}
              />
            </div>
            
            <input 
              type="text"
              name="asunto"
              placeholder="Asunto"
              value={formData.asunto}
              onChange={handleInputChange}
              style={{
                padding: '1rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
              disabled={isSubmitting}
            />
            
            <textarea 
              name="mensaje"
              placeholder="Tu mensaje"
              rows="5"
              value={formData.mensaje}
              onChange={handleInputChange}
              style={{
                padding: '1rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
              }}
              disabled={isSubmitting}
            />
            
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#ccc' : (colores?.primario || '#fff'),
                color: isSubmitting ? '#666' : (colores?.primario ? '#fff' : '#333'),
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default Contact 
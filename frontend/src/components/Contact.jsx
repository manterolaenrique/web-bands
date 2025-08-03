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
        className: 'contact__status contact__status--success'
      }
    }
    if (submitStatus === 'error') {
      return {
        text: emailjsConfig?.mensaje_error || 'Error al enviar el mensaje. Verifica los datos e intenta nuevamente.',
        className: 'contact__status contact__status--error'
      }
    }
    return null
  }

  const statusMessage = getStatusMessage()

  return (
    <section 
      className="contact"
      id="contact"
      style={{ backgroundColor: secondaryColors.dark }}
    >
      <div className="container">
        <div className="contact__header">
          <h2 className="contact__title">
            Contáctanos
          </h2>
          <p className="contact__subtitle">
            ¿Quieres que toquemos en tu evento? ¡Escríbenos!
          </p>
        </div>

        <div className="contact__content">
          {/* Información de contacto */}
          <div className="contact__info card">
            <h3 className="contact__info-title">
              Información de Contacto
            </h3>
            
            <div className="contact__details">
              {contacto.email && (
                <div className="contact__item">
                  <span className="contact__icon">📧</span>
                  <div className="contact__item-content">
                    <strong>Email:</strong>
                    <br />
                    <a 
                      href={`mailto:${contacto.email}`}
                      className="contact__link"
                    >
                      {contacto.email}
                    </a>
                  </div>
                </div>
              )}
              
              {contacto.telefono && (
                <div className="contact__item">
                  <span className="contact__icon">📞</span>
                  <div className="contact__item-content">
                    <strong>Teléfono:</strong>
                    <br />
                    <a 
                      href={`tel:${contacto.telefono}`}
                      className="contact__link"
                    >
                      {contacto.telefono}
                    </a>
                  </div>
                </div>
              )}
              
              {contacto.ubicacion && (
                <div className="contact__item">
                  <span className="contact__icon">📍</span>
                  <div className="contact__item-content">
                    <strong>Ubicación:</strong>
                    <br />
                    {contacto.ubicacion}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Redes sociales */}
          <div className="contact__social card">
            <h3 className="contact__social-title">
              Síguenos en Redes Sociales
            </h3>
            
            <div className="contact__social-grid">
              {contacto.redes && Object.entries(contacto.redes).map(([platform, url]) => {
                if (!url) return null
                
                return (
                  <a 
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact__social-link"
                  >
                    <span className="contact__social-icon">
                      <SocialIcons platform={platform} size={32} color="#fff" />
                    </span>
                    <span className="contact__social-name">
                      {socialNames[platform] || platform}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div className="contact__form-section">
          <h3 className="contact__form-title">
            Envíanos un Mensaje
          </h3>

          {/* Estado de configuración de EmailJS */}
          {!isEmailEnabled && (
            <div className="contact__warning card">
              <h4 className="contact__warning-title">
                ⚠️ Formulario de contacto no disponible
              </h4>
              <p className="contact__warning-text">
                El formulario de contacto no está configurado para esta banda.
              </p>
              {emailjsConfig && !emailjsConfig.habilitado && (
                <p className="contact__warning-subtext">
                  Para habilitarlo, activa la opción "Habilitar envío de emails" en Sanity.
                </p>
              )}
              {emailjsConfig?.habilitado && !validateEmailJSConfig(emailjsConfig).isValid && (
                <div className="contact__warning-details">
                  <p><strong>Configuración incompleta:</strong></p>
                  <ul>
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
                <div className={statusMessage.className}>
                  {statusMessage.text}
                </div>
              )}

              {/* Lista de errores */}
              {errors.length > 0 && (
                <div className="contact__errors">
                  <strong>Errores:</strong>
                  <ul>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <form 
                className="contact__form"
                onSubmit={handleSubmit}
              >
                <div className="contact__form-row">
                  <input 
                    type="text"
                    name="nombre"
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="contact__input"
                    disabled={isSubmitting}
                  />
                  <input 
                    type="email"
                    name="email"
                    placeholder="Tu email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="contact__input"
                    disabled={isSubmitting}
                  />
                </div>
                
                <input 
                  type="text"
                  name="asunto"
                  placeholder="Asunto"
                  value={formData.asunto}
                  onChange={handleInputChange}
                  className="contact__input"
                  disabled={isSubmitting}
                />
                
                <textarea 
                  name="mensaje"
                  placeholder="Tu mensaje"
                  rows="5"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  className="contact__textarea"
                  disabled={isSubmitting}
                />
                
                <button 
                  type="submit"
                  className={`contact__submit btn ${isSubmitting ? 'btn--disabled' : 'btn-primary'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Estilos CSS */}
      <style jsx>{`
        .contact {
          padding: var(--space-20) var(--space-4);
          color: var(--color-white);
        }

        .contact__header {
          text-align: center;
          margin-bottom: var(--space-16);
        }

        .contact__title {
          font-size: var(--text-4xl);
          font-weight: bold;
          margin-bottom: var(--space-4);
          line-height: 1.2;
        }

        .contact__subtitle {
          font-size: var(--text-lg);
          opacity: 0.9;
        }

        .contact__content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-12);
          margin-bottom: var(--space-16);
        }

        .contact__info,
        .contact__social {
          background-color: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: var(--border-radius-2xl);
          padding: var(--space-8);
        }

        .contact__info-title,
        .contact__social-title {
          font-size: var(--text-xl);
          font-weight: bold;
          margin-bottom: var(--space-6);
          color: ${colores?.primario || 'var(--color-primary)'};
        }

        .contact__details {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .contact__item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .contact__icon {
          font-size: var(--text-xl);
          flex-shrink: 0;
        }

        .contact__item-content {
          flex: 1;
        }

        .contact__link {
          color: ${colores?.primario || 'var(--color-primary)'};
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .contact__link:hover {
          color: var(--color-white);
        }

        .contact__social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--space-4);
        }

        .contact__social-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-4);
          background-color: rgba(255,255,255,0.1);
          border-radius: var(--border-radius-lg);
          text-decoration: none;
          color: var(--color-white);
          transition: all var(--transition-normal);
        }

        .contact__social-link:hover {
          transform: translateY(-3px);
          background-color: rgba(255,255,255,0.2);
        }

        .contact__social-icon {
          font-size: var(--text-2xl);
          margin-bottom: var(--space-2);
        }

        .contact__social-name {
          font-size: var(--text-sm);
          text-align: center;
        }

        .contact__form-section {
          text-align: center;
        }

        .contact__form-title {
          font-size: var(--text-2xl);
          font-weight: bold;
          margin-bottom: var(--space-8);
        }

        .contact__warning {
          background-color: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: var(--border-radius-2xl);
          padding: var(--space-8);
          margin-bottom: var(--space-8);
        }

        .contact__warning-title {
          color: var(--color-warning);
          margin-bottom: var(--space-4);
          font-size: var(--text-lg);
        }

        .contact__warning-text {
          color: var(--color-white);
          opacity: 0.8;
          margin-bottom: var(--space-4);
        }

        .contact__warning-subtext {
          color: var(--color-white);
          opacity: 0.7;
          font-size: var(--text-sm);
        }

        .contact__warning-details {
          color: var(--color-white);
          opacity: 0.7;
          font-size: var(--text-sm);
          text-align: left;
        }

        .contact__warning-details ul {
          margin: var(--space-2) 0 0 var(--space-6);
          padding: 0;
        }

        .contact__status {
          padding: var(--space-4);
          border-radius: var(--border-radius-lg);
          margin-bottom: var(--space-4);
          text-align: center;
        }

        .contact__status--success {
          color: var(--color-success);
          background-color: rgba(76, 175, 80, 0.1);
        }

        .contact__status--error {
          color: var(--color-error);
          background-color: rgba(244, 67, 54, 0.1);
        }

        .contact__errors {
          color: var(--color-error);
          background-color: rgba(244, 67, 54, 0.1);
          padding: var(--space-4);
          border-radius: var(--border-radius-lg);
          margin-bottom: var(--space-4);
          text-align: left;
        }

        .contact__errors ul {
          margin: var(--space-2) 0 0 var(--space-6);
          padding: 0;
        }

        .contact__form {
          max-width: 600px;
          margin: 0 auto;
          display: grid;
          gap: var(--space-4);
        }

        .contact__form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .contact__input,
        .contact__textarea {
          padding: var(--space-4);
          border: none;
          border-radius: var(--border-radius-lg);
          font-size: var(--text-base);
          background-color: var(--color-white);
          color: var(--color-gray-900);
        }

        .contact__textarea {
          resize: vertical;
          min-height: 120px;
        }

        .contact__submit {
          font-size: var(--text-lg);
          padding: var(--space-4) var(--space-8);
          border-radius: var(--border-radius-lg);
          transition: all var(--transition-normal);
          opacity: 1;
        }

        .contact__submit:hover:not(.btn--disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .btn--disabled {
          background-color: var(--color-gray-400) !important;
          color: var(--color-gray-600) !important;
          cursor: not-allowed !important;
          opacity: 0.7;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .contact {
            padding: var(--space-12) var(--space-4);
          }

          .contact__content {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }

          .contact__title {
            font-size: var(--text-3xl);
          }

          .contact__form-title {
            font-size: var(--text-xl);
          }

          .contact__form-row {
            grid-template-columns: 1fr;
          }

          .contact__social-grid {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }
        }

        @media (max-width: 480px) {
          .contact {
            padding: var(--space-8) var(--space-3);
          }

          .contact__title {
            font-size: var(--text-2xl);
          }

          .contact__subtitle {
            font-size: var(--text-base);
          }

          .contact__info,
          .contact__social {
            padding: var(--space-6);
          }

          .contact__social-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Accesibilidad */
        .contact__link:focus-visible,
        .contact__social-link:focus-visible,
        .contact__input:focus-visible,
        .contact__textarea:focus-visible,
        .contact__submit:focus-visible {
          outline: 2px solid ${colores?.primario || 'var(--color-primary)'};
          outline-offset: 2px;
        }

        /* Reducir movimiento */
        @media (prefers-reduced-motion: reduce) {
          .contact__social-link,
          .contact__submit {
            transition: none;
          }

          .contact__social-link:hover {
            transform: none;
          }

          .contact__submit:hover:not(.btn--disabled) {
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}

export default Contact 
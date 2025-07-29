import emailjs from '@emailjs/browser'

/**
 * Envía un email usando EmailJS con configuración desde Sanity
 * @param {Object} formData - Datos del formulario
 * @param {string} formData.nombre - Nombre del remitente
 * @param {string} formData.email - Email del remitente
 * @param {string} formData.asunto - Asunto del mensaje
 * @param {string} formData.mensaje - Contenido del mensaje
 * @param {Object} emailjsConfig - Configuración de EmailJS desde Sanity
 * @param {string} bandaNombre - Nombre de la banda
 * @returns {Promise} - Promise que se resuelve cuando el email se envía exitosamente
 */
export const sendEmail = async (formData, emailjsConfig, bandaNombre) => {
  // Verificar que la configuración de EmailJS esté habilitada
  if (!emailjsConfig?.habilitado) {
    throw new Error('El envío de emails no está habilitado para esta banda.')
  }

  // Verificar que todos los campos requeridos estén configurados
  if (!emailjsConfig.service_id || !emailjsConfig.template_id || !emailjsConfig.public_key) {
    throw new Error('Configuración de EmailJS incompleta. Verifica Service ID, Template ID y Public Key.')
  }

  // Usar el email de destino configurado o el email principal de la banda
  const emailDestino = emailjsConfig.email_destino || emailjsConfig.email

  if (!emailDestino) {
    throw new Error('Email de destino no configurado.')
  }

  // Preparar los datos para el template
  const templateParams = {
    to_email: emailDestino,
    from_name: formData.nombre,
    from_email: formData.email,
    subject: formData.asunto,
    message: formData.mensaje,
    banda_nombre: bandaNombre,
    reply_to: formData.email, // Para que las respuestas vayan al remitente
  }

  try {
    // Enviar el email
    const response = await emailjs.send(
      emailjsConfig.service_id,
      emailjsConfig.template_id,
      templateParams,
      emailjsConfig.public_key
    )

    return response
  } catch (error) {
    throw error
  }
}

/**
 * Valida los datos del formulario
 * @param {Object} formData - Datos del formulario
 * @returns {Object} - Objeto con isValid (boolean) y errors (array)
 */
export const validateFormData = (formData) => {
  const errors = []

  if (!formData.nombre || formData.nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres')
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push('Ingresa un email válido')
  }

  if (!formData.asunto || formData.asunto.trim().length < 5) {
    errors.push('El asunto debe tener al menos 5 caracteres')
  }

  if (!formData.mensaje || formData.mensaje.trim().length < 10) {
    errors.push('El mensaje debe tener al menos 10 caracteres')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} - true si el email es válido
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Verifica si la configuración de EmailJS está completa y válida
 * @param {Object} emailjsConfig - Configuración de EmailJS desde Sanity
 * @returns {Object} - Objeto con isValid (boolean) y message (string)
 */
export const validateEmailJSConfig = (emailjsConfig) => {
  if (!emailjsConfig) {
    return {
      isValid: false,
      message: 'No hay configuración de EmailJS disponible'
    }
  }

  if (!emailjsConfig.habilitado) {
    return {
      isValid: false,
      message: 'El envío de emails no está habilitado'
    }
  }

  if (!emailjsConfig.service_id) {
    return {
      isValid: false,
      message: 'Service ID de EmailJS no configurado'
    }
  }

  if (!emailjsConfig.template_id) {
    return {
      isValid: false,
      message: 'Template ID de EmailJS no configurado'
    }
  }

  if (!emailjsConfig.public_key) {
    return {
      isValid: false,
      message: 'Public Key de EmailJS no configurado'
    }
  }

  const emailDestino = emailjsConfig.email_destino || emailjsConfig.email
  if (!emailDestino) {
    return {
      isValid: false,
      message: 'Email de destino no configurado'
    }
  }

  return {
    isValid: true,
    message: 'Configuración válida'
  }
} 
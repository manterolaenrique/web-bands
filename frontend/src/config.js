// Configuración dinámica basada en variables de entorno
const config = {
  // Variables de entorno de Vite
  env: import.meta.env.VITE_ENV || 'development',
  sanityProjectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'vyjsvcoh',
  sanityDataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  sanityApiVersion: import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01',
  sanityStudioUrl: import.meta.env.VITE_SANITY_STUDIO_URL || 'http://localhost:3333',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  appName: import.meta.env.VITE_APP_NAME || 'Web Bands',
}

// Función helper para obtener URLs
export const getUrls = () => ({
  sanityStudio: config.sanityStudioUrl,
  app: config.appUrl,
})

// Función helper para obtener configuración de Sanity
export const getSanityConfig = () => ({
  projectId: config.sanityProjectId,
  dataset: config.sanityDataset,
  apiVersion: config.sanityApiVersion,
})

// Función helper para obtener información de la app
export const getAppInfo = () => ({
  name: config.appName,
  env: config.env,
  isDevelopment: config.env === 'development',
  isProduction: config.env === 'production',
})

// Función helper para logging condicional
export const log = (message, data = null) => {
  if (config.env === 'development') {
    if (data) {
      console.log(`[${config.appName}] ${message}`, data)
    } else {
      console.log(`[${config.appName}] ${message}`)
    }
  }
}

// Función helper para errores (siempre se muestran)
export const logError = (message, error = null) => {
  if (error) {
    console.error(`[${config.appName}] ${message}`, error)
  } else {
    console.error(`[${config.appName}] ${message}`)
  }
}

// Exportar configuración completa
export default config 
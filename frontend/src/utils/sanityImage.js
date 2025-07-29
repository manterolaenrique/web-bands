

// Helper para manejar imágenes de Sanity
export const getSanityImageUrl = (image, options = {}) => {
  if (!image?.asset?._ref) return null
  
  // Configuración por defecto
  const defaultOptions = {
    width: 800,
    height: 600,
    fit: 'crop',
    crop: 'center',
    format: 'jpg',
    quality: 80,
    ...options
  }
  
  // Construir URL de Sanity
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'vyjsvcoh'
  const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
  
  // Extraer ID de la imagen del _ref y limpiar la URL
  let imageId = image.asset._ref
  
  // Remover el prefijo "image-" del inicio
  imageId = imageId.replace(/^image-/, '')
  
  // Detectar y corregir la extensión del archivo
  if (imageId.endsWith('-jpg')) {
    imageId = imageId.replace(/-jpg$/, '.jpg')
  } else if (imageId.endsWith('-png')) {
    imageId = imageId.replace(/-png$/, '.png')
  } else if (imageId.endsWith('-webp')) {
    imageId = imageId.replace(/-webp$/, '.webp')
  } else if (imageId.endsWith('-gif')) {
    imageId = imageId.replace(/-gif$/, '.gif')
  }
  

  
  // Construir parámetros de la URL
  const params = new URLSearchParams({
    w: defaultOptions.width,
    h: defaultOptions.height,
    fit: defaultOptions.fit,
    crop: defaultOptions.crop,
    q: defaultOptions.quality,
  })
  
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`
}

// Helper para obtener imagen optimizada para hero
export const getHeroImageUrl = (image) => {
  return getSanityImageUrl(image, {
    width: 1200,
    height: 800,
    fit: 'crop',
    crop: 'center'
  })
}

// Helper para obtener imagen optimizada para cards
export const getCardImageUrl = (image) => {
  return getSanityImageUrl(image, {
    width: 400,
    height: 300,
    fit: 'crop',
    crop: 'center'
  })
}

// Helper para obtener imagen optimizada para avatares
export const getAvatarImageUrl = (image) => {
  return getSanityImageUrl(image, {
    width: 200,
    height: 200,
    fit: 'crop',
    crop: 'center'
  })
}

// Helper para obtener imagen optimizada para galería
export const getGalleryImageUrl = (image) => {
  return getSanityImageUrl(image, {
    width: 600,
    height: 400,
    fit: 'crop',
    crop: 'center'
  })
}

// Helper para obtener logo de la banda optimizado
export const getLogoImageUrl = (image) => {
  return getSanityImageUrl(image, {
    width: 150,
    height: 150,
    fit: 'contain',
    crop: 'center',
    format: 'png'
  })
}

// Helper para obtener logo pequeño de la banda
export const getSmallLogoImageUrl = (image) => {
  return getSanityImageUrl(image, {
    width: 80,
    height: 80,
    fit: 'contain',
    crop: 'center',
    format: 'png'
  })
} 
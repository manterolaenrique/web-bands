// Utilidades para manejar favicons dinámicos

// Función para actualizar el favicon con el logo de la banda
export const updateFavicon = async (logoRef) => {
  if (!logoRef) {
    resetToDefaultFavicon()
    return
  }

  try {
    // Obtener la URL del logo desde Sanity (URL simple que funciona)
    const logoUrl = getFaviconUrl(logoRef)
    
    // Verificar que la imagen se puede cargar
    const isLoaded = await checkFaviconLoaded(logoUrl)
    if (!isLoaded) {
      resetToDefaultFavicon()
      return
    }
    
    // Remover todos los favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    existingFavicons.forEach(favicon => favicon.remove())
    
    // Crear nuevo elemento link para el favicon
    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.type = 'image/png'
    favicon.href = logoUrl
    document.head.appendChild(favicon)
    
  } catch (error) {
    console.error('Error al actualizar favicon:', error)
    resetToDefaultFavicon()
  }
}

// Función para generar la URL del favicon desde el logo de Sanity
export const getFaviconUrl = (logoRef) => {
  if (!logoRef) return null
  
  // Extraer el ID de la imagen de Sanity
  const imageId = logoRef.replace('image-', '').replace(/-jpg$/, '.jpg').replace(/-png$/, '.png')
  
  // Construir la URL del favicon usando la configuración de Sanity
  const projectId = 'vyjsvcoh' // Valor por defecto
  const dataset = 'production' // Valor por defecto
  
  // URL simple sin parámetros - esta es la que funciona
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`
}

// Función para resetear al favicon por defecto
export const resetToDefaultFavicon = () => {
  // Remover todos los favicons existentes
  const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
  existingFavicons.forEach(favicon => favicon.remove())
  
  // Crear nuevo elemento favicon por defecto
  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.type = 'image/svg+xml'
  favicon.href = '/favicon.svg'
  document.head.appendChild(favicon)
}

// Función para crear un favicon desde una URL de imagen
export const createFaviconFromUrl = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    canvas.width = 32
    canvas.height = 32
    
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Dibujar la imagen en el canvas redimensionada a 32x32
      ctx.drawImage(img, 0, 0, 32, 32)
      
      // Convertir a data URL
      const dataUrl = canvas.toDataURL('image/png')
      
      // Actualizar el favicon
      let favicon = document.querySelector('link[rel="icon"]')
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      
      favicon.href = dataUrl
      favicon.type = 'image/png'
      
      resolve(dataUrl)
    }
    
    img.onerror = () => {
      reject(new Error('No se pudo cargar la imagen para el favicon'))
    }
    
    img.src = imageUrl
  })
}

// Función para verificar si el favicon se cargó correctamente
export const checkFaviconLoaded = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      resolve(true)
    }
    
    img.onerror = () => {
      resolve(false)
    }
    
    img.src = url
  })
}

// Función para generar diferentes variaciones de URL de favicon
export const generateFaviconUrls = (logoRef) => {
  if (!logoRef) return []
  
  const imageId = logoRef.replace('image-', '').replace(/-jpg$/, '.jpg').replace(/-png$/, '.png')
  const projectId = 'vyjsvcoh'
  const dataset = 'production'
  
  return [
    // URL simple sin parámetros
    `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`,
    // URL con solo tamaño
    `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}?w=32&h=32`,
    // URL con formato específico
    `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}?w=32&h=32&format=png`,
    // URL con fit básico
    `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}?w=32&h=32&fit=clip`,
    // URL original con todos los parámetros
    `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}?w=32&h=32&fit=crop&crop=center`
  ]
}

// Función de prueba para verificar la URL del favicon
export const testFaviconUrl = (logoRef) => {
  const url = getFaviconUrl(logoRef)
  console.log('🧪 URL de prueba del favicon:', url)
  return url
}

// Función para verificar si el favicon se está mostrando
export const checkFaviconDisplay = () => {
  console.log('🔍 Verificando favicon actual...')
  
  // Verificar favicons en el DOM
  const favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
  console.log('📋 Favicons encontrados:', favicons.length)
  
  favicons.forEach((favicon, index) => {
    console.log(`   ${index + 1}. ${favicon.rel}: ${favicon.href}`)
    
    // Verificar si la imagen se puede cargar
    const img = new Image()
    img.onload = () => {
      console.log(`   ✅ Favicon ${index + 1} se puede cargar: ${favicon.href}`)
    }
    img.onerror = () => {
      console.log(`   ❌ Favicon ${index + 1} NO se puede cargar: ${favicon.href}`)
    }
    img.src = favicon.href
  })
  
  return favicons.length > 0
} 
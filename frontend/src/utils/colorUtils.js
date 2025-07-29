// Utilidades para manejo de colores

// Función para generar una versión clara de un color
export const generateLightColor = (color, opacity = 0.1) => {
  if (!color) return null
  
  // Si es un color hex, convertirlo a rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  
  // Si ya es rgba, ajustar la opacidad
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`)
  }
  
  // Si es rgb, convertir a rgba
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`)
  }
  
  return color
}

// Función para generar una versión oscura de un color
export const generateDarkColor = (color, opacity = 0.8) => {
  if (!color) return null
  
  // Si es un color hex, convertirlo a rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  
  // Si ya es rgba, ajustar la opacidad
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`)
  }
  
  // Si es rgb, convertir a rgba
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`)
  }
  
  return color
}

// Función para obtener el color secundario con variaciones
export const getSecondaryColors = (colores) => {
  const secundario = colores?.secundario
  const secundarioClaro = colores?.secundario_claro
  
  return {
    main: secundario || '#666',
    light: secundarioClaro || generateLightColor(secundario, 0.1) || 'rgba(102, 102, 102, 0.1)',
    dark: generateDarkColor(secundario, 0.8) || 'rgba(102, 102, 102, 0.8)',
    medium: generateLightColor(secundario, 0.3) || 'rgba(102, 102, 102, 0.3)'
  }
}

// Función para verificar si un color es claro u oscuro
export const isLightColor = (color) => {
  if (!color) return false
  
  let r, g, b
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    r = parseInt(hex.substr(0, 2), 16)
    g = parseInt(hex.substr(2, 2), 16)
    b = parseInt(hex.substr(4, 2), 16)
  } else if (color.startsWith('rgb')) {
    const values = color.match(/\d+/g)
    r = parseInt(values[0])
    g = parseInt(values[1])
    b = parseInt(values[2])
  } else {
    return false
  }
  
  // Calcular luminosidad
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

// Función para obtener el color de texto apropiado según el fondo
export const getTextColor = (backgroundColor) => {
  return isLightColor(backgroundColor) ? '#333' : '#fff'
} 
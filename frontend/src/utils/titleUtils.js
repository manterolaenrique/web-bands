// Utilidades para manejar títulos de páginas

// Función para actualizar el título de la pestaña
export const updatePageTitle = (title, fallback = 'Bandas Musicales') => {
  if (title) {
    document.title = title
  } else {
    document.title = fallback
  }
}

// Función para crear título de banda con formato
export const createBandaTitle = (nombre, genero = null) => {
  if (!nombre) return 'Banda Musical'
  
  if (genero) {
    return `${nombre} - ${genero}`
  }
  
  return nombre
}

// Función para crear título de lista de bandas
export const createBandasListTitle = () => {
  return 'Bandas Musicales - Descubre Nuevos Talentos'
}

// Función para crear título de error
export const createErrorTitle = (context = 'Bandas Musicales') => {
  return `Error - ${context}`
}

// Función para crear título de carga
export const createLoadingTitle = (context = 'Bandas Musicales') => {
  return `Cargando - ${context}`
}

// Función para resetear al título por defecto
export const resetToDefaultTitle = () => {
  document.title = 'Bandas Musicales'
} 
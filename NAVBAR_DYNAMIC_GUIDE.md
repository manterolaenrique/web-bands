# 🧭 Guía: Navbar Dinámico - Enlaces Condicionales

Esta guía explica cómo funciona el sistema de navegación dinámico que muestra u oculta enlaces según el contenido configurado en Sanity.

## 🎯 Funcionalidad Implementada

### **Enlaces Condicionales**
Los enlaces en el navbar aparecen dinámicamente según el contenido configurado en Sanity:

#### **Enlace "Escúchanos" Condicional**
El enlace "Escúchanos" solo aparece cuando la banda tiene contenido configurado en esa sección.

#### **Enlace "Contacto" Condicional**
El enlace "Contacto" solo aparece cuando la banda tiene información de contacto configurada.

## 🔧 Cómo Funciona

### **Lógica de Verificación**
El navbar verifica automáticamente si hay contenido en la sección "Escúchanos":

```javascript
const hasEscuchanosContent = () => {
  if (!escuchanos) return false
  
  // Verificar YouTube
  const hasYouTube = escuchanos.youtube?.habilitado && 
                    escuchanos.youtube?.videos && 
                    escuchanos.youtube.videos.length > 0
  
  // Verificar Spotify
  const hasSpotify = escuchanos.spotify?.habilitado && 
                    (escuchanos.spotify?.perfil_url || 
                     (escuchanos.spotify?.playlists && escuchanos.spotify.playlists.length > 0))
  
  return hasYouTube || hasSpotify
}

// Función para verificar si la sección Contacto tiene contenido
const hasContactContent = () => {
  if (!contacto) return false
  
  // Verificar si hay información básica de contacto
  const hasBasicInfo = contacto.email || contacto.telefono || contacto.ubicacion
  
  // Verificar si hay redes sociales
  const hasSocialMedia = contacto.redes && Object.values(contacto.redes).some(url => url)
  
  return hasBasicInfo || hasSocialMedia
}
```

### **Condiciones para Mostrar "Escúchanos"**

#### ✅ **Se muestra cuando:**
- **YouTube habilitado** + al menos 1 video
- **Spotify habilitado** + perfil de artista
- **Spotify habilitado** + al menos 1 playlist
- **Cualquier combinación** de las anteriores

#### ❌ **Se oculta cuando:**
- No hay sección "Escúchanos" configurada
- YouTube y Spotify están deshabilitados
- YouTube habilitado pero sin videos
- Spotify habilitado pero sin perfil ni playlists

### **Condiciones para Mostrar "Contacto"**

#### ✅ **Se muestra cuando:**
- **Email configurado** (contacto.email)
- **Teléfono configurado** (contacto.telefono)
- **Ubicación configurada** (contacto.ubicacion)
- **Al menos una red social** configurada (contacto.redes)
- **Cualquier combinación** de las anteriores

#### ❌ **Se oculta cuando:**
- No hay sección "Contacto" configurada
- No hay email, teléfono ni ubicación
- No hay redes sociales configuradas
- Todos los campos están vacíos

## 📱 Comportamiento en Diferentes Dispositivos

### **Desktop**
- Enlaces "Escúchanos" y "Contacto" aparecen/desaparecen dinámicamente
- Espaciado se ajusta automáticamente
- Transiciones suaves

### **Mobile**
- Enlaces "Escúchanos" y "Contacto" aparecen/desaparecen en menú hamburguesa
- Menú se reajusta automáticamente
- Scroll suave a las secciones

## 🎨 Beneficios de la Implementación

### ✅ **Experiencia de Usuario**
- **Navegación limpia**: Solo enlaces relevantes
- **Sin enlaces rotos**: No hay enlaces a secciones vacías
- **Interfaz intuitiva**: Los usuarios ven solo lo que está disponible

### ✅ **Mantenimiento**
- **Automático**: No requiere configuración manual
- **Consistente**: Mismo comportamiento en todas las bandas
- **Escalable**: Fácil agregar más enlaces condicionales

### ✅ **Performance**
- **Renderizado condicional**: Solo renderiza lo necesario
- **Código limpio**: Lógica centralizada
- **Reutilizable**: Función helper reutilizable

## 🔍 Casos de Uso

### **Caso 1: Banda con Contenido Completo**
```yaml
# En Sanity CMS
Escúchanos:
  YouTube:
    Habilitado: ✅
    Videos: [Video1, Video2]
  Spotify:
    Habilitado: ✅
    Perfil: https://spotify.com/artist/123
    Playlists: [Playlist1, Playlist2]

# Resultado: Enlace "Escúchanos" visible ✅
```

### **Caso 2: Banda Solo con YouTube**
```yaml
# En Sanity CMS
Escúchanos:
  YouTube:
    Habilitado: ✅
    Videos: [Video1]
  Spotify:
    Habilitado: ❌

# Resultado: Enlace "Escúchanos" visible ✅
```

### **Caso 3: Banda Solo con Spotify**
```yaml
# En Sanity CMS
Escúchanos:
  YouTube:
    Habilitado: ❌
  Spotify:
    Habilitado: ✅
    Perfil: https://spotify.com/artist/123

# Resultado: Enlace "Escúchanos" visible ✅
```

### **Caso 4: Banda Sin Contenido**
```yaml
# En Sanity CMS
Escúchanos:
  YouTube:
    Habilitado: ❌
  Spotify:
    Habilitado: ❌

# Resultado: Enlace "Escúchanos" oculto ❌
```

### **Caso 5: Sin Sección Escúchanos**
```yaml
# En Sanity CMS
# No hay sección "Escúchanos" configurada

# Resultado: Enlace "Escúchanos" oculto ❌
```

## 📞 Casos de Uso para "Contacto"

### **Caso 1: Contacto Completo**
```yaml
# En Sanity CMS
Contacto:
  Email: banda@email.com
  Teléfono: +1234567890
  Ubicación: Ciudad, País
  Redes:
    Instagram: https://instagram.com/banda
    Spotify: https://spotify.com/artist/123

# Resultado: Enlace "Contacto" visible ✅
```

### **Caso 2: Solo Email**
```yaml
# En Sanity CMS
Contacto:
  Email: banda@email.com
  Teléfono: (vacío)
  Ubicación: (vacío)
  Redes: (vacío)

# Resultado: Enlace "Contacto" visible ✅
```

### **Caso 3: Solo Redes Sociales**
```yaml
# En Sanity CMS
Contacto:
  Email: (vacío)
  Teléfono: (vacío)
  Ubicación: (vacío)
  Redes:
    Instagram: https://instagram.com/banda

# Resultado: Enlace "Contacto" visible ✅
```

### **Caso 4: Sin Información de Contacto**
```yaml
# En Sanity CMS
Contacto:
  Email: (vacío)
  Teléfono: (vacío)
  Ubicación: (vacío)
  Redes: (vacío)

# Resultado: Enlace "Contacto" oculto ❌
```

### **Caso 5: Sin Sección Contacto**
```yaml
# En Sanity CMS
# No hay sección "Contacto" configurada

# Resultado: Enlace "Contacto" oculto ❌
```

## 🚀 Extensibilidad

### **Agregar Más Enlaces Condicionales**
El sistema está diseñado para ser fácilmente extensible:

```javascript
// Ejemplo: Agregar enlace "Galería" condicional
const hasGalleryContent = () => {
  return banda.galeria?.imagenes && banda.galeria.imagenes.length > 0
}

// En el JSX
{hasGalleryContent() && (
  <button onClick={() => scrollToSection('galeria')}>
    Galería
  </button>
)}
```

### **Enlaces Dinámicos Futuros**
- **"Eventos"**: Solo si hay eventos próximos
- **"Tienda"**: Solo si hay productos disponibles
- **"Blog"**: Solo si hay artículos publicados
- **"Galería"**: Solo si hay fotos/videos

## 🎯 Resultado Final

### **Navbar Inteligente**
- **Se adapta automáticamente** al contenido de cada banda
- **Experiencia personalizada** para cada usuario
- **Navegación limpia** sin enlaces innecesarios
- **Interfaz profesional** y consistente

### **Beneficios para Bandas**
- **Configuración flexible**: Pueden elegir qué secciones mostrar
- **Navegación relevante**: Los visitantes ven solo contenido disponible
- **Experiencia optimizada**: Cada banda tiene su navbar personalizado

¡El navbar ahora es completamente dinámico y se adapta automáticamente al contenido de cada banda! 🎵✨ 
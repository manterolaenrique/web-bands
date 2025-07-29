# 🎵 Guía: Configurar la Sección "Escúchanos"

Esta guía te explica cómo configurar la nueva sección "Escúchanos" en el CMS de Sanity para mostrar videos de YouTube y música de Spotify.

## 📋 Estructura de la Sección

La sección "Escúchanos" incluye:

### 🎥 YouTube
- **Título personalizable** (ej: "Videos en YouTube")
- **Videos múltiples** con título, URL y descripción
- **Embeds automáticos** de YouTube
- **Diseño responsive** con grid

### 🎵 Spotify
- **Título personalizable** (ej: "Música en Spotify")
- **Perfil de artista** con enlace directo
- **Playlists destacadas** con embeds automáticos
- **Botón de acción** con colores de Spotify

## 🚀 Cómo Configurar en Sanity

### 1. Acceder al CMS
1. Ve a http://localhost:3333
2. Selecciona tu banda
3. Busca la sección "Sección Escúchanos"

### 2. Configurar YouTube

#### Información General
- **Título de la Sección**: "Escúchanos" (por defecto)
- **Descripción**: Texto descriptivo opcional

#### Configuración de YouTube
- **Habilitar YouTube**: ✅ Marcar para mostrar la sección
- **Título de YouTube**: "Videos en YouTube" (personalizable)

#### Agregar Videos
1. Haz clic en "Añadir elemento" en "Videos de YouTube"
2. Completa los campos:
   - **Título del Video**: "Nuestro último single"
   - **URL del Video**: `https://www.youtube.com/watch?v=VIDEO_ID`
   - **Descripción**: "Descripción opcional del video"

#### Formatos de URL Soportados
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

### 3. Configurar Spotify

#### Configuración de Spotify
- **Habilitar Spotify**: ✅ Marcar para mostrar la sección
- **Título de Spotify**: "Música en Spotify" (personalizable)

#### Perfil de Artista
- **URL del Perfil**: `https://open.spotify.com/artist/ARTIST_ID`
- Ejemplo: `https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg`

#### Agregar Playlists
1. Haz clic en "Añadir elemento" en "Playlists Destacadas"
2. Completa los campos:
   - **Título de la Playlist**: "Éxitos 2024"
   - **URL de la Playlist**: `https://open.spotify.com/playlist/PLAYLIST_ID`
   - **Descripción**: "Nuestros mejores temas"

#### Formatos de URL Soportados
- **Perfil**: `https://open.spotify.com/artist/ARTIST_ID`
- **Playlist**: `https://open.spotify.com/playlist/PLAYLIST_ID`

## 🎨 Personalización

### Colores
Los colores se aplican automáticamente desde la configuración de la banda:
- **Color Primario**: Títulos y elementos destacados
- **Color Secundario**: Líneas decorativas

### Responsive Design
- **Desktop**: Grid de 2 columnas (YouTube | Spotify)
- **Mobile**: Columnas apiladas verticalmente

## 📱 Funcionalidades

### YouTube
- ✅ Embeds automáticos de videos
- ✅ Extracción automática del ID del video
- ✅ Información del video (título, descripción)
- ✅ Aspect ratio 16:9 responsive

### Spotify
- ✅ Enlace directo al perfil de artista
- ✅ Embeds automáticos de playlists
- ✅ Botón de acción con hover effects
- ✅ Colores oficiales de Spotify (#1DB954)

## 🔧 Códigos de Embed y Configuración

### 🎥 YouTube - Códigos de Embed

El sistema extrae automáticamente el ID del video de cualquier URL de YouTube. **No necesitas copiar códigos de embed complejos**, solo la URL del video.

#### URLs Soportadas:
```
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://youtu.be/dQw4w9WgXcQ
✅ https://www.youtube.com/embed/dQw4w9WgXcQ
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s
```

#### Ejemplo de Configuración en Sanity:
```yaml
Título del Video: "Nuestro último concierto en vivo"
URL del Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Descripción: "Concierto completo desde el Teatro Municipal"
```

#### Código de Embed Generado Automáticamente:
```html
<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  title="Nuestro último concierto en vivo"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen>
</iframe>
```

### 🎵 Spotify - Códigos de Embed

#### Perfil de Artista
**URL del Perfil en Sanity:**
```
https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg
```

**Código de Embed Generado:**
```html
<a href="https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg">
  🎵 Ver Perfil en Spotify
</a>
```

#### Playlists
**URL de Playlist en Sanity:**
```
https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
```

**Código de Embed Generado:**
```html
<iframe 
  src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"
  width="100%" 
  height="80" 
  allow="encrypted-media">
</iframe>
```

### 📋 Ejemplos Completos de Configuración

#### Ejemplo 1: Banda de Rock
```yaml
# En Sanity CMS - Sección "Escúchanos"

Título de la Sección: "Escúchanos"
Descripción: "Descubre nuestra música en las mejores plataformas"

YouTube:
  Habilitar YouTube: ✅
  Título de YouTube: "Videos en Vivo"
  Videos:
    - Título del Video: "Concierto Completo - Teatro Municipal"
      URL del Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
      Descripción: "Nuestro concierto más importante del año"
    
    - Título del Video: "Sesión Acústica - Radio"
      URL del Video: https://youtu.be/9bZkp7q19f0
      Descripción: "Versión acústica de nuestros éxitos"

Spotify:
  Habilitar Spotify: ✅
  Título de Spotify: "Música en Spotify"
  URL del Perfil: https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg
  Playlists:
    - Título de la Playlist: "Éxitos 2024"
      URL de la Playlist: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
      Descripción: "Nuestros mejores temas del año"
    
    - Título de la Playlist: "En Vivo"
      URL de la Playlist: https://open.spotify.com/playlist/37i9dQZF1DX5Vy6DFOcx00
      Descripción: "Grabaciones en vivo de nuestros conciertos"
```

#### Ejemplo 2: Banda Acústica
```yaml
# En Sanity CMS - Sección "Escúchanos"

Título de la Sección: "Nuestra Música"
Descripción: "Sesiones acústicas y versiones en vivo"

YouTube:
  Habilitar YouTube: ✅
  Título de YouTube: "Sesiones Acústicas"
  Videos:
    - Título del Video: "Sesión Acústica - Canción 1"
      URL del Video: https://www.youtube.com/watch?v=VIDEO_ID_1
      Descripción: "Versión acústica de nuestro primer single"
    
    - Título del Video: "En Vivo - Canción 2"
      URL del Video: https://youtu.be/VIDEO_ID_2
      Descripción: "Presentación en vivo desde el estudio"

Spotify:
  Habilitar Spotify: ✅
  Título de Spotify: "Streaming"
  URL del Perfil: https://open.spotify.com/artist/ARTIST_ID
  Playlists:
    - Título de la Playlist: "Acústico"
      URL de la Playlist: https://open.spotify.com/playlist/PLAYLIST_ID
      Descripción: "Versiones acústicas de nuestros temas"
```

### 🎯 Ventajas del Sistema

#### ✅ **Simplicidad**
- **No necesitas copiar códigos HTML complejos**
- **Solo URLs simples de YouTube y Spotify**
- **El sistema genera automáticamente los embeds**

#### ✅ **Optimización Automática**
- **Responsive design incluido**
- **Aspect ratios correctos**
- **Permisos de seguridad configurados**
- **Accesibilidad integrada**

#### ✅ **Flexibilidad**
- **Múltiples videos y playlists**
- **Títulos y descripciones personalizables**
- **Habilitar/deshabilitar secciones**
- **Colores dinámicos de la banda**

### 🔍 Cómo Obtener URLs

#### YouTube
1. Ve al video en YouTube
2. Copia la URL del navegador
3. Pega directamente en Sanity

#### Spotify - Perfil de Artista
1. Ve a tu perfil en Spotify
2. Copia la URL del navegador
3. Formato: `https://open.spotify.com/artist/ARTIST_ID`

#### Spotify - Playlist
1. Ve a tu playlist en Spotify
2. Copia la URL del navegador
3. Formato: `https://open.spotify.com/playlist/PLAYLIST_ID`

## 🔧 Configuración Paso a Paso

### Paso 1: Acceder a Sanity CMS
1. Abre http://localhost:3333
2. Selecciona tu banda
3. Busca la sección "Sección Escúchanos"

### Paso 2: Configurar Información General
```yaml
Título de la Sección: "Escúchanos"
Descripción: "Descubre nuestra música en las mejores plataformas"
```

### Paso 3: Configurar YouTube
```yaml
Habilitar YouTube: ✅ (marcar checkbox)
Título de YouTube: "Videos en Vivo"

# Agregar videos:
Videos de YouTube:
  - Título del Video: "Concierto Completo - Teatro Municipal"
    URL del Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    Descripción: "Nuestro concierto más importante del año"
  
  - Título del Video: "Sesión Acústica - Radio"
    URL del Video: https://youtu.be/9bZkp7q19f0
    Descripción: "Versión acústica de nuestros éxitos"
```

### Paso 4: Configurar Spotify
```yaml
Habilitar Spotify: ✅ (marcar checkbox)
Título de Spotify: "Música en Spotify"
URL del Perfil: https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg

# Agregar playlists:
Playlists Destacadas:
  - Título de la Playlist: "Éxitos 2024"
    URL de la Playlist: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    Descripción: "Nuestros mejores temas del año"
  
  - Título de la Playlist: "En Vivo"
    URL de la Playlist: https://open.spotify.com/playlist/37i9dQZF1DX5Vy6DFOcx00
    Descripción: "Grabaciones en vivo de nuestros conciertos"
```

### Paso 5: Guardar y Publicar
1. Haz clic en "Publish" en Sanity
2. Los cambios aparecerán automáticamente en tu sitio web

## 💡 Consejos y Mejores Prácticas

### 🎥 Para YouTube
- **Usa títulos descriptivos**: "Concierto en Vivo - Teatro Municipal" en lugar de "Video 1"
- **Agrega descripciones**: Ayudan a los visitantes a entender el contenido
- **Ordena por importancia**: Los videos más importantes primero
- **Máximo 3-4 videos**: Para no sobrecargar la página

### 🎵 Para Spotify
- **Perfil de artista**: Siempre incluye el enlace a tu perfil principal
- **Playlists temáticas**: Crea playlists específicas (Éxitos, En Vivo, Acústico)
- **Descripciones claras**: Explica qué contiene cada playlist
- **Actualiza regularmente**: Mantén las playlists actualizadas

### 🎨 Para el Diseño
- **Títulos consistentes**: Usa el mismo estilo de títulos en toda la banda
- **Descripción atractiva**: Escribe algo que invite a escuchar/ver
- **Colores de la banda**: Se aplican automáticamente desde la configuración

### 🔧 Solución de Problemas

#### Video no se muestra
- ✅ Verifica que la URL sea válida
- ✅ Asegúrate de que el video no sea privado
- ✅ Prueba con diferentes formatos de URL

#### Playlist no se carga
- ✅ Verifica que la playlist sea pública
- ✅ Confirma que la URL sea correcta
- ✅ Asegúrate de que tengas permisos de embed

#### Sección no aparece
- ✅ Verifica que hayas marcado "Habilitar YouTube/Spotify"
- ✅ Confirma que hayas publicado los cambios
- ✅ Revisa que tengas al menos un video o playlist

## 🎯 Resultado

Una vez configurada, la sección mostrará:

1. **Header centrado** con título y descripción
2. **Grid de 2 columnas** con YouTube y Spotify
3. **Videos embebidos** de YouTube con información
4. **Perfil de Spotify** con botón de acción
5. **Playlists embebidas** de Spotify
6. **Diseño responsive** para todos los dispositivos

¡Tu banda tendrá una sección profesional para mostrar su contenido multimedia! 🚀 
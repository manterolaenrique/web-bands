# 🕒 Guía de Uso - TimelineSection Refactorizado

## 📋 Descripción

El componente `TimelineSection` ha sido completamente refactorizado para ofrecer una experiencia moderna, accesible y completamente responsiva. Este documento muestra cómo implementar y personalizar el componente.

## 🚀 Implementación Básica

### **1. Importación del Componente**

```jsx
import TimelineSection from './components/TimelineSection'
```

### **2. Uso Básico**

```jsx
function App() {
  const timelineData = {
    enabled: true,
    titulo: "Nuestra Historia Musical",
    descripcion: "Un recorrido por los momentos más importantes de nuestra carrera",
    events: [
      {
        name: "Formación de la Banda",
        date: "2018-03-15",
        importance: "principal",
        descripcion: "Nacimos como un proyecto de amigos apasionados por la música"
      },
      {
        name: "Primer Concierto",
        date: "2018-08-20",
        importance: "secundario",
        descripcion: "Nuestro debut en vivo en el local de la esquina"
      },
      {
        name: "Lanzamiento del Primer Single",
        date: "2019-02-10",
        importance: "principal",
        descripcion: "Nuestra primera canción oficial disponible en todas las plataformas",
        link: "https://open.spotify.com/track/example"
      }
```

**Resultado visual del enlace:**
```
📎 Enlace disponible
🔗 Ver más
```
    ]
  }

  const colores = {
    primario: "#667eea",
    secundario: "#764ba2"
  }

  return (
    <div>
      <TimelineSection 
        timelineSection={timelineData}
        colores={colores}
      />
    </div>
  )
}
```

## 🎨 Personalización Avanzada

### **1. Configuración de Colores**

```jsx
const colores = {
  primario: "#667eea",        // Color principal para eventos importantes
  secundario: "#764ba2",      // Color secundario para eventos regulares
  secundario_claro: "#f093fb", // Color claro para fondos
  acento: "#4CAF50"           // Color de acento para elementos destacados
}
```

### **2. Tipos de Eventos y Iconos**

El componente detecta automáticamente el tipo de evento basándose en el nombre:

```jsx
const events = [
  // Conciertos y Shows
  { name: "Concierto en el Estadio", date: "2020-06-15", importance: "principal" },
  { name: "Show Acústico", date: "2020-03-20", importance: "secundario" },
  
  // Lanzamientos Musicales
  { name: "Álbum Debut", date: "2019-11-10", importance: "principal" },
  { name: "Single 'Libertad'", date: "2020-01-15", importance: "secundario" },
  
  // Videos y Multimedia
  { name: "Videoclip Oficial", date: "2020-02-28", importance: "secundario", link: "https://youtube.com/watch?v=example" },
  
  // Premios y Reconocimientos
  { name: "Premio Mejor Banda", date: "2020-12-05", importance: "principal", link: "https://example.com/news/premio" },
  
  // Tours y Giras
  { name: "Tour Nacional", date: "2021-03-01", importance: "principal", link: "https://example.com/tour" },
  
  // Colaboraciones
  { name: "Colaboración con Artista X", date: "2020-09-15", importance: "secundario", link: "https://example.com/collaboration" }
]
```

### **3. Niveles de Importancia**

```jsx
// Eventos Principales - Más grandes y destacados
{ importance: "principal" }

// Eventos Secundarios - Tamaño medio
{ importance: "secundario" }

// Eventos Menores - Más pequeños y sutiles
{ importance: "tercero" }
```

## 📱 Responsividad Automática

### **Desktop (>1024px)**
- Layout horizontal con scroll suave
- Imágenes en hover/click
- Controles de navegación completos
- Animaciones fluidas

### **Tablet (768px-1024px)**
- Layout híbrido adaptativo
- Scroll horizontal optimizado
- Controles adaptados al tamaño

### **Mobile (<768px)**
- Layout vertical automático
- Descripciones siempre visibles
- Controles apilados
- Línea de tiempo vertical

## 🎯 Funcionalidades Interactivas

### **1. Navegación Manual**

```jsx
// Los usuarios pueden:
// - Hacer scroll horizontal en desktop
// - Usar los botones de navegación
// - Hacer click en los indicadores
// - Usar el botón "Inicio" para volver al principio
```

### **2. Recorrido Automático**

```jsx
// El botón "Recorrido Auto" permite:
// - Navegación automática por todos los eventos
// - Pausa automática al completar un ciclo
// - Control manual para detener en cualquier momento
```

### **3. Interacciones por Evento**

```jsx
// Cada evento permite:
// - Hover para elevación y efectos visuales
// - Click para expandir y mostrar imagen (si existe)
// - Navegación por teclado (Enter/Space)
// - Focus visible para accesibilidad
```

## 🖼️ Integración con Imágenes

### **1. Configuración de Imágenes**

```jsx
const events = [
      {
      name: "Concierto en el Estadio",
      date: "2020-06-15",
      importance: "principal",
      descripcion: "Nuestro concierto más grande hasta la fecha",
      link: "https://example.com/concert-review",
      image: {
        // Objeto de imagen de Sanity CMS
        asset: {
          _ref: "image-1234567890"
        }
      }
    }
]
```

### **2. Comportamiento de Imágenes**

- **Desktop**: Aparecen en hover/click como modal
- **Mobile**: Se muestran de forma más prominente
- **Lazy Loading**: Carga optimizada para performance
- **Fallback**: Manejo elegante si la imagen no carga

### **3. Enlaces de Eventos**

- **Opcional**: Campo opcional para cada evento
- **Validación visual**: Muestra indicador "📎 Enlace disponible" cuando existe
- **Seguridad**: Se abren en nueva pestaña con `rel="noopener noreferrer"`
- **Accesibilidad**: Aria-label descriptivo para screen readers
- **Estilo**: Diseño consistente con el sistema de colores
- **Responsivo**: Adaptado para todos los dispositivos
- **Contenedor estructurado**: Organiza indicador y enlace en layout vertical

## 📅 Ejemplo de timelineData

```javascript
const timelineData = {
  enabled: true,
  titulo: "Nuestra Historia Musical",
  descripcion: "Un recorrido por los momentos más importantes de nuestra carrera musical",
  events: [
    {
      name: "Formación de la Banda",
      date: "2018-03-15",
      descripcion: "Nacimos como un grupo de amigos apasionados por la música",
      importance: "principal",
      icon: "🎸", // Icono configurado desde Sanity
      image: {
        asset: {
          _ref: "image-1234567890"
        }
      }
    },
    {
      name: "Primer Concierto",
      date: "2018-06-20",
      descripcion: "Nuestro debut en vivo en el Teatro Municipal",
      importance: "secundario",
      icon: "🎤", // Icono de micrófono para concierto
      link: "https://youtube.com/watch?v=primer-concierto"
    },
    {
      name: "Lanzamiento del Primer Álbum",
      date: "2019-02-10",
      descripcion: "Nuestro álbum debut 'Sueños de Juventud'",
      importance: "principal",
      icon: "💿", // Icono de disco para álbum
      image: {
        asset: {
          _ref: "image-0987654321"
        }
      },
      link: "https://spotify.com/album/suenos-juventud"
    },
    {
      name: "Premio al Mejor Grupo Nuevo",
      date: "2019-12-05",
      descripcion: "Reconocimiento en los Premios de la Música Local",
      importance: "principal",
      icon: "🏆", // Icono de trofeo para premio
      link: "https://premiosmusica.com/ganadores-2019"
    },
    {
      name: "Tour Nacional",
      date: "2020-03-15",
      descripcion: "Gira por 15 ciudades del país",
      importance: "secundario",
      icon: "🚌", // Icono de autobús para tour
      image: {
        asset: {
          _ref: "image-1122334455"
        }
      }
    },
    {
      name: "Colaboración con Artista Internacional",
      date: "2020-08-20",
      descripcion: "Trabajamos junto a [Artista] en su nuevo álbum",
      importance: "secundario",
      icon: "🤝", // Icono de colaboración
      link: "https://instagram.com/p/colaboracion-internacional"
    },
    {
      name: "Festival de Música Indie",
      date: "2021-05-10",
      descripcion: "Participamos en el festival más importante del género",
      importance: "principal",
      icon: "🎪", // Icono de carpa para festival
      image: {
        asset: {
          _ref: "image-5566778899"
        }
      }
    },
    {
      name: "Lanzamiento del Segundo Álbum",
      date: "2021-09-15",
      descripcion: "Nuestro álbum más maduro y experimental",
      importance: "principal",
      icon: "💿🎵", // Combinación de disco con nota musical
      link: "https://bandcamp.com/album/segundo-album"
    },
    {
      name: "Video Musical Premiado",
      date: "2022-01-20",
      descripcion: "Nuestro video 'Nuevos Horizontes' gana premio al mejor video indie",
      importance: "secundario",
      icon: "🎬🏆", // Combinación de cámara con trofeo
      link: "https://vimeo.com/video-premiado"
    },
    {
      name: "Gira Internacional",
      date: "2022-06-01",
      descripcion: "Nuestro primer tour por Europa y América Latina",
      importance: "principal",
      icon: "🚌🌐", // Combinación de autobús con mundo
      image: {
        asset: {
          _ref: "image-9988776655"
        }
      }
    }
  ]
}
```

## 🎵 Enlaces de Eventos

### Comportamiento
- **Opcional**: Cada evento puede tener un enlace o no
- **Validación**: Se valida que la URL sea válida antes de mostrar
- **Indicador visual**: Se muestra "📎 Enlace disponible" antes del enlace
- **Apertura segura**: Los enlaces se abren en nueva pestaña con `target="_blank"`
- **Prevención de eventos**: Se evita que el click en el enlace active el evento

### Ejemplo de Enlace
```javascript
{
  name: "Concierto en el Teatro",
  date: "2023-03-15",
  descripcion: "Nuestro concierto más importante del año",
  link: "https://teatro.com/entradas/concierto-2023",
  icon: "🎤🏆" // Concierto premiado
}
```

### Salida Visual
```
📎 Enlace disponible
🔗 Ver más
```

## 🎯 Iconos Configurables

### Categorías Disponibles

#### 🎵 Iconos de Música
- **🎤** - Conciertos, shows en vivo
- **💿** - Álbumes, CDs, lanzamientos
- **🎵** - Singles, canciones
- **🎬** - Videos, clips musicales
- **🎸** - Formación de banda, rock
- **🥁** - Batería, ritmo
- **🎹** - Teclado, instrumental
- **🎺** - Instrumentos de viento
- **🎻** - Cuerdas, orquesta
- **🎧** - Escuchar música
- **📻** - Transmisiones
- **🎙️** - Grabaciones
- **🎚️** - Producción
- **🎛️** - Audio
- **🎼** - Composición
- **🎷** - Jazz, fusion
- **🪕** - Folk, country
- **🪘** - Percusión
- **🪗** - Tango, folk
- **🪕** - Folk

#### 📅 Iconos de Eventos
- **📅** - Fechas, eventos
- **⭐** - Eventos principales
- **🎯** - Eventos secundarios
- **📌** - Eventos generales
- **🏆** - Premios, reconocimientos
- **🚌** - Tours, giras
- **🤝** - Colaboraciones
- **🎪** - Festivales
- **🎭** - Teatro, shows
- **🎨** - Arte, creatividad
- **📺** - Televisión
- **📱** - Digital, apps
- **💻** - Online, digital
- **🌐** - Internacional
- **🏛️** - Venues, lugares
- **🎡** - Ferias
- **🎢** - Aventura
- **🎠** - Nostalgia
- **🎣** - Paciencia

#### 🎵🎯 Combinaciones Especiales
- **🎤🎵** - Shows en vivo
- **💿🎵** - Álbumes
- **🎸🎤** - Rock
- **🥁🎵** - Ritmo
- **🎹🎼** - Clásico
- **🎺🎷** - Jazz
- **🎻🎼** - Orquesta
- **🎧🎵** - Escuchar
- **📻🎵** - Transmisión
- **🎙️🎚️** - Grabación
- **🎼🎵** - Composición
- **🎪🎭** - Festival
- **🏆⭐** - Premio principal
- **🚌🌐** - Gira internacional
- **🤝🎵** - Colaboración musical
- **📅⭐** - Fecha importante

#### 🏆 Combinaciones con Premios
- **🎤🏆** - Concierto premiado
- **💿🏆** - Álbum premiado
- **🎵🏆** - Canción premiada
- **🎬🏆** - Video premiado
- **🎸🏆** - Instrumento premiado
- **🎪🏆** - Festival premiado
- **🎭🏆** - Show premiado
- **🎨🏆** - Arte premiado
- **📺🏆** - Televisión premiada
- **📱🏆** - Digital premiado
- **💻🏆** - Online premiado
- **🌐🏆** - Internacional premiado
- **🏛️🏆** - Venue premiado
- **🎡🏆** - Feria premiada
- **🎢🏆** - Aventura premiada
- **🎠🏆** - Nostalgia premiada
- **🎣🏆** - Paciencia premiada

### Configuración en Sanity
1. **Acceder al CMS** y seleccionar la banda
2. **Editar evento** en Timeline Section
3. **Seleccionar icono** del menú desplegable
4. **Campo obligatorio** - debe elegirse un icono
5. **Guardar cambios** y ver en el sitio web

### Sistema de Fallbacks
Si no se configura un icono en Sanity:
1. **Lógica automática** basada en palabras clave del nombre
2. **Icono por importancia** (⭐ para principal, 🎯 para secundario, etc.)

## ♿ Accesibilidad

### **1. Navegación por Teclado**

```jsx
// Los usuarios pueden navegar usando:
// - Tab: Mover entre elementos interactivos
// - Enter/Space: Activar eventos
// - Escape: Cerrar modales o estados activos
```

### **2. Roles ARIA**

```jsx
// El componente incluye:
// - role="button" para eventos interactivos
// - aria-label con descripción completa
// - aria-expanded para estados activos
// - tabIndex para navegación por teclado
```

### **3. Soporte para Screen Readers**

```jsx
// Cada evento incluye:
// - Descripción completa en aria-label
// - Información contextual (fecha, importancia)
// - Estados claros (hover, active, expanded)
```

## 🔧 Configuración Avanzada

### **1. Personalización de Estilos**

```jsx
// El componente usa variables CSS del sistema de diseño:
// - --color-primary, --color-secondary
// - --space-* para espaciado
// - --text-* para tipografía
// - --shadow-* para sombras
// - --transition-* para animaciones
```

### **2. Breakpoints Personalizados**

```jsx
// Los breakpoints están definidos en index.css:
// - 640px (sm)
// - 768px (md) 
// - 1024px (lg)
// - 1280px (xl)
// - 1536px (2xl)
```

### **3. Animaciones y Transiciones**

```jsx
// El componente respeta:
// - prefers-reduced-motion para usuarios con sensibilidad
// - Transiciones suaves con CSS variables
// - Animaciones optimizadas para performance
```

## 📊 Validación de Datos

### **1. Validaciones Automáticas**

```jsx
// El componente valida automáticamente:
// - Existencia de timelineSection.enabled
// - Presencia de eventos válidos
// - Campos requeridos (name, date)
// - Formato de fechas
```

### **2. Manejo de Errores**

```jsx
// Si hay errores:
// - Se muestran warnings en consola
// - Se usan valores por defecto
// - El componente no se rompe
// - Se filtran eventos inválidos
```

## 🚀 Optimizaciones de Performance

### **1. Lazy Loading**

```jsx
// Las imágenes usan:
<img loading="lazy" />
// Para cargar solo cuando son visibles
```

### **2. Cleanup Automático**

```jsx
// El componente limpia automáticamente:
useEffect(() => {
  return () => {
    setHoveredEvent(null)
    setActiveEvent(null)
    setIsScrolling(false)
  }
}, [])
```

### **3. Scroll Optimizado**

```jsx
// El scroll horizontal usa:
// - scroll-snap-type para comportamiento suave
// - scroll-snap-align para alineación precisa
// - overflow-x: auto para scroll nativo
```

## 🎨 Ejemplos de Uso Comunes

### **1. Timeline de Banda Musical**

```jsx
const bandTimeline = {
  enabled: true,
  titulo: "Nuestra Historia",
  descripcion: "Desde nuestros inicios hasta hoy",
  events: [
    {
      name: "Formación",
      date: "2018-01-15",
      importance: "principal",
      descripcion: "Nacimos como un sueño de amigos"
    },
    {
      name: "Primer Demo",
      date: "2018-06-20",
      importance: "secundario",
      descripcion: "Nuestras primeras grabaciones"
    },
    {
      name: "Debut en Vivo",
      date: "2018-09-10",
      importance: "principal",
      descripcion: "Nuestro primer concierto oficial"
    }
  ]
}
```

### **2. Timeline de Proyecto**

```jsx
const projectTimeline = {
  enabled: true,
  titulo: "Cronología del Proyecto",
  descripcion: "Hitos importantes en nuestro desarrollo",
  events: [
    {
      name: "Inicio del Proyecto",
      date: "2023-01-01",
      importance: "principal"
    },
    {
      name: "Primera Versión Beta",
      date: "2023-03-15",
      importance: "secundario"
    },
    {
      name: "Lanzamiento Oficial",
      date: "2023-06-01",
      importance: "principal"
    }
  ]
}
```

## 🔍 Debugging y Troubleshooting

### **1. Problemas Comunes**

```jsx
// Si el componente no se muestra:
// 1. Verificar timelineSection.enabled = true
// 2. Asegurar que hay eventos válidos
// 3. Verificar que los eventos tienen name y date

// Si las imágenes no cargan:
// 1. Verificar la estructura del objeto image
// 2. Asegurar que getGalleryImageUrl funciona
// 3. Revisar la configuración de Sanity CMS
```

### **2. Logs de Debug**

```jsx
// El componente muestra warnings en consola para:
// - Fechas inválidas
// - Eventos sin campos requeridos
// - Errores en la carga de imágenes
```

## 📈 Métricas y Analytics

### **1. Interacciones Rastreables**

```jsx
// Se pueden rastrear:
// - Clicks en eventos
// - Uso del recorrido automático
// - Navegación por indicadores
// - Tiempo de permanencia en cada evento
```

### **2. Performance Metrics**

```jsx
// Métricas disponibles:
// - Tiempo de carga inicial
// - Performance de scroll
// - Uso de memoria
// - Lazy loading effectiveness
```

## 🎯 Conclusión

El componente `TimelineSection` refactorizado ofrece:

- ✅ **Experiencia moderna** con diseño actual
- ✅ **Responsividad completa** en todos los dispositivos
- ✅ **Accesibilidad total** para todos los usuarios
- ✅ **Performance optimizada** con lazy loading
- ✅ **Fácil personalización** con el sistema de diseño
- ✅ **Integración perfecta** con Sanity CMS

**Estado**: ✅ Listo para producción
**Compatibilidad**: Todos los navegadores modernos
**Accesibilidad**: WCAG 2.1 AA compliant 
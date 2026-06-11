# 🎵 Guía de Iconos para TimelineSection

## 📋 Descripción

El componente `TimelineSection` ahora permite configurar iconos personalizados para cada evento desde Sanity CMS. Los usuarios pueden seleccionar entre una amplia variedad de iconos relacionados con música, eventos y fechas.

## 🎯 Categorías de Iconos Disponibles

### 🎵 Iconos de Música
- **🎤 Micrófono** - Para conciertos, shows en vivo
- **💿 Disco** - Para álbumes, CDs, lanzamientos
- **🎵 Nota musical** - Para singles, canciones
- **🎬 Cámara** - Para videos, clips musicales
- **🎸 Guitarra** - Para formación de banda, rock
- **🥁 Tambor** - Para batería, ritmo
- **🎹 Piano** - Para teclado, instrumental
- **🎺 Trompeta** - Para instrumentos de viento
- **🎻 Violín** - Para cuerdas, orquesta
- **🎧 Auriculares** - Para escuchar música
- **📻 Radio** - Para transmisiones
- **🎙️ Micrófono de estudio** - Para grabaciones
- **🎚️ Control de mezcla** - Para producción
- **🎛️ Control de volumen** - Para audio
- **🎼 Partitura** - Para composición
- **🎷 Saxofón** - Para jazz, fusion
- **🪕 Banjo** - Para folk, country
- **🪘 Gong** - Para percusión
- **🪗 Acordeón** - Para tango, folk
- **🪕 Mandolina** - Para folk

### 📅 Iconos de Eventos y Fechas
- **📅 Calendario** - Para fechas, eventos
- **⭐ Estrella** - Para eventos principales
- **🎯 Diana** - Para eventos secundarios
- **📌 Pin** - Para eventos generales
- **🏆 Trofeo** - Para premios, reconocimientos
- **🚌 Autobús** - Para tours, giras
- **🤝 Apretón de manos** - Para colaboraciones
- **🎪 Carpa** - Para festivales
- **🎭 Máscaras** - Para teatro, shows
- **🎨 Paleta** - Para arte, creatividad
- **📺 TV** - Para televisión
- **📱 Móvil** - Para digital, apps
- **💻 Computadora** - Para online, digital
- **🌐 Mundo** - Para internacional
- **🏛️ Edificio** - Para venues, lugares
- **🎡 Rueda de la fortuna** - Para ferias
- **🎢 Montaña rusa** - Para aventura
- **🎠 Caballito** - Para nostalgia
- **🎣 Caña de pescar** - Para paciencia

### 🎵🎯 Combinaciones Especiales
- **🎤🎵 Micrófono con nota** - Para shows en vivo
- **💿🎵 Disco con nota** - Para álbumes
- **🎸🎤 Guitarra con micrófono** - Para rock
- **🥁🎵 Tambor con nota** - Para ritmo
- **🎹🎼 Piano con partitura** - Para clásico
- **🎺🎷 Trompeta y saxofón** - Para jazz
- **🎻🎼 Violín con partitura** - Para orquesta
- **🎧🎵 Auriculares con nota** - Para escuchar
- **📻🎵 Radio con nota** - Para transmisión
- **🎙️🎚️ Micrófono con controles** - Para grabación
- **🎼🎵 Partitura con nota** - Para composición
- **🎪🎭 Carpa con máscaras** - Para festival
- **🏆⭐ Trofeo con estrella** - Para premio principal
- **🚌🌐 Autobús con mundo** - Para gira internacional
- **🤝🎵 Apretón con nota** - Para colaboración musical
- **📅⭐ Calendario con estrella** - Para fecha importante

### 🏆 Combinaciones con Premios
- **🎤🏆 Micrófono con trofeo** - Concierto premiado
- **💿🏆 Disco con trofeo** - Álbum premiado
- **🎵🏆 Nota con trofeo** - Canción premiada
- **🎬🏆 Cámara con trofeo** - Video premiado
- **🎸🏆 Guitarra con trofeo** - Instrumento premiado
- **🎪🏆 Carpa con trofeo** - Festival premiado
- **🎭🏆 Máscaras con trofeo** - Show premiado
- **🎨🏆 Paleta con trofeo** - Arte premiado
- **📺🏆 TV con trofeo** - Televisión premiada
- **📱🏆 Móvil con trofeo** - Digital premiado
- **💻🏆 Computadora con trofeo** - Online premiado
- **🌐🏆 Mundo con trofeo** - Internacional premiado
- **🏛️🏆 Edificio con trofeo** - Venue premiado
- **🎡🏆 Rueda con trofeo** - Feria premiada
- **🎢🏆 Montaña rusa con trofeo** - Aventura premiada
- **🎠🏆 Caballito con trofeo** - Nostalgia premiada
- **🎣🏆 Caña con trofeo** - Paciencia premiada

## 🛠️ Cómo Configurar Iconos en Sanity

### 1. Acceder al CMS
1. Ve a tu panel de Sanity
2. Selecciona la banda que quieres editar
3. Navega a la sección "Timeline Section"

### 2. Configurar un Evento
1. Haz clic en "Agregar evento" o edita un evento existente
2. Completa los campos básicos:
   - **Nombre del evento**
   - **Fecha**
   - **Descripción** (opcional)
   - **Importancia** (principal, secundario, tercero)
   - **Imagen** (opcional)
   - **Enlace** (opcional)

### 3. Seleccionar el Icono
1. En el campo **"Icono del Evento"**, verás un menú desplegable
2. El campo es **obligatorio** - debes seleccionar un icono
3. Los iconos están organizados por categorías:
   - Iconos de música (🎤, 💿, 🎵, etc.)
   - Iconos de eventos (📅, ⭐, 🏆, etc.)
   - Combinaciones especiales (🎤🎵, 💿🎵, etc.)
   - Combinaciones con premios (🎤🏆, 💿🏆, etc.)

### 4. Guardar y Ver
1. Haz clic en "Publicar" para guardar los cambios
2. Ve a tu sitio web para ver el icono aplicado
3. El icono aparecerá en el círculo del evento en la línea de tiempo

## 🔄 Comportamiento del Sistema

### Prioridad de Iconos
1. **Icono configurado en Sanity** (máxima prioridad)
2. **Lógica automática basada en el nombre** (fallback)
3. **Icono por importancia** (fallback final)

### Lógica Automática (Fallback)
Si no se configura un icono en Sanity, el sistema automáticamente selecciona un icono basado en:
- **Palabras clave en el nombre** del evento
- **Importancia** del evento

### Ejemplos de Lógica Automática
- "Concierto en el Teatro" → 🎤
- "Lanzamiento del Álbum" → 💿
- "Nuevo Single" → 🎵
- "Video Musical" → 🎬
- "Premio Grammy" → 🏆
- "Formación de la Banda" → 🎸
- "Tour Internacional" → 🚌

## 💡 Consejos de Uso

### Para Conciertos y Shows
- **🎤** - Shows en vivo generales
- **🎤🎵** - Shows con música en vivo
- **🎤🏆** - Shows premiados
- **🎭** - Shows teatrales
- **🎪** - Festivales

### Para Lanzamientos Musicales
- **💿** - Álbumes completos
- **💿🎵** - Álbumes con canciones
- **💿🏆** - Álbumes premiados
- **🎵** - Singles, canciones
- **🎵🏆** - Canciones premiadas

### Para Videos y Multimedia
- **🎬** - Videos musicales
- **🎬🏆** - Videos premiados
- **📺** - Apariciones en TV
- **📱** - Contenido digital
- **💻** - Contenido online

### Para Premios y Reconocimientos
- **🏆** - Premios generales
- **🏆⭐** - Premios principales
- **⭐** - Eventos importantes
- **🎯** - Eventos secundarios

### Para Colaboraciones
- **🤝** - Colaboraciones generales
- **🤝🎵** - Colaboraciones musicales
- **🎺🎷** - Colaboraciones de jazz
- **🎻🎼** - Colaboraciones orquestales

## 🔧 Personalización Avanzada

### Agregar Nuevos Iconos
Para agregar nuevos iconos al sistema:

1. **Editar el Schema** (`schemaTypes/banda.ts`)
2. **Agregar nuevas opciones** en el array `list`
3. **Formato**: `{ title: '🎵 Descripción', value: '🎵' }`

### Ejemplo de Nuevo Icono
```typescript
{ title: '🎼🎹 Piano con partitura (Composición)', value: '🎼🎹' }
```

### Validación
- El campo de icono es **obligatorio**
- Debe seleccionarse un icono válido
- No se puede dejar vacío

## 🎨 Consideraciones de Diseño

### Tamaño de Iconos
- Los iconos se muestran en círculos responsivos
- Tamaño: `clamp(40px, 5vw, 80px)` según importancia
- Escalado automático en diferentes pantallas

### Colores
- Los iconos heredan el color del texto del círculo
- Se adaptan automáticamente al tema de colores
- Mantienen contraste y legibilidad

### Accesibilidad
- Los iconos son decorativos
- La información principal está en el texto
- Compatible con lectores de pantalla

## 🚀 Beneficios

### Para el Usuario Final
- **Personalización completa** de la apariencia
- **Iconos contextuales** que representan el contenido
- **Experiencia visual mejorada**
- **Fácil identificación** de tipos de eventos

### Para el Administrador
- **Control total** sobre la presentación
- **Flexibilidad** en la selección de iconos
- **Consistencia visual** en toda la línea de tiempo
- **Fácil mantenimiento** desde el CMS

### Para el Desarrollador
- **Sistema robusto** con fallbacks
- **Código limpio** y mantenible
- **Escalabilidad** para futuras mejoras
- **Compatibilidad** con el sistema existente

## 📝 Notas Técnicas

### Estructura de Datos
```typescript
{
  name: 'icon',
  title: 'Icono del Evento',
  type: 'string',
  options: {
    list: [
      { title: '🎤 Micrófono (Concierto/Show)', value: '🎤' },
      // ... más opciones
    ]
  },
  validation: Rule => Rule.required()
}
```

### Función de Renderizado
```javascript
const getEventIcon = (event, importance) => {
  // Prioridad 1: Icono configurado en Sanity
  if (event?.icon) {
    return event.icon
  }
  
  // Prioridad 2: Lógica automática
  // ... lógica basada en nombre
  
  // Prioridad 3: Icono por importancia
  // ... lógica basada en importancia
}
```

### Compatibilidad
- ✅ Funciona con eventos existentes
- ✅ Mantiene compatibilidad hacia atrás
- ✅ No rompe funcionalidades existentes
- ✅ Sistema de fallbacks robusto

---

**¡Con esta nueva funcionalidad, tu línea de tiempo será más visual y atractiva que nunca!** 🎉 
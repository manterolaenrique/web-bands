# 🕐 Guía de la Sección Línea de Tiempo

## 📋 Descripción

La nueva sección "Línea de Tiempo" es una funcionalidad que permite mostrar cronológicamente los hitos importantes de la banda. Se ubica entre las secciones "Quiénes Somos" y "Escúchanos", y se accede mediante el botón "Conocé más sobre nosotros" en la sección About.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

1. **Línea de tiempo horizontal** con eventos distribuidos equilibradamente
2. **Responsive design** (mobile first) que se adapta a diferentes pantallas
3. **Sistema de importancia visual** con tres niveles:
   - **Principal**: Círculo más grande, colores más destacados
   - **Secundario**: Tamaño medio, colores intermedios
   - **Tercero**: Tamaño menor, colores más suaves
4. **Hover interactivo** con descripción y/o imagen del evento
5. **Smooth scroll** desde el botón "Conocé más sobre nosotros"
6. **Configuración completa desde Sanity CMS**

## 🏗️ Arquitectura Técnica

### 📁 Archivos Modificados/Creados

1. **`schemaTypes/banda.ts`** - Esquema de Sanity actualizado
2. **`frontend/src/components/TimelineSection.jsx`** - Nuevo componente React
3. **`frontend/src/components/About.jsx`** - Botón con smooth scroll
4. **`frontend/src/components/BandaPage.jsx`** - Integración de la nueva sección
5. **`frontend/src/sanityClient.js`** - Consulta actualizada

### 🎨 Estructura del Componente

```jsx
<TimelineSection 
  timelineSection={banda.timelineSection} 
  colores={banda.colores} 
/>
```

## 📊 Esquema de Sanity

### Estructura de Datos

```typescript
timelineSection: {
  enabled: boolean,           // Activar/desactivar sección
  titulo: string,            // Título de la sección
  descripcion: string,       // Descripción opcional
  events: [                  // Array de eventos
    {
      name: string,          // Nombre del evento
      date: datetime,        // Fecha (se muestra solo el año)
      importance: "principal" | "secundario" | "tercero",
      image: image?,         // Imagen opcional para hover
      descripcion: string    // Descripción opcional
    }
  ]
}
```

### Configuración en Sanity Studio

1. **Ir a la banda** en Sanity Studio
2. **Buscar "Sección Línea de Tiempo"**
3. **Habilitar la sección** marcando "Habilitar Línea de Tiempo"
4. **Configurar título y descripción** (opcional)
5. **Agregar eventos**:
   - **Nombre**: Ej. "Inicio de la banda", "Primer concierto"
   - **Fecha**: Se mostrará solo el año
   - **Importancia**: Principal, Secundario o Tercero
   - **Imagen**: Opcional, se muestra en hover
   - **Descripción**: Opcional, se muestra en hover

## 🎨 Estilos Visuales

### Responsive Design

- **Desktop**: Línea horizontal con eventos distribuidos
- **Mobile**: Línea vertical centrada con eventos apilados

### Sistema de Importancia

| Importancia | Tamaño Círculo | Color | Tamaño Texto |
|-------------|----------------|-------|--------------|
| Principal   | 80px          | Primario | 1.2rem (Bold) |
| Secundario  | 60px          | Secundario | 1rem (Semi-bold) |
| Tercero     | 50px          | Secundario Claro | 0.9rem (Medium) |

### Efectos Visuales

- **Hover**: Escalado del círculo (1.1x)
- **Transiciones**: Suaves (0.3s ease)
- **Sombras**: Efectos de profundidad
- **Modal de imagen**: Centrado en pantalla

## 🚀 Uso y Configuración

### 1. Configurar en Sanity

```bash
# Acceder a Sanity Studio
npm run dev

# Ir a http://localhost:3333
# Seleccionar la banda
# Configurar "Sección Línea de Tiempo"
```

### 2. Ejemplo de Configuración

```json
{
  "enabled": true,
  "titulo": "Nuestra Historia",
  "descripcion": "Los momentos más importantes de nuestra trayectoria musical",
  "events": [
    {
      "name": "Formación de la Banda",
      "date": "2018-03-15T00:00:00.000Z",
      "importance": "principal",
      "descripcion": "El día que todo comenzó"
    },
    {
      "name": "Primer Concierto",
      "date": "2018-06-20T00:00:00.000Z",
      "importance": "secundario",
      "image": "imagen_del_concierto",
      "descripcion": "Nuestro debut en vivo"
    },
    {
      "name": "Primer EP",
      "date": "2019-01-10T00:00:00.000Z",
      "importance": "principal",
      "descripcion": "Lanzamiento de nuestro primer trabajo"
    }
  ]
}
```

### 3. Navegación

- **Desde About**: Botón "Conocé más sobre nosotros" con smooth scroll
- **Directa**: Scroll manual hasta la sección
- **URL**: `#timeline` (sección con ID)

## 🔧 Personalización

### Modificar Estilos

Los estilos están en `TimelineSection.jsx` usando inline styles para mantener coherencia con el proyecto:

```jsx
// Ejemplo de personalización de colores
const getEventStyles = (importance) => {
  switch (importance) {
    case 'principal':
      return {
        circleSize: '80px',
        color: colores?.primario || '#333',
        // ... más estilos
      }
  }
}
```

### Agregar Iconos Personalizados

Actualmente usa números (1, 2, 3...), pero puedes personalizar:

```jsx
// En el componente TimelineSection.jsx
<div className="event-icon">
  {/* Reemplazar {index + 1} con iconos personalizados */}
  {getEventIcon(event.type)} // Implementar función getEventIcon
</div>
```

## 📱 Responsive Behavior

### Desktop (>768px)
- Grid horizontal con eventos distribuidos
- Línea central horizontal
- Contenido alternado arriba/abajo

### Mobile (≤768px)
- Grid vertical (1 columna)
- Línea central vertical
- Contenido siempre arriba del círculo

## 🎯 Casos de Uso

### Banda Nueva
- Formación
- Primer ensayo
- Primer concierto
- Primer EP/álbum

### Banda Establecida
- Formación original
- Cambios de integrantes
- Lanzamientos importantes
- Giras destacadas
- Premios/recognition

### Banda Legendaria
- Historia completa
- Momentos icónicos
- Evolución musical
- Logros históricos

## 🔍 Troubleshooting

### La sección no aparece
1. Verificar que `enabled: true` en Sanity
2. Verificar que hay al menos un evento
3. Revisar la consulta en `sanityClient.js`

### Estilos no se aplican
1. Verificar que `colores` se pasa correctamente
2. Revisar `getSecondaryColors` en `colorUtils.js`
3. Verificar que no hay conflictos CSS

### Hover no funciona
1. Verificar que las imágenes están en Sanity
2. Revisar `getGalleryImageUrl` en `sanityImage.js`
3. Verificar que no hay errores en consola

## 📈 Próximas Mejoras

### Funcionalidades Futuras
- [ ] Animaciones de entrada (fade-in, slide-in)
- [ ] Filtros por tipo de evento
- [ ] Galería de imágenes por evento
- [ ] Integración con redes sociales
- [ ] Timeline interactivo con zoom
- [ ] Exportar timeline como PDF

### Optimizaciones
- [ ] Lazy loading de imágenes
- [ ] Memoización de componentes
- [ ] Optimización de consultas Sanity
- [ ] PWA support

## 📚 Recursos Adicionales

- [Documentación de Sanity](https://www.sanity.io/docs)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Smooth Scroll](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)

---

**Desarrollado para el proyecto Web Bands** 🎸 
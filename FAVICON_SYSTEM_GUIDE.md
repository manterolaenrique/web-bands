# 🎵 Guía: Sistema de Favicons Dinámicos

Esta guía explica cómo funciona el sistema de favicons dinámicos que cambia automáticamente según la banda que se esté visitando.

## 🎯 **Sistema de Favicons Implementado**

### **Favicons por Página:**

#### **1. Página de Lista de Bandas**
- **Favicon**: `favicon.svg` (icono musical por defecto)
- **Cuándo**: Al cargar la página principal con todas las bandas
- **Diseño**: Nota musical en círculo azul

#### **2. Página Individual de Banda**
- **Favicon**: Logo de la banda (redimensionado a 32x32px)
- **Cuándo**: Al cargar una página específica de banda
- **Fallback**: Si no hay logo o falla la carga, usa el favicon por defecto

#### **3. Páginas de Error**
- **Favicon**: `favicon.svg` (icono musical por defecto)
- **Cuándo**: En caso de error al cargar la banda

## 🔧 **Funciones Utilitarias**

### **faviconUtils.js**

#### **updateFavicon(logoRef)**
```javascript
// Actualiza el favicon con el logo de la banda
await updateFavicon('image-abc123-200x200-png')
```

#### **getFaviconUrl(logoRef)**
```javascript
// Genera la URL del favicon desde el logo de Sanity
const url = getFaviconUrl('image-abc123-200x200-png')
// Resultado: https://cdn.sanity.io/images/project/dataset/abc123.jpg?w=32&h=32&fit=crop&crop=center
```

#### **resetToDefaultFavicon()**
```javascript
// Resetea al favicon por defecto
resetToDefaultFavicon()
```

#### **checkFaviconLoaded(url)**
```javascript
// Verifica si una imagen se puede cargar
const isLoaded = await checkFaviconLoaded('https://...')
```

## 📊 **Implementación en Componentes**

### **BandaPage.jsx**
```javascript
import { updateFavicon, resetToDefaultFavicon } from '../utils/faviconUtils'

// Al cargar banda exitosamente
if (data.logo) {
  updateFavicon(data.logo.asset._ref).catch(() => {
    resetToDefaultFavicon()
  })
} else {
  resetToDefaultFavicon()
}

// En caso de error
resetToDefaultFavicon()
```

### **BandasList.jsx**
```javascript
import { resetToDefaultFavicon } from '../utils/faviconUtils'

// Al cargar lista de bandas
resetToDefaultFavicon()
```

## 🎨 **Favicon por Defecto**

### **Diseño del favicon.svg**
- **Tamaño**: 32x32 píxeles
- **Fondo**: Círculo azul (#4A90E2) con borde oscuro
- **Elemento**: Nota musical blanca
- **Decoración**: Pequeños puntos blancos

### **Ubicación**
```
frontend/public/favicon.svg
```

## 🔄 **Proceso de Actualización**

### **1. Carga de Banda**
```javascript
// 1. Se obtiene el logo de Sanity
const logoRef = data.logo.asset._ref

// 2. Se genera la URL del favicon
const faviconUrl = getFaviconUrl(logoRef)

// 3. Se verifica que la imagen se pueda cargar
const isLoaded = await checkFaviconLoaded(faviconUrl)

// 4. Se actualiza el elemento <link> en el DOM
if (isLoaded) {
  favicon.href = faviconUrl
  favicon.type = 'image/png'
} else {
  resetToDefaultFavicon()
}
```

### **2. Manejo de Errores**
- **Logo no disponible**: Usa favicon por defecto
- **Error de carga**: Usa favicon por defecto
- **Formato no soportado**: Usa favicon por defecto

## 🎵 **Optimización de Imágenes**

### **Parámetros de Sanity**
```javascript
// URL generada automáticamente
?w=32&h=32&fit=crop&crop=center
```

### **Explicación de Parámetros**
- **w=32**: Ancho de 32 píxeles
- **h=32**: Alto de 32 píxeles
- **fit=crop**: Recortar para ajustar
- **crop=center**: Recortar desde el centro

## 🚀 **Beneficios del Sistema**

### ✅ **Identificación Visual**
- **Pestañas únicas**: Cada banda tiene su propio icono
- **Navegación clara**: Fácil identificar qué banda está abierta
- **Historial visual**: Favicons en el historial del navegador

### ✅ **Experiencia de Usuario**
- **Personalización**: Cada banda se identifica con su logo
- **Profesionalismo**: Apariencia más pulida y personalizada
- **Consistencia**: Mismo comportamiento en todas las bandas

### ✅ **SEO y Marcado**
- **Favicon único**: Mejora la identificación en marcadores
- **Branding**: Refuerza la identidad de cada banda
- **Profesional**: Aspecto más profesional en el navegador

## 🔍 **Casos de Uso**

### **Caso 1: Banda con Logo**
```yaml
# En Sanity CMS
Logo: "image-abc123-200x200-png"

# Resultado
Favicon: Logo de la banda redimensionado a 32x32
```

### **Caso 2: Banda sin Logo**
```yaml
# En Sanity CMS
Logo: (vacío)

# Resultado
Favicon: favicon.svg (nota musical)
```

### **Caso 3: Error de Carga**
```yaml
# Si falla la carga del logo
Favicon: favicon.svg (nota musical)
```

### **Caso 4: Lista de Bandas**
```yaml
# Página principal
Favicon: favicon.svg (nota musical)
```

## 🎯 **Configuración en Sanity**

### **Requisitos del Logo**
- **Formato**: PNG, JPG, WebP
- **Tamaño mínimo**: 32x32 píxeles
- **Fondo**: Preferiblemente transparente
- **Calidad**: Buena resolución para redimensionar

### **Recomendaciones**
- **Logo cuadrado**: Mejor resultado al redimensionar
- **Fondo transparente**: Se ve mejor en diferentes fondos
- **Alta resolución**: Mínimo 200x200 píxeles
- **Contraste**: Asegurar que se vea bien en tamaño pequeño

## 🔧 **Funciones Disponibles**

### **Para Desarrolladores**
```javascript
// Importar utilidades
import { 
  updateFavicon, 
  getFaviconUrl, 
  resetToDefaultFavicon,
  checkFaviconLoaded 
} from '../utils/faviconUtils'

// Usar en componentes
useEffect(() => {
  if (banda.logo) {
    updateFavicon(banda.logo.asset._ref)
  } else {
    resetToDefaultFavicon()
  }
}, [banda])
```

## 🎨 **Personalización del Favicon por Defecto**

### **Modificar favicon.svg**
```svg
<!-- Cambiar colores -->
<circle cx="16" cy="16" r="15" fill="#TU_COLOR" stroke="#TU_BORDE" stroke-width="2"/>

<!-- Cambiar diseño -->
<!-- Agregar más elementos SVG -->
```

### **Crear Nuevo Favicon**
1. Crear archivo SVG de 32x32 píxeles
2. Colocar en `frontend/public/`
3. Actualizar `index.html` y `resetToDefaultFavicon()`

¡El sistema de favicons dinámicos hace que cada banda tenga su propia identidad visual en el navegador! 🎵✨ 
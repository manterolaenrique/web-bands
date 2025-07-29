# 🏷️ Guía: Sistema de Títulos Dinámicos

Esta guía explica cómo funciona el sistema de títulos dinámicos que cambia automáticamente según la página y la banda.

## 🎯 **Sistema de Títulos Implementado**

### **Títulos por Página:**

#### **1. Página de Lista de Bandas**
- **Título**: `"Bandas Musicales - Descubre Nuevos Talentos"`
- **Cuándo**: Al cargar la página principal con todas las bandas
- **Error**: `"Error - Bandas Musicales"`

#### **2. Página Individual de Banda**
- **Título**: `"Nombre de la Banda"` o `"Nombre de la Banda - Género"`
- **Cuándo**: Al cargar una página específica de banda
- **Error**: `"Error - Banda Musical"` o `"Banda no encontrada"`

#### **3. Título por Defecto**
- **Título**: `"Bandas Musicales"`
- **Cuándo**: Al cargar la aplicación inicialmente

## 🔧 **Funciones Utilitarias**

### **titleUtils.js**

#### **updatePageTitle(title, fallback)**
```javascript
// Actualiza el título de la pestaña
updatePageTitle('Mi Banda', 'Banda Musical')
```

#### **createBandaTitle(nombre, genero)**
```javascript
// Crea título para página de banda
createBandaTitle('Los Rockeros', 'Rock') // "Los Rockeros - Rock"
createBandaTitle('Los Rockeros') // "Los Rockeros"
```

#### **createBandasListTitle()**
```javascript
// Crea título para lista de bandas
createBandasListTitle() // "Bandas Musicales - Descubre Nuevos Talentos"
```

#### **createErrorTitle(context)**
```javascript
// Crea título para páginas de error
createErrorTitle('Banda Musical') // "Error - Banda Musical"
```

## 📊 **Implementación en Componentes**

### **BandaPage.jsx**
```javascript
import { createBandaTitle, createErrorTitle } from '../utils/titleUtils'

// Al cargar banda exitosamente
document.title = createBandaTitle(data.nombre, data.genero)

// En caso de error
document.title = createErrorTitle('Banda Musical')
```

### **BandasList.jsx**
```javascript
import { createBandasListTitle, createErrorTitle } from '../utils/titleUtils'

// Al cargar lista exitosamente
document.title = createBandasListTitle()

// En caso de error
document.title = createErrorTitle('Bandas Musicales')
```

## 🎵 **Nuevo Campo: Género Musical**

### **Agregado al Esquema de Sanity**
```typescript
{
  name: 'genero',
  title: 'Género Musical',
  type: 'string',
  description: 'Género principal de la banda (ej: Rock, Pop, Jazz, etc.)',
}
```

### **Incluido en Query de Sanity**
```javascript
const query = `*[_type == "banda" && slug.current == $slug][0]{
  _id,
  nombre,
  slug,
  logo,
  colores,
  genero,  // ← Nuevo campo
  hero{...},
  // ...
}`
```

## 🎨 **Ejemplos de Títulos**

### **Bandas con Género Configurado**
```
"Los Rockeros - Rock"
"Jazz Fusion - Jazz"
"Pop Stars - Pop"
"Metal Masters - Heavy Metal"
```

### **Bandas sin Género**
```
"Los Rockeros"
"Jazz Fusion"
"Pop Stars"
```

### **Páginas de Error**
```
"Error - Banda Musical"
"Error - Bandas Musicales"
"Banda no encontrada"
```

## 🚀 **Beneficios del Sistema**

### ✅ **SEO Mejorado**
- **Títulos únicos**: Cada banda tiene su propio título
- **Palabras clave**: Incluye género musical
- **Descripción clara**: Usuario sabe qué página está viendo

### ✅ **Experiencia de Usuario**
- **Navegación clara**: Título indica la página actual
- **Historial organizado**: Fácil identificar páginas visitadas
- **Pestañas identificables**: Múltiples pestañas fáciles de distinguir

### ✅ **Mantenimiento**
- **Código organizado**: Funciones utilitarias reutilizables
- **Consistencia**: Mismo formato en toda la aplicación
- **Flexibilidad**: Fácil agregar nuevos tipos de títulos

## 🔍 **Casos de Uso**

### **Caso 1: Banda con Género**
```yaml
# En Sanity CMS
Nombre: "Los Rockeros"
Género: "Rock"

# Resultado en pestaña
"Los Rockeros - Rock"
```

### **Caso 2: Banda sin Género**
```yaml
# En Sanity CMS
Nombre: "Los Rockeros"
Género: (vacío)

# Resultado en pestaña
"Los Rockeros"
```

### **Caso 3: Error de Carga**
```yaml
# Si falla la carga
"Error - Banda Musical"
```

### **Caso 4: Lista de Bandas**
```yaml
# Página principal
"Bandas Musicales - Descubre Nuevos Talentos"
```

## 🎯 **Configuración en Sanity**

### **Paso 1: Actualizar Sanity Studio**
1. Reiniciar Sanity Studio para ver el nuevo campo
2. Ir a la configuración de una banda
3. Agregar el género musical en el campo correspondiente

### **Paso 2: Ejemplos de Géneros**
```
Rock
Pop
Jazz
Blues
Country
Electronic
Hip Hop
Reggae
Folk
Classical
Heavy Metal
Punk
Indie
Alternative
```

## 🔧 **Funciones Disponibles**

### **Para Desarrolladores**
```javascript
// Importar utilidades
import { 
  updatePageTitle, 
  createBandaTitle, 
  createBandasListTitle,
  createErrorTitle,
  resetToDefaultTitle 
} from '../utils/titleUtils'

// Usar en componentes
useEffect(() => {
  document.title = createBandaTitle(banda.nombre, banda.genero)
}, [banda])
```

¡El sistema de títulos dinámicos mejora significativamente la experiencia de usuario y el SEO! 🎵✨ 
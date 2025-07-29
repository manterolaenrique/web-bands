# 🔧 Solución de Problemas: Favicon Dinámico

Esta guía te ayudará a diagnosticar y solucionar problemas con el sistema de favicons dinámicos.

## 🚨 **Problema: No se ven los cambios en el favicon**

### **Síntomas:**
- El favicon no cambia al navegar entre bandas
- Se mantiene el favicon anterior o por defecto
- No aparecen logs en la consola del navegador

## 🔍 **Pasos de Diagnóstico**

### **1. Verificar Logs en Consola**
1. Abrir las herramientas de desarrollador (F12)
2. Ir a la pestaña "Console"
3. Buscar mensajes que empiecen con:
   - 🔄 `Intentando actualizar favicon`
   - ✅ `Favicon actualizado exitosamente`
   - ❌ `Error al actualizar favicon`

### **2. Verificar que el Servidor esté Funcionando**
```bash
# Verificar que el servidor esté corriendo
npm run dev

# Verificar que el favicon por defecto sea accesible
curl http://localhost:5173/favicon.svg
```

### **3. Verificar Configuración de Sanity**
1. Ir a Sanity Studio
2. Verificar que la banda tenga un logo configurado
3. Verificar que el logo sea accesible

## 🛠️ **Soluciones Comunes**

### **Solución 1: Limpiar Cache del Navegador**
1. **Chrome/Edge**: Ctrl + Shift + R (Hard Refresh)
2. **Firefox**: Ctrl + F5
3. **Safari**: Cmd + Option + R

### **Solución 2: Limpiar Cache Completo**
1. Abrir herramientas de desarrollador (F12)
2. Click derecho en el botón de refresh
3. Seleccionar "Empty Cache and Hard Reload"

### **Solución 3: Verificar Variables de Entorno**
```javascript
// Verificar en la consola del navegador
console.log('VITE_SANITY_PROJECT_ID:', import.meta.env.VITE_SANITY_PROJECT_ID)
console.log('VITE_SANITY_DATASET:', import.meta.env.VITE_SANITY_DATASET)
```

### **Solución 4: Probar Favicon Manualmente**
1. Ir a una página de banda
2. Buscar el botón "🧪 Probar Favicon" (esquina superior derecha)
3. Hacer click para forzar la actualización

## 🔧 **Verificaciones Técnicas**

### **1. Verificar Estructura del Logo en Sanity**
```javascript
// En la consola del navegador, verificar:
console.log('Logo data:', banda.logo)
console.log('Logo ref:', banda.logo?.asset?._ref)
```

### **2. Verificar URL Generada**
```javascript
// La URL debería verse así:
// https://cdn.sanity.io/images/PROJECT_ID/DATASET/IMAGE_ID?w=32&h=32&fit=crop&crop=center
```

### **3. Verificar Elementos del DOM**
```javascript
// En la consola del navegador:
document.querySelectorAll('link[rel="icon"]')
```

## 🎯 **Casos Específicos**

### **Caso 1: Favicon no cambia en Chrome**
- **Causa**: Chrome cachea agresivamente los favicons
- **Solución**: 
  1. Hard refresh (Ctrl + Shift + R)
  2. Limpiar cache completo
  3. Cerrar y abrir la pestaña

### **Caso 2: Favicon no cambia en Firefox**
- **Causa**: Firefox puede tener problemas con favicons dinámicos
- **Solución**:
  1. Verificar que no haya bloqueadores de contenido
  2. Deshabilitar extensiones temporalmente

### **Caso 3: Favicon no cambia en Safari**
- **Causa**: Safari tiene políticas estrictas de cache
- **Solución**:
  1. Deshabilitar cache en herramientas de desarrollador
  2. Hard refresh (Cmd + Option + R)

### **Caso 4: No hay logs en consola**
- **Causa**: El código no se está ejecutando
- **Solución**:
  1. Verificar que el servidor esté corriendo
  2. Verificar que no haya errores de JavaScript
  3. Recargar la página

## 🧪 **Pruebas de Diagnóstico**

### **Prueba 1: Favicon por Defecto**
```javascript
// En la consola del navegador:
import { resetToDefaultFavicon } from './src/utils/faviconUtils.js'
resetToDefaultFavicon()
```

### **Prueba 2: Favicon de Banda**
```javascript
// En la consola del navegador (desde una página de banda):
import { updateFavicon } from './src/utils/faviconUtils.js'
updateFavicon(banda.logo.asset._ref)
```

### **Prueba 3: Verificar URL de Sanity**
```javascript
// En la consola del navegador:
const url = `https://cdn.sanity.io/images/${import.meta.env.VITE_SANITY_PROJECT_ID}/${import.meta.env.VITE_SANITY_DATASET}/IMAGE_ID?w=32&h=32&fit=crop&crop=center`
console.log('URL de prueba:', url)
```

## 📋 **Checklist de Verificación**

### **Antes de Reportar un Problema:**
- [ ] ¿El servidor está corriendo?
- [ ] ¿Hay errores en la consola del navegador?
- [ ] ¿Los logs de favicon aparecen en la consola?
- [ ] ¿El logo está configurado en Sanity?
- [ ] ¿Se probó con hard refresh?
- [ ] ¿Se probó en diferentes navegadores?
- [ ] ¿Se probó el botón "🧪 Probar Favicon"?

### **Información para Reportar:**
1. **Navegador y versión**
2. **Sistema operativo**
3. **Logs de la consola**
4. **URL de la página**
5. **Configuración de Sanity**
6. **Pasos para reproducir**

## 🎵 **Solución Rápida**

Si nada funciona, puedes forzar la actualización manualmente:

1. **Abrir consola del navegador** (F12)
2. **Ejecutar**:
```javascript
// Remover favicons existentes
document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(f => f.remove())

// Crear nuevo favicon
const favicon = document.createElement('link')
favicon.rel = 'icon'
favicon.href = '/favicon.svg'
document.head.appendChild(favicon)
```

¡Con estos pasos deberías poder diagnosticar y solucionar cualquier problema con el favicon! 🔧✨ 
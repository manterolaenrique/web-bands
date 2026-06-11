# Refactorización CSS del TimelineSection

## Problema Identificado
El componente `TimelineSection` tenía todos los estilos CSS embebidos dentro del JSX usando `<style jsx>`, lo cual es una mala práctica porque:
- Dificulta el mantenimiento
- No permite reutilización de estilos
- Aumenta el tamaño del bundle
- No sigue las mejores prácticas de separación de responsabilidades

## Solución Implementada

### 1. Extracción de Estilos CSS
- **Antes**: Todos los estilos estaban en `<style jsx>` dentro del componente
- **Después**: Todos los estilos se movieron al archivo CSS global `frontend/src/index.css`

### 2. Sistema de Colores Dinámicos
Se implementó un sistema de variables CSS personalizadas para mantener la funcionalidad de colores dinámicos:

```jsx
// En el componente
style={{ 
  backgroundColor: secondaryColors.dark,
  '--timeline-primary-color': colores?.primario || 'var(--color-primary)',
  '--timeline-secondary-color': secondaryColors.main || 'var(--color-secondary)'
}}
```

```css
/* En el CSS global */
.timeline__title--dynamic {
  color: var(--timeline-primary-color, var(--color-primary));
}

.timeline__underline--dynamic {
  background-color: var(--timeline-secondary-color, var(--color-secondary));
}
```

### 3. Clases CSS Modulares
Se crearon clases específicas para cada elemento con sufijos `--dynamic` para los colores personalizables:

- `.timeline__title--dynamic`
- `.timeline__underline--dynamic`
- `.timeline__event-year--dynamic`
- `.timeline__event-link--dynamic`
- `.timeline__indicator--dynamic`

## Estructura de Archivos

### Archivos Modificados

1. **`frontend/src/components/TimelineSection.jsx`**
   - Removido todo el bloque `<style jsx>`
   - Agregadas variables CSS personalizadas
   - Actualizadas clases CSS para usar el sistema dinámico

2. **`frontend/src/index.css`**
   - Agregada sección completa de estilos para TimelineSection
   - Agregadas variables CSS para colores semánticos (verde, rojo)
   - Implementado sistema de clases dinámicas

### Nuevas Variables CSS

```css
/* Colores semánticos agregados */
--color-green-300: #86efac;
--color-green-400: #4ade80;
--color-green-500: #22c55e;
--color-red-300: #fca5a5;
--color-red-400: #f87171;
--color-red-500: #ef4444;
```

## Beneficios de la Refactorización

### 1. Mantenibilidad
- ✅ Estilos centralizados en un solo archivo
- ✅ Fácil de encontrar y modificar
- ✅ Separación clara de responsabilidades

### 2. Performance
- ✅ CSS se carga una sola vez
- ✅ No hay duplicación de estilos
- ✅ Mejor caching del navegador

### 3. Reutilización
- ✅ Las clases CSS pueden ser reutilizadas
- ✅ Sistema de variables CSS escalable
- ✅ Consistencia en toda la aplicación

### 4. Debugging
- ✅ Más fácil de inspeccionar en las herramientas de desarrollador
- ✅ Mejor organización del código
- ✅ Estilos más predecibles

## Estructura CSS Final

```css
/* ===== ESTILOS PARA TIMELINE SECTION ===== */

/* Clases base */
.timeline { /* ... */ }
.timeline__header { /* ... */ }
.timeline__title { /* ... */ }

/* Clases dinámicas para colores */
.timeline__title--dynamic { /* ... */ }
.timeline__underline--dynamic { /* ... */ }
.timeline__event-year--dynamic { /* ... */ }

/* Estados y variantes */
.timeline__event--hovered { /* ... */ }
.timeline__event--active { /* ... */ }
.timeline__event-link-container--error { /* ... */ }

/* Responsive */
@media (max-width: 768px) { /* ... */ }
@media (max-width: 480px) { /* ... */ }
@media (min-width: 1024px) { /* ... */ }

/* Accesibilidad */
.timeline__event:focus-visible { /* ... */ }
@media (prefers-reduced-motion: reduce) { /* ... */ }
```

## Compatibilidad

### ✅ Mantenida
- Todos los colores dinámicos funcionan igual
- Responsive design intacto
- Accesibilidad preservada
- Estados de error y hover funcionando

### 🔄 Mejorado
- Código más limpio y mantenible
- Mejor organización
- Performance optimizado
- Debugging más fácil

## Próximos Pasos

1. **Aplicar el mismo patrón** a otros componentes que tengan CSS embebido
2. **Crear un sistema de diseño** más robusto con más variables CSS
3. **Implementar CSS Modules** si se requiere mayor encapsulación
4. **Agregar documentación** para el sistema de colores dinámicos

## Notas Importantes

- Los cambios son **completamente compatibles** con la versión anterior
- No se requiere **ningún cambio** en el esquema de Sanity
- La funcionalidad de **links** sigue funcionando igual
- Los **colores dinámicos** se mantienen intactos
- El **responsive design** no se ve afectado 
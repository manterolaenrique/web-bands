# Stitch Prompt: Rediseño Visual de Setlists en WEB BANDS

## Proyecto base
- Proyecto Stitch: `WEB BANDS`
- Objetivo: mejorar visualmente la sección privada `Setlists` del dashboard sin cambiar la arquitectura funcional ya implementada.

## Estado real implementado hoy

### 1. Hub de Setlists
- Ruta principal: `dashboard/bands/[bandId]/setlists`
- Columna izquierda: biblioteca privada de temas.
- En esa zona hoy se pueden:
  - cargar temas nuevos a la biblioteca
  - buscar temas ya cargados
  - editar temas existentes
- Columna derecha: setlists por fecha.
- En esa zona hoy se pueden:
  - crear una setlist con datos base (`titulo`, `fecha`, `venue`, `ubicacion`, `logo`, `prefill desde shows`)
  - ver el listado de setlists creadas
  - abrir edición o duplicado

### 2. Builder de Setlist
- Se abre en un `sheet` desde el hub.
- Permite:
  - editar metadatos de cabecera
  - buscar temas de la biblioteca
  - agregarlos al setlist
  - ver el orden actual del show
  - reordenar con controles explícitos
  - editar cada item con popup / sheet secundario
  - agregar bloques como `Intro`, `Acústico`, `Bis`, `Final`
- CTA principal actual: `Guardar y ver vista previa`

### 3. Vista final
- Vista A4 preparada para `Imprimir / Guardar PDF`
- Funciona como preview final del setlist antes de imprimir.

## Problema visual actual
- La pantalla actual se siente desbalanceada.
- En desktop, la biblioteca de temas de la izquierda crece demasiado y domina toda la vista.
- La columna de la derecha queda demasiado vacía, estirada o perdida.
- El usuario no entiende con suficiente rapidez la jerarquía del flujo.
- El builder ya es funcional, pero todavía puede sentirse pesado visualmente.

## Objetivo del rediseño
- Mejorar composición, jerarquía y ritmo visual.
- Mantener por completo el ADN visual actual de WEB BANDS.
- No cambiar la lógica del producto ni inventar otra arquitectura.
- Hacer que `Setlists` se entienda rápido: que cargar temas, crear una fecha, armar el orden y editar detalles sea más claro y agradable.

## Lenguaje visual obligatorio
- Fondo negro / charcoal muy oscuro.
- Acentos neon en violeta y cyan.
- Look premium, técnico, nocturno, moderno.
- Bordes suaves, glass stroke, glow sutil.
- Títulos con presencia fuerte, consistentes con el dashboard actual.
- No convertir esto en una UI blanca genérica o dashboard SaaS estándar.
- Mantener continuidad con `Demos`, `Playlists`, `Centro de prensa` y el resto del dashboard.

## Referencias visuales a usar dentro del proyecto WEB BANDS
- `Panel de Administración`
- `Dashboard con Gestión de Playlists`
- `Dashboard Mobile`
- `Demos Home Mobile`
- `Playlists Privadas Mobile`

## Pedido para Stitch

### A. Rediseñar el hub de Setlists
- Desktop first con adaptación mobile.
- Mantener las dos zonas funcionales actuales:
  - `Biblioteca de temas`
  - `Setlists por fecha`
- La biblioteca debe seguir existiendo, pero no debe dominar visualmente toda la pantalla.
- La zona de setlists debe verse más útil, compacta y activa.
- Evitar bloques vacíos y columnas larguísimas.
- Diseñar mejor el formulario de crear setlist y el listado de setlists creados.
- Los setlists creados deben verse como tarjetas compactas, legibles y fáciles de escanear.

### B. Rediseñar el builder / sheet de armado
- Mantener el flujo ya existente.
- Debe quedar clarísima la separación entre:
  - buscar/agregar temas
  - ver orden actual
  - editar detalle puntual de item
- El orden actual debe verse como lista compacta, elegante y estable.
- Cada item debe verse resumido: `numero + tipo + nombre + boton editar`.
- No expandir cada item dentro de la lista principal.
- `Editar` debe seguir pasando por popup / sheet secundario.
- `Agregar bloque` debe ser secundario pero fácil de encontrar.
- El footer con `Guardar y ver vista previa` debe sentirse fuerte y claro.

### C. Mobile
- Mantener el mismo criterio visual.
- Layout apilado y sin caos.
- La jerarquía del flujo debe seguir siendo evidente.
- Sheets y popups deben sentirse nativos y cómodos.

## Entregables deseados
- 1 propuesta visual del hub de Setlists en desktop.
- 1 propuesta visual del builder / sheet de armado.
- 1 adaptación mobile coherente.
- Si aporta valor: incluir estado vacío, estado con muchos temas y estado con varios setlists creados.

## Restricciones
- No cambiar arquitectura funcional.
- No mover la biblioteca a otro producto.
- No rehacer la experiencia como si fuera otro sistema.
- Esto es una mejora visual / UX sobre una base funcional que ya existe.

## Corrida realizada en Stitch
- Proyecto validado: `WEB BANDS` (`projects/11704115754578325950`)
- Referencias visuales usadas desde el proyecto:
  - `Panel de Administración`
  - `Dashboard con Gestión de Playlists`
  - `Playlists Privadas Mobile`

### Pantallas generadas
- `Setlists Hub - Refined Grid`
  - `projects/11704115754578325950/screens/5e3d6a716b7548f6b4145c2f2c87714e`
- `Setlists Hub - Modular Workspace`
  - `projects/11704115754578325950/screens/c9812aea2bb448c7923ce52d9e4c4116`
- `Constructor de Setlists - Pro Workspace`
  - `projects/11704115754578325950/screens/9d149e04df44447daaf7231c0e30d0f9`
- `Hub de Setlists - Mobile Adaptation`
  - `projects/11704115754578325950/screens/8c4f2370f6a9472bb99577320f4066c0`

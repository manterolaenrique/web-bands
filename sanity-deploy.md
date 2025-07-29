# 🎨 Guía de Despliegue de Sanity Studio

## 📋 Pasos para Desplegar Sanity Studio

### 1. Verificar Configuración

Asegúrate de que tu `sanity.config.ts` esté configurado correctamente:

```typescript
import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Web Bands CMS',
  projectId: 'vyjsvcoh',
  dataset: 'production',
  plugins: [deskTool()],
  schema: {
    types: schemaTypes,
  },
})
```

### 2. Desplegar desde el Directorio Raíz

```bash
# Desde el directorio raíz del proyecto
npm run deploy
```

### 3. Desplegar Manualmente

```bash
# Si prefieres usar el CLI directamente
sanity deploy
```

### 4. Verificar el Despliegue

Una vez desplegado, tu Sanity Studio estará disponible en:
**https://bandas-web.sanity.studio**

### 5. Configurar CORS (si es necesario)

Si tienes problemas de CORS, ve a:
1. [manage.sanity.io](https://manage.sanity.io)
2. Selecciona tu proyecto
3. Ve a "API" → "CORS Origins"
4. Agrega tu dominio de Vercel

### 6. Variables de Entorno para Producción

Asegúrate de que tu frontend tenga estas variables:

```env
VITE_SANITY_PROJECT_ID=vyjsvcoh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_STUDIO_URL=https://bandas-web.sanity.studio
```

## 🔧 Troubleshooting

### Error: "Project not found"
- Verifica que el `projectId` en `sanity.config.ts` sea correcto
- Asegúrate de estar logueado en Sanity CLI

### Error: "Dataset not found"
- Verifica que el dataset `production` exista
- Crea el dataset si no existe: `sanity dataset create production`

### Error de CORS
- Agrega tu dominio de Vercel a los CORS origins en Sanity
- Verifica que las variables de entorno estén correctas

## 📚 Recursos Adicionales

- [Documentación de Sanity](https://www.sanity.io/docs)
- [Guía de Despliegue](https://www.sanity.io/docs/deployment)
- [Configuración de CORS](https://www.sanity.io/docs/cors) 
# 🚀 Guía de Deploy - Web Bands

Esta guía te ayudará a desplegar Web Bands en producción de manera profesional.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- npm 8+ instalado
- Cuenta en la plataforma de deploy (Vercel, Netlify, etc.)
- Proyecto de Sanity configurado

## 🔧 Configuración de Variables de Entorno

### 1. Variables de Desarrollo (env.development)
```bash
VITE_ENV=development
VITE_SANITY_PROJECT_ID=vyjsvcoh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_STUDIO_URL=http://localhost:3333
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Web Bands (Dev)
```

### 2. Variables de Producción (env.production)
```bash
VITE_ENV=production
VITE_SANITY_PROJECT_ID=vyjsvcoh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_STUDIO_URL=https://bandas-web.sanity.studio
VITE_APP_URL=https://tu-dominio.com
VITE_APP_NAME=Web Bands
```

## 🎯 Scripts Disponibles

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo
npm run build:dev    # Build para desarrollo
npm run preview      # Preview del build
```

### Producción
```bash
npm run build:prod   # Build optimizado para producción
npm run clean        # Limpiar build
npm run analyze      # Analizar bundle
```

### Deploy
```bash
npm run deploy:vercel    # Deploy a Vercel
npm run deploy:netlify   # Deploy a Netlify
./deploy.sh vercel       # Script completo para Vercel
./deploy.sh netlify      # Script completo para Netlify
```

## 🌐 Deploy en Vercel

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Configurar proyecto
```bash
cd frontend
vercel login
vercel
```

### 3. Configurar variables de entorno en Vercel
En el dashboard de Vercel, ve a Settings > Environment Variables:
```
VITE_ENV=production
VITE_SANITY_PROJECT_ID=vyjsvcoh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_STUDIO_URL=https://bandas-web.sanity.studio
VITE_APP_URL=https://tu-dominio.vercel.app
VITE_APP_NAME=Web Bands
```

### 4. Deploy
```bash
npm run deploy:vercel
# o
./deploy.sh vercel
```

## 🌐 Deploy en Netlify

### 1. Instalar Netlify CLI
```bash
npm i -g netlify-cli
```

### 2. Configurar proyecto
```bash
cd frontend
netlify login
netlify init
```

### 3. Configurar variables de entorno en Netlify
En el dashboard de Netlify, ve a Site settings > Environment variables:
```
VITE_ENV=production
VITE_SANITY_PROJECT_ID=vyjsvcoh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_STUDIO_URL=https://bandas-web.sanity.studio
VITE_APP_URL=https://tu-dominio.netlify.app
VITE_APP_NAME=Web Bands
```

### 4. Deploy
```bash
npm run deploy:netlify
# o
./deploy.sh netlify
```

## 🌐 Deploy en GitHub Pages

### 1. Configurar GitHub Actions
Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build:prod
      env:
        VITE_ENV: production
        VITE_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
        VITE_SANITY_DATASET: production
        VITE_SANITY_API_VERSION: 2024-01-01
        VITE_SANITY_STUDIO_URL: https://bandas-web.sanity.studio
        VITE_APP_URL: https://tu-usuario.github.io/tu-repo
        VITE_APP_NAME: Web Bands
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 2. Configurar secrets en GitHub
Ve a Settings > Secrets and variables > Actions:
- `SANITY_PROJECT_ID`: tu-project-id

### 3. Habilitar GitHub Pages
En Settings > Pages:
- Source: Deploy from a branch
- Branch: gh-pages
- Folder: / (root)

## 🔒 Configuración de Sanity para Producción

### 1. Configurar CORS
En el dashboard de Sanity, ve a API > CORS Origins:
```
https://tu-dominio.vercel.app
https://tu-dominio.netlify.app
https://tu-usuario.github.io
```

### 2. Verificar dataset público
En Datasets, asegúrate de que "production" esté en modo "Public".

### 3. Deploy Sanity Studio (opcional)
```bash
cd ..  # Volver al directorio raíz
npm run deploy
```

## 🧪 Testing del Deploy

### 1. Verificar build local
```bash
npm run build:prod
npm run preview
```

### 2. Verificar variables de entorno
```bash
# En la consola del navegador deberías ver:
[Web Bands] Iniciando carga de bandas...
[Web Bands] Bandas cargadas: X
```

### 3. Verificar funcionalidad
- ✅ Página principal carga
- ✅ Listado de bandas funciona
- ✅ Navegación a bandas individuales
- ✅ CMS de Sanity accesible

## 🐛 Troubleshooting

### Error 403 en Sanity
- Verificar CORS Origins
- Verificar que el dataset sea público
- Verificar Project ID

### Build falla
- Verificar Node.js 18+
- Limpiar cache: `npm run clean`
- Reinstalar dependencias: `rm -rf node_modules && npm install`

### Variables de entorno no funcionan
- Verificar que empiecen con `VITE_`
- Verificar que estén en el archivo correcto
- Reiniciar servidor de desarrollo

## 📊 Monitoreo

### Logs en desarrollo
Los logs aparecen en la consola del navegador con el formato:
```
[Web Bands] Mensaje de log
[Web Bands] Error: descripción del error
```

### Logs en producción
- Vercel: Dashboard > Functions > Logs
- Netlify: Dashboard > Functions > Logs
- GitHub: Actions > Workflow runs

## 🎉 ¡Listo!

Tu aplicación Web Bands está lista para producción con:
- ✅ Configuración profesional
- ✅ Variables de entorno
- ✅ Logging condicional
- ✅ Optimizaciones de build
- ✅ Scripts de deploy automatizados
- ✅ Documentación completa 
#!/bin/bash

# Script de deploy profesional para Web Bands
# Uso: ./deploy.sh [vercel|netlify|github]

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Asegúrate de estar en el directorio frontend/"
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js 18+ es requerido. Versión actual: $(node -v)"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
fi

log "🚀 Iniciando deploy de Web Bands..."

# Limpiar build anterior
log "🧹 Limpiando build anterior..."
rm -rf dist
rm -rf node_modules/.vite

# Instalar dependencias
log "📦 Instalando dependencias..."
npm ci --silent

# Verificar variables de entorno
log "🔍 Verificando configuración..."
if [ ! -f "env.production" ]; then
    warning "No se encontró env.production. Usando configuración por defecto."
fi

# Build para producción
log "🔨 Construyendo aplicación para producción..."
npm run build:prod

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    error "Build falló. No se generó el directorio dist/"
fi

# Verificar archivos críticos
if [ ! -f "dist/index.html" ]; then
    error "Build incompleto. No se encontró index.html"
fi

success "✅ Build completado exitosamente!"
log "📁 Archivos generados en: dist/"
log "📊 Tamaño del build: $(du -sh dist | cut -f1)"

# Deploy según plataforma
PLATFORM=${1:-"vercel"}

case $PLATFORM in
    "vercel")
        log "🚀 Deployando a Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod --yes
            success "✅ Deploy a Vercel completado!"
        else
            error "Vercel CLI no está instalado. Instala con: npm i -g vercel"
        fi
        ;;
    "netlify")
        log "🚀 Deployando a Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
            success "✅ Deploy a Netlify completado!"
        else
            error "Netlify CLI no está instalado. Instala con: npm i -g netlify-cli"
        fi
        ;;
    "github")
        log "🚀 Preparando para GitHub Pages..."
        log "📝 Asegúrate de configurar GitHub Actions para el deploy automático"
        success "✅ Build listo para GitHub Pages!"
        ;;
    *)
        log "📋 Build completado. Para deployar:"
        log "   - Vercel: ./deploy.sh vercel"
        log "   - Netlify: ./deploy.sh netlify"
        log "   - GitHub: ./deploy.sh github"
        ;;
esac

log "🎉 Proceso completado!" 
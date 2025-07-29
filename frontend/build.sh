#!/bin/bash

# Script de build para producción
echo "🚀 Iniciando build para producción..."

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf dist

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Build para producción
echo "🔨 Construyendo aplicación..."
npm run build

# Verificar que el build fue exitoso
if [ -d "dist" ]; then
    echo "✅ Build completado exitosamente!"
    echo "📁 Archivos generados en: dist/"
    echo "🌐 Para deployar:"
    echo "   - Vercel: vercel --prod"
    echo "   - Netlify: netlify deploy --prod --dir=dist"
    echo "   - GitHub Pages: git push origin main"
else
    echo "❌ Error en el build"
    exit 1
fi 
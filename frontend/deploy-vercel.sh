#!/bin/bash

# Script de despliegue automatizado para Vercel
# Uso: ./deploy-vercel.sh

echo "🚀 Iniciando despliegue en Vercel..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio frontend/"
    exit 1
fi

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Construir el proyecto
echo "🔨 Construyendo el proyecto..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción del proyecto"
    exit 1
fi

# Verificar que la carpeta dist existe
if [ ! -d "dist" ]; then
    echo "❌ Error: No se encontró la carpeta dist/"
    exit 1
fi

# Desplegar en Vercel
echo "🌐 Desplegando en Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ ¡Despliegue completado exitosamente!"
    echo "🌍 Tu aplicación está disponible en Vercel"
else
    echo "❌ Error en el despliegue"
    exit 1
fi 
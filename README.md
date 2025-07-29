# 🎸 Web Bands - Plantilla Profesional para Bandas de Música

Una plantilla moderna y profesional en React para bandas de música, con CMS Sanity integrado y funcionalidades avanzadas.

## 🚀 Características

- **Frontend React** con Vite
- **CMS Sanity** para gestión de contenido
- **Diseño responsivo** y moderno
- **Sistema de colores dinámico** por banda
- **Integración con EmailJS** para formularios de contacto
- **SEO optimizado** con títulos dinámicos
- **Favicons dinámicos** por banda
- **Navegación dinámica** basada en contenido

## 📁 Estructura del Proyecto

```
web-bands/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── utils/          # Utilidades
│   │   └── config.js       # Configuración
│   ├── public/             # Archivos estáticos
│   ├── env.development     # Variables de entorno desarrollo
│   ├── env.production      # Variables de entorno producción
│   └── vercel.json         # Configuración Vercel
├── schemaTypes/            # Esquemas de Sanity
├── sanity.config.ts        # Configuración Sanity
└── package.json           # Dependencias del proyecto
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 8.0.0

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/manterolaenrique/web-bands.git
cd web-bands
```

2. **Instalar dependencias**
```bash
npm run install:all
```

3. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp frontend/env.example frontend/.env

# Editar con tus valores
# VITE_SANITY_PROJECT_ID=tu_project_id_aqui
```

4. **Iniciar desarrollo**
```bash
npm run dev:all
```

## 🌐 Despliegue en Vercel

### Paso 1: Conectar con GitHub

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Selecciona el repositorio `web-bands`

### Paso 2: Configurar el Proyecto

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Paso 3: Variables de Entorno

Configura las siguientes variables en Vercel:

```env
VITE_ENV=production
VITE_SANITY_PROJECT_ID=vyjsvcoh
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-01-01
VITE_SANITY_STUDIO_URL=https://bandas-web.sanity.studio
VITE_APP_URL=https://tu-dominio-vercel.vercel.app
VITE_APP_NAME=Web Bands
```

### Paso 4: Desplegar

1. Haz clic en "Deploy"
2. Vercel construirá y desplegará automáticamente
3. Cada push a `main` activará un nuevo despliegue

## 🎨 Sanity Studio

### Desplegar Sanity Studio

1. **Desde el directorio raíz**:
```bash
npm run deploy
```

2. **O manualmente**:
```bash
sanity deploy
```

### Acceder al Studio

- **Desarrollo**: http://localhost:3333
- **Producción**: https://bandas-web.sanity.studio

## 📧 Configuración de EmailJS

Consulta `frontend/SANITY_EMAILJS_SETUP.md` para configurar el sistema de emails.

## 🎨 Sistema de Colores

Consulta `COLOR_SYSTEM_GUIDE.md` para entender cómo funciona el sistema de colores dinámico.

## 🔧 Scripts Disponibles

### Desarrollo
- `npm run dev` - Inicia Sanity Studio
- `npm run start:frontend` - Inicia el frontend
- `npm run dev:all` - Inicia ambos servicios

### Construcción
- `npm run build` - Construye Sanity Studio
- `npm run build:frontend` - Construye el frontend
- `npm run build:frontend:prod` - Construye para producción

### Despliegue
- `npm run deploy` - Despliega Sanity Studio
- `npm run deploy:vercel` - Despliega en Vercel (desde frontend/)

## 📚 Documentación Adicional

- [Guía de Colores](COLOR_SYSTEM_GUIDE.md)
- [Guía de Favicons](FAVICON_SYSTEM_GUIDE.md)
- [Guía de Títulos](TITLE_SYSTEM_GUIDE.md)
- [Guía de Navegación](NAVBAR_DYNAMIC_GUIDE.md)
- [Guía de Escúchanos](ESCUCHANOS_GUIDE.md)
- [Ejemplo de Banda](EJEMPLO_BANDA.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Tu Nombre** - [@tuusuario](https://github.com/tuusuario)

---

⭐ Si este proyecto te ayuda, ¡dale una estrella!

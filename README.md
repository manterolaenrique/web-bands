# 🎵 Web Bands - Plantilla para Bandas de Música

Una plantilla profesional en React para bandas de música con CMS Sanity, diseñada para ser reutilizable y personalizable.

## ✨ Características

- **Plantilla One Page** moderna y responsive
- **CMS Sanity** para gestión de contenido dinámico
- **URLs personalizadas** por banda (ej: `/banda/los-bomberos`)
- **Colores personalizables** por banda
- **Componentes modulares** y reutilizables
- **Diseño responsive** para todos los dispositivos
- **SEO optimizado** con metadatos dinámicos

## 🏗️ Estructura del Proyecto

```
web-bands/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes de la UI
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── BandaPage.jsx
│   │   ├── sanityClient.js  # Cliente de Sanity
│   │   └── App.jsx          # Configuración de rutas
│   └── package.json
├── schemaTypes/             # Esquemas de Sanity
│   ├── banda.ts            # Esquema principal
│   └── index.ts
├── sanity.config.ts        # Configuración de Sanity
└── README.md
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd web-bands
```

### 2. Configurar Sanity CMS

#### Instalar dependencias de Sanity
```bash
npm install
```

#### Iniciar el estudio de Sanity
```bash
npm run dev
```

#### Acceder al CMS
Abre http://localhost:3333 en tu navegador

#### Crear una banda de ejemplo
1. Ve a "Banda" en el menú lateral
2. Haz clic en "Create new document"
3. Completa los campos:
   - **Nombre**: "Los Bomberos"
   - **Slug**: Se genera automáticamente
   - **Colores**: 
     - Primario: "#e74c3c"
     - Secundario: "#2c3e50"
   - **Hero**: 
     - Título: "Los Bomberos"
     - Subtítulo: "Música que incendia el alma"
     - Imagen: Sube una imagen de fondo
   - **About**: Información sobre la banda
   - **Contacto**: Email y redes sociales

### 3. Configurar el Frontend

#### Instalar dependencias
```bash
cd frontend
npm install
```

#### Verificar configuración de Sanity
Asegúrate de que el `projectId` en `frontend/src/sanityClient.js` coincida con tu proyecto de Sanity.

#### Iniciar el servidor de desarrollo
```bash
npm run dev
```

#### Probar la aplicación
Visita http://localhost:5173/banda/los-bomberos

## 📝 Uso del CMS

### Campos del Esquema de Banda

#### Información Básica
- **Nombre**: Nombre de la banda
- **Slug**: URL amigable (se genera automáticamente)

#### Colores
- **Primario**: Color principal de la banda
- **Secundario**: Color secundario
- **Acento**: Color de acento (opcional)

#### Sección Hero
- **Título**: Título principal
- **Subtítulo**: Subtítulo descriptivo
- **Imagen**: Imagen de fondo
- **Descripción**: Texto descriptivo corto

#### Sección About
- **Título**: Título de la sección
- **Contenido**: Descripción de la banda
- **Imagen**: Imagen de la banda
- **Integrantes**: Lista de miembros con fotos e instrumentos

#### Contacto
- **Email**: Email de contacto
- **Teléfono**: Número de teléfono
- **Ubicación**: Ciudad/país
- **Redes Sociales**: Enlaces a Instagram, YouTube, Facebook, etc.

#### Música
- **Spotify Embed**: URL del embed de Spotify
- **YouTube Embed**: URL del embed de YouTube

#### SEO
- **Título SEO**: Título para motores de búsqueda
- **Descripción SEO**: Descripción para motores de búsqueda
- **Palabras Clave**: Array de palabras clave

## 🎨 Personalización

### Colores
Los colores se aplican automáticamente en:
- Botones y elementos interactivos
- Títulos y acentos
- Fondos de secciones
- Enlaces y hover states

### Componentes
Cada componente es modular y puede ser personalizado:
- `Hero.jsx`: Sección principal con imagen de fondo
- `About.jsx`: Información de la banda e integrantes
- `Contact.jsx`: Formulario y redes sociales
- `Navbar.jsx`: Navegación responsive
- `Footer.jsx`: Información de contacto y enlaces

## 🔧 Desarrollo

### Agregar nuevas bandas
1. Ve al CMS de Sanity
2. Crea un nuevo documento de tipo "Banda"
3. Completa todos los campos requeridos
4. La banda estará disponible en `/banda/[slug]`

### Modificar componentes
Los componentes están en `frontend/src/components/` y usan:
- **Inline styles** para máxima compatibilidad
- **Props** para datos dinámicos
- **Responsive design** con CSS Grid y Flexbox

### Agregar nuevas secciones
1. Crea un nuevo componente en `components/`
2. Agrega los campos necesarios al esquema de Sanity
3. Integra el componente en `BandaPage.jsx`

## 🚀 Despliegue

### Sanity Studio
```bash
npm run build
npm run deploy
```

### Frontend (Vercel)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno:
   - `VITE_SANITY_PROJECT_ID`: Tu project ID de Sanity
   - `VITE_SANITY_DATASET`: Tu dataset (production)
3. Deploy automático en cada push

### Frontend (Netlify)
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno
3. Build command: `cd frontend && npm run build`
4. Publish directory: `frontend/dist`

## 📱 Responsive Design

La plantilla es completamente responsive:
- **Desktop**: Layout completo con navegación horizontal
- **Tablet**: Adaptación de grids y espaciado
- **Mobile**: Navegación hamburguesa y layout vertical

## 🎯 SEO

Cada banda tiene:
- **Meta tags** dinámicos
- **Open Graph** para redes sociales
- **Structured data** para motores de búsqueda
- **URLs amigables** con slugs personalizados

## 🔒 Seguridad

- **CORS** configurado en Sanity
- **API keys** seguras
- **Validación** de datos en el frontend
- **Sanitización** de contenido

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas:
1. Revisa la documentación de [Sanity](https://www.sanity.io/docs)
2. Verifica la configuración del proyecto
3. Abre un issue en el repositorio

## 🎵 Ejemplo de Uso

1. **Configura Sanity** y crea una banda
2. **Personaliza** colores y contenido
3. **Sube imágenes** de la banda
4. **Agrega redes sociales**
5. **Deploy** en tu hosting preferido
6. **Comparte** la URL con tu audiencia

¡Tu banda tendrá una web profesional en minutos! 🚀

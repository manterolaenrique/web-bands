export default {
  name: 'banda',
  title: 'Banda',
  type: 'document',
  fields: [
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'nombre',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'nombre',
      title: 'Nombre de la Banda',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'genero',
      title: 'Género Musical',
      type: 'string',
      description: 'Género principal de la banda (ej: Rock, Pop, Jazz, etc.)',
    },
    {
      name: 'logo',
      title: 'Logo de la Banda',
      type: 'image',
      description: 'Logo oficial de la banda (recomendado: formato PNG con fondo transparente, mínimo 200x200px)',
      options: {
        hotspot: true,
        accept: 'image/png, image/jpeg, image/webp',
      },
    },
    {
      name: 'logo_favicon',
      title: 'Logo para Pestaña del Navegador',
      type: 'image',
      description: 'Logo optimizado para favicon (recomendado: PNG con fondo transparente, 32x32px o 64x64px, diseño simple y reconocible)',
      options: {
        hotspot: true,
        accept: 'image/png, image/jpeg, image/webp',
      },
    },
    {
      name: 'colores',
      title: 'Colores de la Banda',
      type: 'object',
      fields: [
        {
          name: 'primario',
          title: 'Color Primario',
          type: 'string',
          description: 'Color principal de la banda (hex, rgb, o nombre)',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'secundario',
          title: 'Color Secundario',
          type: 'string',
          description: 'Color secundario de la banda (hex, rgb, o nombre)',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'secundario_claro',
          title: 'Color Secundario Claro',
          type: 'string',
          description: 'Versión clara del color secundario para fondos sutiles',
        },
        {
          name: 'acento',
          title: 'Color de Acento',
          type: 'string',
          description: 'Color de acento para elementos destacados',
        },
      ],
    },
    {
      name: 'hero',
      title: 'Sección Hero',
      type: 'object',
      fields: [
        {
          name: 'titulo',
          title: 'Título Principal',
          type: 'string',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'subtitulo',
          title: 'Subtítulo',
          type: 'string',
        },
        {
          name: 'imagen',
          title: 'Imagen de Fondo',
          type: 'image',
          options: {
            hotspot: true,
          },
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'descripcion',
          title: 'Descripción Corta',
          type: 'text',
          rows: 3,
        },
      ],
    },
    {
      name: 'about',
      title: 'Sobre la Banda',
      type: 'object',
      fields: [
        {
          name: 'titulo',
          title: 'Título de la Sección',
          type: 'string',
          initialValue: 'Quiénes Somos',
        },
        {
          name: 'contenido',
          title: 'Contenido',
          type: 'text',
          rows: 6,
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'imagen',
          title: 'Imagen de la Banda',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'integrantes',
          title: 'Integrantes',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'nombre',
                  title: 'Nombre',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'instrumento',
                  title: 'Instrumento',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'foto',
                  title: 'Foto',
                  type: 'image',
                  options: {
                    hotspot: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'timelineSection',
      title: 'Sección Línea de Tiempo',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Habilitar Línea de Tiempo',
          type: 'boolean',
          initialValue: true,
          description: 'Activa o desactiva la sección de línea de tiempo',
        },
        {
          name: 'titulo',
          title: 'Título de la Sección',
          type: 'string',
          initialValue: 'Nuestra Historia',
          description: 'Título principal de la sección de línea de tiempo',
        },
        {
          name: 'descripcion',
          title: 'Descripción',
          type: 'text',
          rows: 3,
          description: 'Descripción breve de la sección',
        },
        {
          name: 'events',
          title: 'Eventos de la Línea de Tiempo',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Nombre del Evento',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                  description: 'Ej: "Inicio de la banda", "Primer concierto", etc.',
                },
                {
                  name: 'date',
                  title: 'Fecha',
                  type: 'datetime',
                  validation: (Rule: any) => Rule.required(),
                  description: 'Fecha del evento (se mostrará solo el año)',
                },
                {
                  name: 'importance',
                  title: 'Importancia',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Principal', value: 'principal' },
                      { title: 'Secundario', value: 'secundario' },
                      { title: 'Tercero', value: 'tercero' },
                    ],
                  },
                  initialValue: 'secundario',
                  validation: (Rule: any) => Rule.required(),
                  description: 'Define el estilo visual del evento',
                },
                {
                  name: 'image',
                  title: 'Imagen del Evento',
                  type: 'image',
                  options: {
                    hotspot: true,
                  },
                  description: 'Imagen que se mostrará al hacer hover (opcional)',
                },
                {
                  name: 'descripcion',
                  title: 'Descripción del Evento',
                  type: 'text',
                  rows: 2,
                  description: 'Descripción breve del evento (opcional)',
                },
              ],
              preview: {
                select: {
                  title: 'name',
                  subtitle: 'date',
                  media: 'image',
                },
                prepare(selection: any) {
                  const { title, subtitle, media } = selection
                  const year = subtitle ? new Date(subtitle).getFullYear() : 'Sin fecha'
                  return {
                    title: title || 'Sin título',
                    subtitle: year,
                    media: media,
                  }
                },
              },
            },
          ],
          validation: (Rule: any) => Rule.min(1).max(10),
          description: 'Agrega los eventos importantes de la banda (máximo 10)',
        },
      ],
    },
    {
      name: 'contacto',
      title: 'Información de Contacto',
      type: 'object',
      fields: [
        {
          name: 'email',
          title: 'Email',
          type: 'string',
          validation: (Rule: any) => Rule.email(),
        },
        {
          name: 'telefono',
          title: 'Teléfono',
          type: 'string',
        },
        {
          name: 'ubicacion',
          title: 'Ubicación',
          type: 'string',
        },
        {
          name: 'redes',
          title: 'Redes Sociales',
          type: 'object',
          fields: [
            {
              name: 'instagram',
              title: 'Instagram',
              type: 'url',
            },
            {
              name: 'youtube',
              title: 'YouTube',
              type: 'url',
            },
            {
              name: 'facebook',
              title: 'Facebook',
              type: 'url',
            },
            {
              name: 'twitter',
              title: 'Twitter/X',
              type: 'url',
            },
            {
              name: 'spotify',
              title: 'Spotify',
              type: 'url',
            },
            {
              name: 'tiktok',
              title: 'TikTok',
              type: 'url',
            },
          ],
        },
        {
          name: 'emailjs_config',
          title: 'Configuración de EmailJS',
          type: 'object',
          description: 'Configuración para el envío de emails desde el formulario de contacto',
          fields: [
            {
              name: 'habilitado',
              title: 'Habilitar envío de emails',
              type: 'boolean',
              initialValue: false,
              description: 'Activa esta opción para habilitar el formulario de contacto',
            },
            {
              name: 'service_id',
              title: 'Service ID de EmailJS',
              type: 'string',
              description: 'ID del servicio de email configurado en EmailJS',
              hidden: ({ parent }: any) => !parent?.habilitado,
            },
            {
              name: 'template_id',
              title: 'Template ID de EmailJS',
              type: 'string',
              description: 'ID del template de email configurado en EmailJS',
              hidden: ({ parent }: any) => !parent?.habilitado,
            },
            {
              name: 'public_key',
              title: 'Public Key de EmailJS',
              type: 'string',
              description: 'Clave pública de EmailJS (se puede obtener desde Account > API Keys)',
              hidden: ({ parent }: any) => !parent?.habilitado,
            },
            {
              name: 'email_destino',
              title: 'Email de destino',
              type: 'string',
              description: 'Email donde se recibirán los mensajes del formulario (por defecto usa el email principal)',
              validation: (Rule: any) => Rule.email(),
              hidden: ({ parent }: any) => !parent?.habilitado,
            },
            {
              name: 'mensaje_exito',
              title: 'Mensaje de éxito personalizado',
              type: 'string',
              description: 'Mensaje que se mostrará cuando el email se envíe exitosamente',
              initialValue: '¡Mensaje enviado exitosamente! Te responderemos pronto.',
              hidden: ({ parent }: any) => !parent?.habilitado,
            },
            {
              name: 'mensaje_error',
              title: 'Mensaje de error personalizado',
              type: 'string',
              description: 'Mensaje que se mostrará cuando haya un error al enviar el email',
              initialValue: 'Error al enviar el mensaje. Verifica los datos e intenta nuevamente.',
              hidden: ({ parent }: any) => !parent?.habilitado,
            },
          ],
        },
      ],
    },
    {
      name: 'musica',
      title: 'Música',
      type: 'object',
      fields: [
        {
          name: 'spotify_embed',
          title: 'Embed de Spotify',
          type: 'text',
          description: 'Código de embed de Spotify (opcional)',
          rows: 3,
        },
        {
          name: 'youtube_embed',
          title: 'Embed de YouTube',
          type: 'text',
          description: 'Código de embed de YouTube (opcional)',
          rows: 3,
        },
      ],
    },
    {
      name: 'escuchanos',
      title: 'Sección Escúchanos',
      type: 'object',
      fields: [
        {
          name: 'titulo',
          title: 'Título de la Sección',
          type: 'string',
          initialValue: 'Escúchanos',
        },
        {
          name: 'descripcion',
          title: 'Descripción',
          type: 'text',
          rows: 3,
          description: 'Descripción breve de la sección',
        },
        {
          name: 'youtube',
          title: 'YouTube',
          type: 'object',
          fields: [
            {
              name: 'habilitado',
              title: 'Habilitar YouTube',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'titulo',
              title: 'Título de YouTube',
              type: 'string',
              initialValue: 'Videos en YouTube',
            },
            {
              name: 'videos',
              title: 'Videos de YouTube',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'titulo',
                      title: 'Título del Video',
                      type: 'string',
                      validation: (Rule: any) => Rule.required(),
                    },
                    {
                      name: 'url',
                      title: 'URL del Video',
                      type: 'url',
                      description: 'URL completa del video de YouTube (ej: https://www.youtube.com/watch?v=VIDEO_ID)',
                      validation: (Rule: any) => Rule.required(),
                    },
                    {
                      name: 'descripcion',
                      title: 'Descripción',
                      type: 'text',
                      rows: 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'spotify',
          title: 'Spotify',
          type: 'object',
          fields: [
            {
              name: 'habilitado',
              title: 'Habilitar Spotify',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'titulo',
              title: 'Título de Spotify',
              type: 'string',
              initialValue: 'Música en Spotify',
            },
            {
              name: 'perfil_url',
              title: 'URL del Perfil de Spotify',
              type: 'url',
              description: 'URL del perfil de artista en Spotify',
            },
            {
              name: 'playlists',
              title: 'Playlists Destacadas',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'titulo',
                      title: 'Título de la Playlist',
                      type: 'string',
                      validation: (Rule: any) => Rule.required(),
                    },
                    {
                      name: 'url',
                      title: 'URL de la Playlist',
                      type: 'url',
                      description: 'URL de la playlist en Spotify',
                      validation: (Rule: any) => Rule.required(),
                    },
                    {
                      name: 'descripcion',
                      title: 'Descripción',
                      type: 'text',
                      rows: 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'titulo_seo',
          title: 'Título SEO',
          type: 'string',
          description: 'Título que aparecerá en los motores de búsqueda',
        },
        {
          name: 'descripcion_seo',
          title: 'Descripción SEO',
          type: 'text',
          rows: 3,
          description: 'Descripción que aparecerá en los motores de búsqueda',
        },
        {
          name: 'palabras_clave',
          title: 'Palabras Clave',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Palabras clave para SEO',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'nombre',
      media: 'hero.imagen',
    },
  },
} 
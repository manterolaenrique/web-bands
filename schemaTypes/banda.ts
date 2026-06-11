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
      name: 'bandId',
      title: 'ID de Banda en Supabase',
      type: 'string',
      description: 'UUID de la banda en Supabase. Usado por la V2 para ownership y permisos.',
      readOnly: true,
    },
    {
      name: 'status',
      title: 'Estado de Publicacion V2',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'published',
      description: 'La V2 publica solo documentos con estado published.',
    },
    {
      name: 'visibility',
      title: 'Visibilidad V2',
      type: 'string',
      options: {
        list: [
          { title: 'Public', value: 'public' },
          { title: 'Unlisted', value: 'unlisted' },
          { title: 'Private', value: 'private' },
        ],
      },
      initialValue: 'public',
      description: 'La V2 lista solo documentos con visibilidad public.',
    },
    {
      name: 'updatedBy',
      title: 'Ultima Edicion por Usuario',
      type: 'string',
      description: 'UUID del usuario de Supabase que hizo la ultima sincronizacion desde el dashboard V2.',
      readOnly: true,
    },
    {
      name: 'lastSyncedAt',
      title: 'Ultima Sincronizacion V2',
      type: 'datetime',
      readOnly: true,
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
        {
          name: 'showSpotlightCard',
          title: 'Mostrar Tarjeta Lateral del Hero',
          type: 'boolean',
          initialValue: true,
          description: 'Muestra u oculta la tarjeta destacada del costado derecho de la cabecera publica.',
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
                {
                  name: 'link',
                  title: 'Enlace del Evento',
                  type: 'url',
                  description: 'Enlace relacionado con el evento (opcional). Ej: enlace a noticia, video, álbum, etc.',
                },
                {
                  name: 'icon',
                  title: 'Icono del Evento',
                  type: 'string',
                  description: 'Selecciona un icono que represente el tipo de evento',
                  options: {
                    list: [
                      // Iconos de música
                      { title: '🎤 Micrófono (Concierto/Show)', value: '🎤' },
                      { title: '💿 Disco (Álbum/CD)', value: '💿' },
                      { title: '🎵 Nota musical (Single/Canción)', value: '🎵' },
                      { title: '🎬 Cámara (Video/Clip)', value: '🎬' },
                      { title: '🎸 Guitarra (Inicio/Formación)', value: '🎸' },
                      { title: '🥁 Tambor (Batería/Ritmo)', value: '🥁' },
                      { title: '🎹 Piano (Teclado/Instrumental)', value: '🎹' },
                      { title: '🎺 Trompeta (Vientos)', value: '🎺' },
                      { title: '🎻 Violín (Cuerdas)', value: '🎻' },
                      { title: '🎧 Auriculares (Escuchar)', value: '🎧' },
                      { title: '📻 Radio (Transmisión)', value: '📻' },
                      { title: '🎙️ Micrófono de estudio (Grabación)', value: '🎙️' },
                      { title: '🎚️ Control de mezcla (Producción)', value: '🎚️' },
                      { title: '🎛️ Control de volumen (Audio)', value: '🎛️' },
                      { title: '🎼 Partitura (Composición)', value: '🎼' },
                      { title: '🎷 Saxofón (Jazz/Fusion)', value: '🎷' },
                      { title: '🪕 Banjo (Folk/Country)', value: '🪕' },
                      { title: '🪘 Gong (Percusión)', value: '🪘' },
                      { title: '🪗 Acordeón (Tango/Folk)', value: '🪗' },
                      { title: '🪕 Mandolina (Folk)', value: '🪕' },
                      
                      // Iconos de eventos y fechas
                      { title: '📅 Calendario (Fecha/Evento)', value: '📅' },
                      { title: '⭐ Estrella (Principal)', value: '⭐' },
                      { title: '🎯 Diana (Secundario)', value: '🎯' },
                      { title: '📌 Pin (General)', value: '📌' },
                      { title: '🏆 Trofeo (Premio/Reconocimiento)', value: '🏆' },
                      { title: '🚌 Autobús (Tour/Gira)', value: '🚌' },
                      { title: '🤝 Apretón de manos (Colaboración)', value: '🤝' },
                      { title: '🎪 Carpa (Festival)', value: '🎪' },
                      { title: '🎭 Máscaras (Teatro/Show)', value: '🎭' },
                      { title: '🎨 Paleta (Arte/Creatividad)', value: '🎨' },
                      { title: '📺 TV (Televisión)', value: '📺' },
                      { title: '📱 Móvil (Digital/App)', value: '📱' },
                      { title: '💻 Computadora (Online/Digital)', value: '💻' },
                      { title: '🌐 Mundo (Internacional)', value: '🌐' },
                      { title: '🏛️ Edificio (Venue/Lugar)', value: '🏛️' },
                      { title: '🎪 Circo (Espectáculo)', value: '🎪' },
                      { title: '🎡 Rueda de la fortuna (Feria)', value: '🎡' },
                      { title: '🎢 Montaña rusa (Aventura)', value: '🎢' },
                      { title: '🎠 Caballito (Nostalgia)', value: '🎠' },
                      { title: '🎣 Caña de pescar (Paciencia)', value: '🎣' },
                      { title: '🎤🎵 Micrófono con nota (Live)', value: '🎤🎵' },
                      { title: '💿🎵 Disco con nota (Álbum)', value: '💿🎵' },
                      { title: '🎸🎤 Guitarra con micrófono (Rock)', value: '🎸🎤' },
                      { title: '🥁🎵 Tambor con nota (Ritmo)', value: '🥁🎵' },
                      { title: '🎹🎼 Piano con partitura (Clásico)', value: '🎹🎼' },
                      { title: '🎺🎷 Trompeta y saxofón (Jazz)', value: '🎺🎷' },
                      { title: '🎻🎼 Violín con partitura (Orquesta)', value: '🎻🎼' },
                      { title: '🎧🎵 Auriculares con nota (Escuchar)', value: '🎧🎵' },
                      { title: '📻🎵 Radio con nota (Transmisión)', value: '📻🎵' },
                      { title: '🎙️🎚️ Micrófono con controles (Grabación)', value: '🎙️🎚️' },
                      { title: '🎼🎵 Partitura con nota (Composición)', value: '🎼🎵' },
                      { title: '🎪🎭 Carpa con máscaras (Festival)', value: '🎪🎭' },
                      { title: '🏆⭐ Trofeo con estrella (Premio principal)', value: '🏆⭐' },
                      { title: '🚌🌐 Autobús con mundo (Gira internacional)', value: '🚌🌐' },
                      { title: '🤝🎵 Apretón con nota (Colaboración musical)', value: '🤝🎵' },
                      { title: '📅⭐ Calendario con estrella (Fecha importante)', value: '📅⭐' },
                      { title: '🎤🏆 Micrófono con trofeo (Concierto premiado)', value: '🎤🏆' },
                      { title: '💿🏆 Disco con trofeo (Álbum premiado)', value: '💿🏆' },
                      { title: '🎵🏆 Nota con trofeo (Canción premiada)', value: '🎵🏆' },
                      { title: '🎬🏆 Cámara con trofeo (Video premiado)', value: '🎬🏆' },
                      { title: '🎸🏆 Guitarra con trofeo (Instrumento premiado)', value: '🎸🏆' },
                      { title: '🎪🏆 Carpa con trofeo (Festival premiado)', value: '🎪🏆' },
                      { title: '🎭🏆 Máscaras con trofeo (Show premiado)', value: '🎭🏆' },
                      { title: '🎨🏆 Paleta con trofeo (Arte premiado)', value: '🎨🏆' },
                      { title: '📺🏆 TV con trofeo (Televisión premiada)', value: '📺🏆' },
                      { title: '📱🏆 Móvil con trofeo (Digital premiado)', value: '📱🏆' },
                      { title: '💻🏆 Computadora con trofeo (Online premiado)', value: '💻🏆' },
                      { title: '🌐🏆 Mundo con trofeo (Internacional premiado)', value: '🌐🏆' },
                      { title: '🏛️🏆 Edificio con trofeo (Venue premiado)', value: '🏛️🏆' },
                      { title: '🎡🏆 Rueda con trofeo (Feria premiada)', value: '🎡🏆' },
                      { title: '🎢🏆 Montaña rusa con trofeo (Aventura premiada)', value: '🎢🏆' },
                      { title: '🎠🏆 Caballito con trofeo (Nostalgia premiada)', value: '🎠🏆' },
                      { title: '🎣🏆 Caña con trofeo (Paciencia premiada)', value: '🎣🏆' },
                    ]
                  },
                  validation: (Rule: any) => Rule.required().error('Debes seleccionar un icono para el evento')
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
      name: 'featuredRelease',
      title: 'Lanzamiento Destacado',
      type: 'object',
      fields: [
        {
          name: 'eyebrow',
          title: 'Etiqueta',
          type: 'string',
          description: 'Texto corto superior. Ej: Nuevo lanzamiento, Single o Album.',
        },
        {
          name: 'title',
          title: 'Titulo',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Descripcion',
          type: 'text',
          rows: 3,
        },
        {
          name: 'coverImage',
          title: 'Portada',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'spotifyUrl',
          title: 'Spotify URL',
          type: 'url',
        },
        {
          name: 'youtubeUrl',
          title: 'YouTube URL',
          type: 'url',
        },
        {
          name: 'appleMusicUrl',
          title: 'Apple Music URL',
          type: 'url',
        },
      ],
    },
    {
      name: 'showsSection',
      title: 'Seccion Shows',
      type: 'object',
      fields: [
        {
          name: 'titulo',
          title: 'Titulo',
          type: 'string',
          initialValue: 'Proximos shows',
        },
        {
          name: 'descripcion',
          title: 'Descripcion',
          type: 'text',
          rows: 3,
        },
        {
          name: 'shows',
          title: 'Shows',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'date',
                  title: 'Fecha',
                  type: 'datetime',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'venue',
                  title: 'Venue',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'location',
                  title: 'Ubicacion',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'ticketUrl',
                  title: 'URL entradas',
                  type: 'url',
                },
                {
                  name: 'status',
                  title: 'Estado',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Entradas', value: 'tickets'},
                      {title: 'Agotado', value: 'sold-out'},
                      {title: 'Proximamente', value: 'soon'},
                    ],
                  },
                  initialValue: 'tickets',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'gallerySection',
      title: 'Seccion Galeria',
      type: 'object',
      fields: [
        {
          name: 'titulo',
          title: 'Titulo',
          type: 'string',
          initialValue: 'Galeria',
        },
        {
          name: 'items',
          title: 'Imagenes',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'image',
                  title: 'Imagen',
                  type: 'image',
                  options: {
                    hotspot: true,
                  },
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'alt',
                  title: 'Texto alternativo',
                  type: 'string',
                },
                {
                  name: 'caption',
                  title: 'Caption',
                  type: 'string',
                },
                {
                  name: 'link',
                  title: 'Enlace',
                  type: 'url',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'presentation',
      title: 'Presentacion Publica',
      type: 'object',
      fields: [
        {
          name: 'sectionOrder',
          title: 'Orden de Secciones',
          type: 'array',
          description: 'Define el orden de las secciones publicas debajo del hero.',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Lanzamiento destacado', value: 'featured' },
              { title: 'Escuchanos', value: 'listen' },
              { title: 'Historia', value: 'about' },
              { title: 'Integrantes', value: 'members' },
              { title: 'Timeline', value: 'timeline' },
              { title: 'Shows', value: 'shows' },
              { title: 'Galeria', value: 'gallery' },
              { title: 'Contacto', value: 'contact' },
            ],
          },
        },
      ],
    },
    {
      name: 'internalKit',
      title: 'Kit Interno',
      type: 'object',
      description: 'Material privado de la banda para el dashboard. No se publica en la web.',
      fields: [
        {
          name: 'shortPitch',
          title: 'Resumen corto',
          type: 'text',
          rows: 3,
        },
        {
          name: 'contactName',
          title: 'Nombre de contacto',
          type: 'string',
        },
        {
          name: 'contactEmail',
          title: 'Email de contacto',
          type: 'string',
        },
        {
          name: 'contactPhone',
          title: 'Telefono de contacto',
          type: 'string',
        },
        {
          name: 'bookingNotes',
          title: 'Notas internas',
          type: 'text',
          rows: 4,
        },
        {
          name: 'keyLinks',
          title: 'Links clave',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'label',
                  title: 'Etiqueta',
                  type: 'string',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'url',
                  title: 'URL',
                  type: 'url',
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: 'kind',
                  title: 'Tipo',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Press', value: 'press' },
                      { title: 'Demo', value: 'demo' },
                      { title: 'Drive', value: 'drive' },
                      { title: 'Instagram', value: 'instagram' },
                      { title: 'Spotify', value: 'spotify' },
                      { title: 'YouTube', value: 'youtube' },
                      { title: 'Other', value: 'other' },
                    ],
                  },
                  initialValue: 'other',
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

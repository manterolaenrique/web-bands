import { createClient } from '@sanity/client'
import { getSanityConfig, log, logError } from './config'

const sanityConfig = getSanityConfig()

// Cliente de Sanity configurado
export const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  useCdn: true, // `false` if you want to ensure fresh data
  apiVersion: sanityConfig.apiVersion,
  // Si necesitas un token de API, descomenta la línea siguiente:
  // token: import.meta.env.VITE_SANITY_TOKEN, // Solo si el dataset está en privado
})

// Función helper para obtener una banda por slug
export const getBandaBySlug = async (slug) => {
  log(`Buscando banda con slug: ${slug}`)
  
  const query = `*[_type == "banda" && slug.current == $slug][0]{
    _id,
    nombre,
    slug,
    logo,
    logo_favicon,
    colores,
    genero,
    hero{
      titulo,
      subtitulo,
      imagen,
      descripcion
    },
    about{
      titulo,
      contenido,
      imagen,
      integrantes[]
    },
    contacto{
      email,
      telefono,
      redes,
      ubicacion,
      emailjs_config{
        habilitado,
        service_id,
        template_id,
        public_key,
        email_destino,
        mensaje_exito,
        mensaje_error
      }
    },
    musica{
      spotify_embed,
      youtube_embed
    },
    escuchanos{
      titulo,
      descripcion,
      youtube{
        habilitado,
        titulo,
        videos[]
      },
      spotify{
        habilitado,
        titulo,
        perfil_url,
        playlists[]
      }
    },
    seo{
      titulo_seo,
      descripcion_seo,
      palabras_clave
    }
  }`
  
  try {
    const result = await client.fetch(query, { slug })
    log(`Banda encontrada: ${result?.nombre || 'Sin nombre'}`)
    return result
  } catch (error) {
    logError('Error al obtener banda', error)
    throw error
  }
}

// Función helper para obtener todas las bandas
export const getAllBandas = async () => {
  log('Obteniendo todas las bandas...')
  
  const query = `*[_type == "banda"]{
    _id,
    nombre,
    slug,
    logo,
    "heroImage": hero.imagen,
    "heroTitle": hero.titulo
  }`
  
  try {
    const result = await client.fetch(query)
    log(`Bandas encontradas: ${result.length}`)
    return result
  } catch (error) {
    logError('Error al obtener bandas', error)
    throw error
  }
}

// Función para verificar conexión con Sanity
export const testSanityConnection = async () => {
  try {
    log('Probando conexión con Sanity...')
    const result = await client.fetch('*[_type == "banda"] | order(_createdAt desc)[0]')
    log('Conexión exitosa con Sanity', result ? 'Banda encontrada' : 'No hay bandas')
    return true
  } catch (error) {
    logError('Error de conexión con Sanity', error)
    return false
  }
} 
import Link from 'next/link'
import {notFound} from 'next/navigation'

import {BandEditorForm} from '@/components/dashboard/BandEditorForm'
import {BandTeamPanel} from '@/components/dashboard/BandTeamPanel'
import {getDashboardFlash} from '@/lib/dashboard/messages'
import {formatTimelineDateForInput} from '@/lib/bands/content'
import type {BandEditorValues} from '@/lib/bands/editor'
import {
  getBandStatusLabel,
  getBandStatusTone,
  getBandVisibilityLabel,
  getBandVisibilityMessage,
  isBandPublic,
} from '@/lib/bands/publication'
import {canEditBand, canManageBand, getMembershipRole} from '@/lib/auth/permissions'
import {requireUser} from '@/lib/auth/session'
import {resolveBandDocumentId} from '@/lib/sanity/document-id'
import {getSanityImageUrl} from '@/lib/sanity/image'
import {getBandByBandId, getBandByDocumentId} from '@/lib/sanity/queries'
import {createAdminClient} from '@/lib/supabase/admin'
import {createClient} from '@/lib/supabase/server'
import type {BandInviteSummary, BandMemberSummary, BandStatus, PublicBand, SupabaseBand} from '@/types/band'

type PageProps = {
  params: Promise<{
    bandId: string
  }>
  searchParams: Promise<{
    message?: string
  }>
}

function resolveMemberKey(key: string | undefined, index: number) {
  return key || `member-${index}`
}

function resolveTimelineEventKey(key: string | undefined, index: number) {
  return key || `timeline-${index}`
}

function resolveYoutubeVideoKey(key: string | undefined, index: number) {
  return key || `youtube-${index}`
}

function resolveSpotifyPlaylistKey(key: string | undefined, index: number) {
  return key || `spotify-${index}`
}

function resolveShowKey(key: string | undefined, index: number) {
  return key || `show-${index}`
}

function resolveGalleryItemKey(key: string | undefined, index: number) {
  return key || `gallery-${index}`
}

function createInitialValues(bandRow: SupabaseBand, sanityBand: PublicBand | null): BandEditorValues {
  return {
    name: sanityBand?.nombre || bandRow.name,
    slug: sanityBand?.slug?.current || bandRow.slug,
    genre: sanityBand?.genero || '',
    status: (bandRow.status || sanityBand?.status || 'draft') as BandStatus,
    colors: {
      primary: sanityBand?.colores?.primario || '#111827',
      secondary: sanityBand?.colores?.secundario || '#6b7280',
      secondaryLight: sanityBand?.colores?.secundario_claro || '',
      accent: sanityBand?.colores?.acento || '',
    },
    hero: {
      title: sanityBand?.hero?.titulo || sanityBand?.nombre || bandRow.name,
      subtitle: sanityBand?.hero?.subtitulo || '',
      description: sanityBand?.hero?.descripcion || '',
      showSpotlightCard: sanityBand?.hero?.showSpotlightCard ?? true,
    },
    about: {
      title: sanityBand?.about?.titulo || 'Quienes Somos',
      content: sanityBand?.about?.contenido || 'Contanos la historia de la banda.',
      integrantes: sanityBand?.about?.integrantes?.map((member, index) => ({
          _key: resolveMemberKey(member._key, index),
          nombre: member.nombre || '',
          instrumento: member.instrumento || '',
          foto: member.foto,
        })) || [],
    },
    timelineSection: {
      enabled: sanityBand?.timelineSection?.enabled || false,
      titulo: sanityBand?.timelineSection?.titulo || '',
      descripcion: sanityBand?.timelineSection?.descripcion || '',
      events: sanityBand?.timelineSection?.events?.map((event, index) => ({
          _key: resolveTimelineEventKey(event._key, index),
          name: event.name || '',
          date: formatTimelineDateForInput(event.date),
          importance: (event.importance || 'secundario') as 'principal' | 'secundario' | 'tercero',
          image: event.image,
          descripcion: event.descripcion || '',
          link: event.link || '',
          icon: event.icon || '🎤',
        })) || [],
    },
    contact: {
      email: sanityBand?.contacto?.email || '',
      phone: sanityBand?.contacto?.telefono || '',
      location: sanityBand?.contacto?.ubicacion || '',
      instagram: sanityBand?.contacto?.redes?.instagram || '',
      youtube: sanityBand?.contacto?.redes?.youtube || '',
      facebook: sanityBand?.contacto?.redes?.facebook || '',
      twitter: sanityBand?.contacto?.redes?.twitter || '',
      spotify: sanityBand?.contacto?.redes?.spotify || '',
      tiktok: sanityBand?.contacto?.redes?.tiktok || '',
    },
    escuchanos: {
      titulo: sanityBand?.escuchanos?.titulo || '',
      descripcion: sanityBand?.escuchanos?.descripcion || '',
      youtube: {
        habilitado: sanityBand?.escuchanos?.youtube?.habilitado || false,
        titulo: sanityBand?.escuchanos?.youtube?.titulo || '',
        videos: sanityBand?.escuchanos?.youtube?.videos?.map((video, index) => ({
            _key: resolveYoutubeVideoKey(video._key, index),
            titulo: video.titulo || '',
            url: video.url || '',
            descripcion: video.descripcion || '',
          })) || [],
      },
      spotify: {
        habilitado: sanityBand?.escuchanos?.spotify?.habilitado || false,
        titulo: sanityBand?.escuchanos?.spotify?.titulo || '',
        perfil_url: sanityBand?.escuchanos?.spotify?.perfil_url || '',
        playlists: sanityBand?.escuchanos?.spotify?.playlists?.map((playlist, index) => ({
            _key: resolveSpotifyPlaylistKey(playlist._key, index),
            titulo: playlist.titulo || '',
            url: playlist.url || '',
            descripcion: playlist.descripcion || '',
          })) || [],
      },
    },
    featuredRelease: {
      eyebrow: sanityBand?.featuredRelease?.eyebrow || '',
      title: sanityBand?.featuredRelease?.title || '',
      description: sanityBand?.featuredRelease?.description || '',
      coverImage: sanityBand?.featuredRelease?.coverImage,
      spotifyUrl: sanityBand?.featuredRelease?.spotifyUrl || '',
      youtubeUrl: sanityBand?.featuredRelease?.youtubeUrl || '',
      appleMusicUrl: sanityBand?.featuredRelease?.appleMusicUrl || '',
    },
    showsSection: {
      titulo: sanityBand?.showsSection?.titulo || '',
      descripcion: sanityBand?.showsSection?.descripcion || '',
      shows: sanityBand?.showsSection?.shows?.map((show, index) => ({
          _key: resolveShowKey(show._key, index),
          date: formatTimelineDateForInput(show.date),
          venue: show.venue || '',
          location: show.location || '',
          ticketUrl: show.ticketUrl || '',
          status: (show.status || 'tickets') as 'tickets' | 'sold-out' | 'soon',
        })) || [],
    },
    gallerySection: {
      titulo: sanityBand?.gallerySection?.titulo || '',
      items: sanityBand?.gallerySection?.items?.map((item, index) => ({
          _key: resolveGalleryItemKey(item._key, index),
          image: item.image,
          alt: item.alt || '',
          caption: item.caption || '',
          link: item.link || '',
        })) || [],
    },
    seo: {
      title: sanityBand?.seo?.titulo_seo || '',
      description: sanityBand?.seo?.descripcion_seo || '',
      keywords: sanityBand?.seo?.palabras_clave || [],
    },
  }
}

function createInitialImages(sanityBand: PublicBand | null) {
  return {
    logo: getSanityImageUrl(sanityBand?.logo, {width: 320, height: 320, fit: 'max'}),
    logoFavicon: getSanityImageUrl(sanityBand?.logo_favicon, {width: 160, height: 160, fit: 'max'}),
    heroImage: getSanityImageUrl(sanityBand?.hero?.imagen, {width: 800, height: 520, fit: 'crop'}),
    aboutImage: getSanityImageUrl(sanityBand?.about?.imagen, {width: 700, height: 480, fit: 'crop'}),
    featuredReleaseCover: getSanityImageUrl(sanityBand?.featuredRelease?.coverImage, {width: 480, height: 480, fit: 'crop'}),
    integrantes: Object.fromEntries(
      (sanityBand?.about?.integrantes || []).map((member, index) => [
        resolveMemberKey(member._key, index),
        getSanityImageUrl(member.foto, {width: 360, height: 360, fit: 'crop'}),
      ])
    ),
    timelineEvents: Object.fromEntries(
      (sanityBand?.timelineSection?.events || []).map((event, index) => [
        resolveTimelineEventKey(event._key, index),
        getSanityImageUrl(event.image, {width: 560, height: 360, fit: 'crop'}),
      ])
    ),
    galleryItems: Object.fromEntries(
      (sanityBand?.gallerySection?.items || []).map((item, index) => [
        resolveGalleryItemKey(item._key, index),
        getSanityImageUrl(item.image, {width: 480, height: 480, fit: 'crop'}),
      ])
    ),
  }
}

export default async function EditBandPage({params, searchParams}: PageProps) {
  const {bandId} = await params
  const {message} = await searchParams
  const flash = getDashboardFlash(message)
  const user = await requireUser()
  const supabase = await createClient()
  const role = await getMembershipRole(supabase, bandId, user.id)

  if (!role) {
    notFound()
  }

  const {data: bandRow, error} = await supabase
    .from('bands')
    .select('id, slug, name, sanity_document_id, status, created_by, created_at, updated_at')
    .eq('id', bandId)
    .maybeSingle()

  if (error || !bandRow) {
    notFound()
  }

  const typedBandRow = bandRow as SupabaseBand
  const documentId = resolveBandDocumentId(typedBandRow)
  const sanityBand =
    (await getBandByDocumentId(documentId).catch(() => null)) ||
    (await getBandByBandId(typedBandRow.id).catch(() => null))
  const publicBandHref = isBandPublic(typedBandRow.status) ? `/bandas/${typedBandRow.slug}` : null
  let teamMembers: BandMemberSummary[] = []
  let pendingInvites: BandInviteSummary[] = []

  if (canManageBand(role)) {
    try {
      const admin = createAdminClient()
      const {data: membershipRows} = await admin
        .from('band_memberships')
        .select('band_id, user_id, role, created_at')
        .eq('band_id', bandId)
        .order('created_at', {ascending: true})

      const rawMemberships = (membershipRows || []) as Array<{
        band_id: string
        user_id: string
        role: BandMemberSummary['role']
        created_at: string
      }>

      if (rawMemberships.length > 0) {
        const userIds = rawMemberships.map((membership) => membership.user_id)
        const {data: profileRows} = await admin
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds)

        const profileMap = new Map(
          ((profileRows || []) as Array<NonNullable<BandMemberSummary['profile']>>).map((profile) => [
            profile.id,
            profile,
          ])
        )

        teamMembers = rawMemberships.map((membership) => ({
          bandId: membership.band_id,
          userId: membership.user_id,
          role: membership.role,
          createdAt: membership.created_at,
          profile: profileMap.get(membership.user_id) || null,
        }))
      }

      const {data: inviteRows} = await admin
        .from('band_invites')
        .select('id, band_id, email, role, token, expires_at, accepted_at, created_at')
        .eq('band_id', bandId)
        .is('accepted_at', null)
        .order('created_at', {ascending: false})

      pendingInvites = ((inviteRows || []) as Array<{
        id: string
        band_id: string
        email: string
        role: BandInviteSummary['role']
        token: string
        expires_at: string
        accepted_at: string | null
        created_at: string
      }>).map((invite) => ({
        id: invite.id,
        bandId: invite.band_id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expires_at,
        acceptedAt: invite.accepted_at,
        createdAt: invite.created_at,
      }))
    } catch {
      teamMembers = []
      pendingInvites = []
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Editor privado</p>
          <h1 className="dashboard-title">{typedBandRow.name}</h1>
          <div className="pill-row">
            <span className={`pill pill--${getBandStatusTone(typedBandRow.status)}`}>
              {getBandStatusLabel(typedBandRow.status)}
            </span>
            <span className={`pill pill--${publicBandHref ? 'success' : 'muted'}`}>
              {getBandVisibilityLabel(typedBandRow.status)}
            </span>
          </div>
          <p className="muted">
            Los cambios se validan en servidor, se sincronizan con Sanity y se revalida la pagina
            publica.
          </p>
          <p className="muted">{getBandVisibilityMessage(typedBandRow.status)}</p>
        </div>
        <div className="row-actions">
          {publicBandHref ? (
            <Link className="button" href={publicBandHref}>
              Ver publica
            </Link>
          ) : null}
          <Link className="button" href="/dashboard">
            Volver
          </Link>
        </div>
      </div>

      {flash ? <div className={`status status--${flash.tone}`}>{flash.message}</div> : null}

      {!canEditBand(role) ? (
        <div className="status status--warning">
          Tu rol actual es `{role}`. Podes ver esta banda, pero no editarla.
        </div>
      ) : (
        <BandEditorForm
          bandId={typedBandRow.id}
          initialValues={createInitialValues(typedBandRow, sanityBand)}
          initialImages={createInitialImages(sanityBand)}
          initialServerSavedAt={sanityBand?.lastSyncedAt || typedBandRow.updated_at}
        />
      )}

      {canManageBand(role) ? (
        <BandTeamPanel
          bandId={typedBandRow.id}
          currentUserId={user.id}
          managerRole={role as NonNullable<typeof role>}
          members={teamMembers}
          invites={pendingInvites}
        />
      ) : null}
    </>
  )
}

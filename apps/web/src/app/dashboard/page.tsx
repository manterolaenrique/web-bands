import Link from 'next/link'

import {createBand} from '@/app/dashboard/actions'
import {PendingInvitesPanel} from '@/components/dashboard/PendingInvitesPanel'
import {
  getBandStatusLabel,
  getBandStatusTone,
  getBandVisibilityLabel,
  getBandVisibilityMessage,
  isBandPublic,
} from '@/lib/bands/publication'
import {getDashboardFlash} from '@/lib/dashboard/messages'
import {isSupabaseConfigured} from '@/lib/env'
import {requireUser} from '@/lib/auth/session'
import {createAdminClient} from '@/lib/supabase/admin'
import {createClient} from '@/lib/supabase/server'
import {normalizeInviteEmail} from '@/lib/bands/members'
import type {BandInviteSummary, SupabaseBand} from '@/types/band'

type MembershipRow = {
  role: string
  bands:
    | {
        id: string
        name: string
        slug: string
        status: string
        sanity_document_id: string | null
        updated_at: string
      }
    | {
        id: string
        name: string
        slug: string
        status: string
        sanity_document_id: string | null
        updated_at: string
      }[]
    | null
}

type DashboardPageProps = {
  searchParams: Promise<{
    message?: string
  }>
}

function getBandFromMembership(row: MembershipRow) {
  return Array.isArray(row.bands) ? row.bands[0] : row.bands
}

export default async function DashboardPage({searchParams}: DashboardPageProps) {
  const {message} = await searchParams
  const flash = getDashboardFlash(message)

  if (!isSupabaseConfigured()) {
    return (
      <div className="setup-card">
        <p className="eyebrow">Setup pendiente</p>
        <h1 className="dashboard-title">Configura Supabase</h1>
        <p className="muted">
          La app ya esta preparada para Auth, RLS y memberships. Crea el proyecto Supabase,
          corre las migraciones y agrega las variables de entorno.
        </p>
      </div>
    )
  }

  const user = await requireUser()
  const supabase = await createClient()
  const {data, error} = await supabase
    .from('band_memberships')
    .select('role, bands(id, name, slug, status, sanity_document_id, updated_at)')
    .eq('user_id', user.id)
    .order('created_at', {ascending: true})

  const memberships = (data || []) as MembershipRow[]
  let pendingInvites: BandInviteSummary[] = []

  if (user.email) {
    try {
      const admin = createAdminClient()
      const normalizedEmail = normalizeInviteEmail(user.email)
      const {data: inviteRows} = await admin
        .from('band_invites')
        .select('id, band_id, email, role, token, expires_at, accepted_at, created_at')
        .eq('email', normalizedEmail)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', {ascending: false})

      const rawInvites = (inviteRows || []) as Array<{
        id: string
        band_id: string
        email: string
        role: BandInviteSummary['role']
        token: string
        expires_at: string
        accepted_at: string | null
        created_at: string
      }>

      if (rawInvites.length > 0) {
        const bandIds = Array.from(new Set(rawInvites.map((invite) => invite.band_id)))
        const {data: bandRows} = await admin
          .from('bands')
          .select('id, name, slug, status')
          .in('id', bandIds)

        const bandMap = new Map(
          ((bandRows || []) as Array<Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status'>>).map((band) => [
            band.id,
            band,
          ])
        )

        pendingInvites = rawInvites.map((invite) => ({
          id: invite.id,
          bandId: invite.band_id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          expiresAt: invite.expires_at,
          acceptedAt: invite.accepted_at,
          createdAt: invite.created_at,
          band: bandMap.get(invite.band_id),
        }))
      }
    } catch {
      pendingInvites = []
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="dashboard-title">Mis bandas</h1>
          <p className="muted">{user.email}</p>
        </div>
      </div>

      {flash ? <div className={`status status--${flash.tone}`}>{flash.message}</div> : null}

      {error ? (
        <div className="status status--error">
          No se pudieron cargar las bandas. Revisa las politicas RLS y las migraciones.
        </div>
      ) : null}

      <PendingInvitesPanel invites={pendingInvites} />

      {!error && memberships.length === 0 ? (
        <div className="empty-state">
          <h2>Todavia no tenes bandas asignadas</h2>
          <p className="muted">
            Crea tu primera banda para empezar a editar el contenido desde el dashboard V2.
          </p>
          <form action={createBand} className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-label">Nombre de la banda</span>
              <input className="form-input" name="name" placeholder="Ej: Mi Banda" required minLength={2} />
            </label>
            <div className="row-actions form-field--full">
              <button className="button button--primary" type="submit">
                Crear primera banda
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="band-grid">
          {memberships.map((membership) => {
            const band = getBandFromMembership(membership)
            if (!band) return null

            const publicBandHref = isBandPublic(band.status) ? `/bandas/${band.slug}` : null

            return (
              <article className="dashboard-card" key={band.id}>
                <div className="pill-row">
                  <span className="pill">{membership.role}</span>
                  <span className={`pill pill--${getBandStatusTone(band.status)}`}>
                    {getBandStatusLabel(band.status)}
                  </span>
                  <span className={`pill pill--${publicBandHref ? 'success' : 'muted'}`}>
                    {getBandVisibilityLabel(band.status)}
                  </span>
                </div>
                <h2>{band.name}</h2>
                <p className="muted">/{band.slug}</p>
                <p className="muted">{getBandVisibilityMessage(band.status)}</p>
                <div className="row-actions">
                  <Link href={`/dashboard/bands/${band.id}`} className="button button--primary">
                    Editar
                  </Link>
                  {publicBandHref ? (
                    <Link href={publicBandHref} className="button">
                      Ver publica
                    </Link>
                  ) : (
                    <span className="button button--disabled" aria-disabled="true">
                      No publica todavia
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

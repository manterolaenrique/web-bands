import type {BandEditorValues, BandEditorImages} from './editor-dto'
import type {BandInviteSummary, BandMemberRole, BandMemberSummary, PublicBand, SupabaseBand} from './types'

export type DashboardBandSummary = {
  role: BandMemberRole
  band: Pick<SupabaseBand, 'id' | 'name' | 'slug' | 'status' | 'sanity_document_id' | 'updated_at'>
  publicBandHref: string | null
}

export type DashboardBandsData = {
  memberships: DashboardBandSummary[]
  pendingInvites: BandInviteSummary[]
  loadError: boolean
}

export type BandEditorPayload = {
  role: BandMemberRole
  band: SupabaseBand
  canEdit: boolean
  canManage: boolean
  publicBandHref: string | null
  teamMembers: BandMemberSummary[]
  pendingInvites: BandInviteSummary[]
  initialValues: BandEditorValues
  initialImages: BandEditorImages
  previewBandBase: PublicBand | null
  initialServerSavedAt: string | null
}

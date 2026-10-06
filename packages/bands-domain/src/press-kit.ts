import {z} from 'zod'

import type {BandWorkspaceSummary} from './demos'
import type {BandInternalKit, BandMemberRole, SupabaseBand} from './types'

const requiredTrimmedString = (min: number, max: number) => z.string().trim().min(min).max(max)

export const BAND_PRIVATE_ASSET_KINDS = ['logo'] as const
export const PRESS_KIT_SHARE_PRESETS = ['1h', '24h', '7d'] as const

export type BandPrivateAssetKind = (typeof BAND_PRIVATE_ASSET_KINDS)[number]
export type PressKitSharePreset = (typeof PRESS_KIT_SHARE_PRESETS)[number]

export type BandPrivateAsset = {
  id: string
  bandId: string
  kind: BandPrivateAssetKind
  label: string
  storageBucket: string
  storagePath: string
  originalFileName: string
  mimeType: string
  fileSizeBytes: number
  uploadedBy: string
  createdAt: string
  updatedAt: string
  previewUrl?: string | null
}

export type BandPressKitPayload = {
  role: BandMemberRole
  band: BandWorkspaceSummary
  canEdit: boolean
  canManage: boolean
  publicBandHref: string | null
  initialServerSavedAt: string | null
  internalKit: BandInternalKit
  assets: BandPrivateAsset[]
}

export type BandPrivateAssetShareLinkResponse = {
  ok: true
  share: {
    url: string
    expiresInSeconds: number
    preset: PressKitSharePreset
    fileName: string
  }
}

export const bandPressKitUpdateSchema = z.object({
  shortPitch: z.string().trim().max(2000).optional().or(z.literal('')),
  bioShort: z.string().trim().max(1200).optional().or(z.literal('')),
  bioLong: z.string().trim().max(6000).optional().or(z.literal('')),
  shareNotes: z.string().trim().max(3000).optional().or(z.literal('')),
  contactName: z.string().trim().max(2000).optional().or(z.literal('')),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  contactPhone: z.string().trim().max(2000).optional().or(z.literal('')),
  bookingNotes: z.string().trim().max(2000).optional().or(z.literal('')),
  keyLinks: z
    .array(
      z.object({
        _key: z.string().trim().min(1).max(120),
        label: requiredTrimmedString(2, 120),
        url: z.string().trim().url(),
        kind: z.enum(['press', 'demo', 'drive', 'instagram', 'spotify', 'youtube', 'other']),
      })
    )
    .default([]),
})

export const bandPrivateAssetUploadStartSchema = z.object({
  kind: z.enum(BAND_PRIVATE_ASSET_KINDS).default('logo'),
  label: requiredTrimmedString(2, 120),
  fileName: requiredTrimmedString(1, 255),
  mimeType: requiredTrimmedString(3, 120),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
})

export const bandPrivateAssetFinalizeSchema = z.object({
  kind: z.enum(BAND_PRIVATE_ASSET_KINDS).default('logo'),
  label: requiredTrimmedString(2, 120),
  upload: z.object({
    assetId: z.string().uuid(),
    storagePath: requiredTrimmedString(1, 1024),
    originalFileName: requiredTrimmedString(1, 255),
    mimeType: requiredTrimmedString(3, 120),
    fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
  }),
})

export const bandPrivateAssetShareSchema = z.object({
  preset: z.enum(PRESS_KIT_SHARE_PRESETS).default('24h'),
})

export type BandPressKitUpdateInput = z.infer<typeof bandPressKitUpdateSchema>
export type BandPrivateAssetUploadStartInput = z.infer<typeof bandPrivateAssetUploadStartSchema>
export type BandPrivateAssetFinalizeInput = z.infer<typeof bandPrivateAssetFinalizeSchema>
export type BandPrivateAssetShareInput = z.infer<typeof bandPrivateAssetShareSchema>

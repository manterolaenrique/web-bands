import {describe, expect, it} from 'vitest'

import {
  bandPrivateAssetFinalizeSchema,
  bandPrivateAssetUploadStartSchema,
  PRESS_KIT_LOGO_MAX_FILE_SIZE_BYTES,
  PRESS_KIT_RIDER_MAX_FILE_SIZE_BYTES,
} from './press-kit'

describe('private press kit asset schemas', () => {
  it('accepts PNG logos larger than the previous 5 MB limit', () => {
    const parsed = bandPrivateAssetUploadStartSchema.parse({
      kind: 'logo',
      label: 'Logo principal',
      fileName: 'logo.png',
      mimeType: 'image/png',
      fileSizeBytes: 12 * 1024 * 1024,
    })

    expect(parsed.fileSizeBytes).toBe(12 * 1024 * 1024)
  })

  it('returns a specific error when a logo exceeds 20 MB', () => {
    const result = bandPrivateAssetUploadStartSchema.safeParse({
      kind: 'logo',
      label: 'Logo principal',
      fileName: 'logo.png',
      mimeType: 'image/png',
      fileSizeBytes: PRESS_KIT_LOGO_MAX_FILE_SIZE_BYTES + 1,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['fileSizeBytes'])
      expect(result.error.issues[0]?.message).toContain('20 MB')
    }
  })

  it('accepts a technical rider PDF and validates its finalize payload', () => {
    const parsed = bandPrivateAssetFinalizeSchema.parse({
      kind: 'technical_rider',
      label: 'Rider tecnico',
      upload: {
        assetId: '00000000-0000-4000-8000-000000000002',
        storagePath: 'band/asset/rider.pdf',
        originalFileName: 'rider.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: PRESS_KIT_RIDER_MAX_FILE_SIZE_BYTES,
      },
    })

    expect(parsed.kind).toBe('technical_rider')
    expect(parsed.upload.mimeType).toBe('application/pdf')
  })

  it('rejects a PNG presented as a technical rider', () => {
    const result = bandPrivateAssetUploadStartSchema.safeParse({
      kind: 'technical_rider',
      label: 'Rider tecnico',
      fileName: 'rider.png',
      mimeType: 'image/png',
      fileSizeBytes: 1024,
    })

    expect(result.success).toBe(false)
  })
})

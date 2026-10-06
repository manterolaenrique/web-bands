import {
  bandPrivateAssetFinalizeSchema,
  bandPrivateAssetUploadStartSchema,
  bandSetlistItemCreateSchema,
  PRESS_KIT_LOGO_MAX_FILE_SIZE_BYTES,
} from '@web-bands/bands-domain'
import {describe, expect, it} from 'vitest'

describe('press kit and setlist domain contracts', () => {
  it('accepts a 12 MB PNG logo and rejects files over 20 MB with a useful error', () => {
    expect(
      bandPrivateAssetUploadStartSchema.safeParse({
        kind: 'logo',
        label: 'Logo principal',
        fileName: 'logo.png',
        mimeType: 'image/png',
        fileSizeBytes: 12 * 1024 * 1024,
      }).success
    ).toBe(true)

    const invalid = bandPrivateAssetUploadStartSchema.safeParse({
      kind: 'logo',
      label: 'Logo principal',
      fileName: 'logo.png',
      mimeType: 'image/png',
      fileSizeBytes: PRESS_KIT_LOGO_MAX_FILE_SIZE_BYTES + 1,
    })

    expect(invalid.success).toBe(false)
    if (!invalid.success) {
      expect(invalid.error.issues[0]?.message).toContain('20 MB')
    }
  })

  it('accepts a technical rider PDF finalize payload', () => {
    const result = bandPrivateAssetFinalizeSchema.safeParse({
      kind: 'technical_rider',
      label: 'Rider tecnico',
      upload: {
        assetId: '00000000-0000-4000-8000-000000000002',
        storagePath: 'band/asset/rider.pdf',
        originalFileName: 'rider.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a zero-based insertion index for a setlist song', () => {
    const result = bandSetlistItemCreateSchema.parse({
      itemType: 'song',
      songId: '00000000-0000-4000-8000-000000000003',
      insertIndex: 0,
    })

    expect(result.insertIndex).toBe(0)
  })
})

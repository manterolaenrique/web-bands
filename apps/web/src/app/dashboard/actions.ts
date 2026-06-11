'use server'

import {redirect} from 'next/navigation'

import {requireUser} from '@/lib/auth/session'
import {createBandForUser} from '@/server/bands/create-band'
import {BandServiceError} from '@/server/bands/service-error'

export async function createBand(formData: FormData) {
  const user = await requireUser()
  const rawName = String(formData.get('name') || '').trim()

  try {
    const result = await createBandForUser(user.id, rawName)
    redirect(`/dashboard/bands/${result.band.id}`)
  } catch (error) {
    if (error instanceof BandServiceError) {
      const code = typeof error.details === 'object' && error.details && 'code' in error.details
        ? String((error.details as {code?: string}).code || 'band-create-error')
        : 'band-create-error'
      redirect(`/dashboard?message=${code}`)
    }

    throw error
  }
}

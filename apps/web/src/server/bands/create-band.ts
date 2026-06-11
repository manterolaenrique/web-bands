import {slugifyBandName} from '@/lib/bands/slug'
import {createClient} from '@/lib/supabase/server'

import {BandServiceError} from './service-error'

export type CreateBandResult = {
  band: {
    id: string
    name: string
    slug: string
    status: string
  }
}

export async function createBandForUser(userId: string, rawName: string): Promise<CreateBandResult> {
  const name = rawName.trim()

  if (name.length < 2 || name.length > 120) {
    throw new BandServiceError('El nombre debe tener entre 2 y 120 caracteres.', 400, {
      code: 'band-name-invalid',
    })
  }

  const baseSlug = slugifyBandName(name)
  if (!baseSlug) {
    throw new BandServiceError('No se pudo generar un slug valido para la banda.', 400, {
      code: 'band-slug-invalid',
    })
  }

  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
  const supabase = await createClient()
  const {data: band, error: bandError} = await supabase
    .from('bands')
    .insert({
      name,
      slug,
      status: 'draft',
      created_by: userId,
    })
    .select('id, name, slug, status')
    .single()

  if (bandError || !band) {
    throw new BandServiceError('No se pudo crear la banda.', 500, {
      code: 'band-create-error',
    })
  }

  const {error: membershipError} = await supabase.from('band_memberships').insert({
    band_id: band.id,
    user_id: userId,
    role: 'owner',
  })

  if (membershipError) {
    throw new BandServiceError('No se pudo asignar tu acceso a la banda.', 500, {
      code: 'membership-create-error',
    })
  }

  return {
    band,
  }
}

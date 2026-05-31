'use server'

import {redirect} from 'next/navigation'

import {requireUser} from '@/lib/auth/session'
import {slugifyBandName} from '@/lib/bands/slug'
import {createClient} from '@/lib/supabase/server'

export async function createBand(formData: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const rawName = String(formData.get('name') || '').trim()

  if (rawName.length < 2 || rawName.length > 120) {
    redirect('/dashboard?message=band-name-invalid')
  }

  const baseSlug = slugifyBandName(rawName)
  if (!baseSlug) {
    redirect('/dashboard?message=band-slug-invalid')
  }

  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`

  const {data: band, error: bandError} = await supabase
    .from('bands')
    .insert({
      name: rawName,
      slug,
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (bandError || !band) {
    redirect('/dashboard?message=band-create-error')
  }

  const {error: membershipError} = await supabase.from('band_memberships').insert({
    band_id: band.id,
    user_id: user.id,
    role: 'owner',
  })

  if (membershipError) {
    redirect('/dashboard?message=membership-create-error')
  }

  redirect(`/dashboard/bands/${band.id}`)
}

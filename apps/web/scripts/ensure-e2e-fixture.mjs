import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {randomUUID} from 'node:crypto'

import {createClient as createSanityClient} from '@sanity/client'
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const envPath = join(appRoot, '.env.local')
const generatedDir = join(appRoot, 'e2e', '.generated')
const generatedFixturePath = join(generatedDir, 'fixture.json')
const generatedStatusPath = join(generatedDir, 'status.json')

function loadEnvFile(pathname) {
  const raw = readFileSync(pathname, 'utf8')

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
    if (!match) continue

    let value = match[2].trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[match[1]] ??= value
  }
}

function requiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }

  return value
}

loadEnvFile(envPath)

const fixture = {
  email: process.env.E2E_TEST_EMAIL || 'codex-e2e@webbands.dev',
  password: process.env.E2E_TEST_PASSWORD || `Codex!${randomUUID().replace(/-/g, '').slice(0, 18)}`,
  displayName: 'Codex E2E',
  invitee: {
    email: process.env.E2E_INVITEE_EMAIL || 'codex-invitee@webbands.dev',
    password: process.env.E2E_INVITEE_PASSWORD || `Codex!${randomUUID().replace(/-/g, '').slice(0, 18)}`,
    displayName: 'Codex Invitee',
  },
  band: {
    name: 'Codex E2E Band',
    slug: 'codex-e2e-band',
    heroTitle: 'Codex E2E Hero',
    heroSubtitle: 'Fixture publica para pruebas automatizadas',
    heroDescription: 'Contenido publico estable para verificar el flujo completo del dashboard.',
    aboutTitle: 'Quienes Somos',
    aboutContent:
      'Esta banda de prueba existe para validar login, permisos, guardado server-side y lectura publica.',
  },
}

const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const manualFixture = {
  email: process.env.E2E_TEST_EMAIL,
  password: process.env.E2E_TEST_PASSWORD,
  invitee: {
    email: process.env.E2E_INVITEE_EMAIL,
    password: process.env.E2E_INVITEE_PASSWORD,
  },
  band: {
    id: process.env.E2E_TEST_BAND_ID,
    name: process.env.E2E_TEST_BAND_NAME || 'E2E Band',
    slug: process.env.E2E_TEST_BAND_SLUG,
    documentId: process.env.E2E_TEST_BAND_ID ? `banda-${process.env.E2E_TEST_BAND_ID}` : null,
  },
}

const hasManualFixture =
  Boolean(manualFixture.email) &&
  Boolean(manualFixture.password) &&
  Boolean(manualFixture.band.id) &&
  Boolean(manualFixture.band.slug)

const supabase = supabaseSecretKey
  ? createSupabaseClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null

async function findUserByEmail(email) {
  if (!supabase) {
    throw new Error('Missing Supabase admin secret. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  }

  let page = 1

  while (page < 20) {
    const {data, error} = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) throw error

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase())
    if (user) return user

    if (data.users.length < 200) return null
    page += 1
  }

  return null
}

async function ensureUser() {
  return ensureManagedUser({
    email: fixture.email,
    password: fixture.password,
    displayName: fixture.displayName,
  })
}

async function ensureInviteeUser() {
  return ensureManagedUser({
    email: fixture.invitee.email,
    password: fixture.invitee.password,
    displayName: fixture.invitee.displayName,
  })
}

async function ensureManagedUser({email, password, displayName}) {
  const existing = await findUserByEmail(email)

  if (!existing) {
    const {data, error} = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    })

    if (error || !data.user) {
      throw error || new Error('Supabase did not return the created user.')
    }

    return data.user
  }

  const {data, error} = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existing.user_metadata || {}),
      display_name: displayName,
    },
  })

  if (error || !data.user) {
    throw error || new Error('Supabase could not update the E2E user.')
  }

  return data.user
}

async function ensureBand(userId) {
  if (!supabase) {
    throw new Error('Missing Supabase admin secret. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const {data: existingBand, error: bandLookupError} = await supabase
    .from('bands')
    .select('id, slug, sanity_document_id')
    .eq('slug', fixture.band.slug)
    .maybeSingle()

  if (bandLookupError) throw bandLookupError

  let bandId = existingBand?.id

  if (!bandId) {
    const {data: insertedBand, error: insertError} = await supabase
      .from('bands')
      .insert({
        name: fixture.band.name,
        slug: fixture.band.slug,
        status: 'published',
        created_by: userId,
      })
      .select('id')
      .single()

    if (insertError || !insertedBand) {
      throw insertError || new Error('Supabase could not create the E2E band.')
    }

    bandId = insertedBand.id
  }

  const documentId = `banda-${bandId}`

  const {error: bandUpdateError} = await supabase
    .from('bands')
    .update({
      name: fixture.band.name,
      slug: fixture.band.slug,
      status: 'published',
      created_by: userId,
      sanity_document_id: documentId,
    })
    .eq('id', bandId)

  if (bandUpdateError) throw bandUpdateError

  const {error: membershipError} = await supabase.from('band_memberships').upsert(
    {
      band_id: bandId,
      user_id: userId,
      role: 'owner',
    },
    {
      onConflict: 'band_id,user_id',
    }
  )

  if (membershipError) throw membershipError

  return {bandId, documentId}
}

async function ensureProfile(userId) {
  if (!supabase) {
    throw new Error('Missing Supabase admin secret. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const {error} = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: fixture.email,
      display_name: fixture.displayName,
    },
    {
      onConflict: 'id',
    }
  )

  if (error) throw error
}

async function ensureInviteeProfile(userId) {
  if (!supabase) {
    throw new Error('Missing Supabase admin secret. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const {error} = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: fixture.invitee.email,
      display_name: fixture.invitee.displayName,
    },
    {
      onConflict: 'id',
    }
  )

  if (error) throw error
}

async function resetInviteeBandState({bandId, inviteeUserId, inviteeEmail}) {
  if (!supabase) {
    throw new Error('Missing Supabase admin secret. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const {error: membershipDeleteError} = await supabase
    .from('band_memberships')
    .delete()
    .eq('band_id', bandId)
    .eq('user_id', inviteeUserId)

  if (membershipDeleteError) throw membershipDeleteError

  const {error: inviteDeleteError} = await supabase
    .from('band_invites')
    .delete()
    .eq('band_id', bandId)
    .eq('email', inviteeEmail)

  if (inviteDeleteError) throw inviteDeleteError
}

async function ensureSanityDocument({bandId, documentId, userId}) {
  const sanity = createSanityClient({
    projectId: requiredEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: requiredEnv('NEXT_PUBLIC_SANITY_DATASET'),
    apiVersion: requiredEnv('NEXT_PUBLIC_SANITY_API_VERSION'),
    token: requiredEnv('SANITY_API_WRITE_TOKEN'),
    useCdn: false,
  })

  await sanity.createOrReplace({
    _id: documentId,
    _type: 'banda',
    bandId,
    nombre: fixture.band.name,
    slug: {
      _type: 'slug',
      current: fixture.band.slug,
    },
    status: 'published',
    visibility: 'public',
    genero: 'Test Fixture',
    colores: {
      primario: '#111827',
      secundario: '#6b7280',
      secundario_claro: '#eef2f6',
      acento: '#155eef',
    },
    hero: {
      titulo: fixture.band.heroTitle,
      subtitulo: fixture.band.heroSubtitle,
      descripcion: fixture.band.heroDescription,
    },
    about: {
      titulo: fixture.band.aboutTitle,
      contenido: fixture.band.aboutContent,
    },
    contacto: {
      email: fixture.email,
      ubicacion: 'E2E Fixture',
      redes: {},
    },
    seo: {
      titulo_seo: fixture.band.heroTitle,
      descripcion_seo: fixture.band.heroDescription,
    },
    updatedBy: userId,
    lastSyncedAt: new Date().toISOString(),
  })
}

try {
  let resolvedFixture

  if (hasManualFixture) {
    let manualInvitee = null

    if (manualFixture.invitee.email && manualFixture.invitee.password) {
      manualInvitee = {
        email: manualFixture.invitee.email,
        password: manualFixture.invitee.password,
      }
    } else if (supabase) {
      const inviteeUser = await ensureInviteeUser()
      await ensureInviteeProfile(inviteeUser.id)
      manualInvitee = {
        email: fixture.invitee.email,
        password: fixture.invitee.password,
      }
    }

    resolvedFixture = {
      email: manualFixture.email,
      password: manualFixture.password,
      invitee: manualInvitee,
      band: {
        id: manualFixture.band.id,
        name: manualFixture.band.name,
        slug: manualFixture.band.slug,
        documentId: manualFixture.band.documentId,
      },
    }
  } else {
    if (!supabase) {
      throw new Error(
        'To run authenticated E2E tests, either add SUPABASE_SERVICE_ROLE_KEY or configure E2E_TEST_EMAIL, E2E_TEST_PASSWORD, E2E_TEST_BAND_ID and E2E_TEST_BAND_SLUG in .env.local.'
      )
    }

    let user
    let inviteeUser

    try {
      user = await ensureUser()
      inviteeUser = await ensureInviteeUser()
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid API key')) {
        throw new Error(
          'Supabase admin auth rejected the configured secret. Use SUPABASE_SERVICE_ROLE_KEY or provide E2E_TEST_EMAIL, E2E_TEST_PASSWORD, E2E_TEST_BAND_ID and E2E_TEST_BAND_SLUG to reuse an existing account.'
        )
      }

      throw error
    }

    await ensureProfile(user.id)
    await ensureInviteeProfile(inviteeUser.id)
    const {bandId, documentId} = await ensureBand(user.id)
    await resetInviteeBandState({
      bandId,
      inviteeUserId: inviteeUser.id,
      inviteeEmail: fixture.invitee.email,
    })
    await ensureSanityDocument({bandId, documentId, userId: user.id})

    resolvedFixture = {
      email: fixture.email,
      password: fixture.password,
      invitee: {
        email: fixture.invitee.email,
        password: fixture.invitee.password,
      },
      band: {
        id: bandId,
        name: fixture.band.name,
        slug: fixture.band.slug,
        documentId,
      },
    }
  }

  mkdirSync(generatedDir, {recursive: true})
  writeFileSync(generatedFixturePath, JSON.stringify(resolvedFixture, null, 2))
  writeFileSync(
    generatedStatusPath,
    JSON.stringify(
      {
        ready: true,
        mode: hasManualFixture ? 'manual' : 'managed',
      },
      null,
      2
    )
  )

  console.log(
    JSON.stringify(
      {
        ok: true,
        generatedFixturePath,
        email: resolvedFixture.email,
        bandId: resolvedFixture.band.id,
        bandSlug: resolvedFixture.band.slug,
        mode: hasManualFixture ? 'manual' : 'managed',
      },
      null,
      2
    )
  )
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error)
  const canSkipAuthFixture =
    reason.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    reason.includes('Supabase admin auth rejected the configured secret')

  if (!canSkipAuthFixture) {
    console.error(reason)
    process.exitCode = 1
  } else {
    mkdirSync(generatedDir, {recursive: true})

    if (existsSync(generatedFixturePath)) {
      rmSync(generatedFixturePath, {force: true})
    }

    writeFileSync(
      generatedStatusPath,
      JSON.stringify(
        {
          ready: false,
          reason,
        },
        null,
        2
      )
    )

    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          reason,
        },
        null,
        2
      )
    )
  }
}

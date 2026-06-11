#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const argv = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.split('=')
  return [k.replace(/^--/, ''), v ?? true]
}))

const OUT = argv.output || 'reports/prod-users.json'
const PER_PAGE = parseInt(argv['per-page'] || '100', 10)

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function count(table, filterField, value) {
  const res = await supabase.from(table).select(filterField, { count: 'exact', head: false }).eq(filterField, value).limit(1)
  if (res.error) return 0
  return res.count ?? (Array.isArray(res.data) ? res.data.length : 0)
}

async function profileExists(userId) {
  const res = await supabase.from('profiles').select('id').eq('id', userId).limit(1)
  return !!(res.data && res.data.length > 0)
}

async function gatherAllUsers() {
  let page = 1
  const all = []
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    page += 1
  }
  return all
}

function ensureOutDir(file) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function main() {
  console.log('Generando reporte de usuarios...')
  const users = await gatherAllUsers()
  console.log(`Usuarios detectados: ${users.length}`)
  const report = []
  for (const u of users) {
    const id = u.id
    const email = u.email || null
    const bands_count = await count('bands', 'created_by', id)
    const memberships_count = await count('band_memberships', 'user_id', id)
    const invites_count = await count('band_invites', 'created_by', id)
    const audit_count = await count('audit_logs', 'actor_user_id', id)
    const has_profile = await profileExists(id)
    report.push({ id, email, created_at: u.created_at, bands_count, memberships_count, invites_count, audit_count, has_profile })
  }
  ensureOutDir(OUT)
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log('Reporte guardado en', OUT)
  const csvOut = OUT.replace(/\.json$/i, '.csv')
  const header = 'id,email,created_at,bands_count,memberships_count,invites_count,audit_count,has_profile\n'
  const rows = report.map(r => `${r.id},${r.email||''},${r.created_at||''},${r.bands_count},${r.memberships_count},${r.invites_count},${r.audit_count},${r.has_profile}`).join('\n')
  fs.writeFileSync(csvOut, header + rows)
  console.log('CSV guardado en', csvOut)
}

main().catch(err => {
  console.error('Error:', err.message || err)
  process.exit(1)
})

import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

export type E2EFixture = {
  email: string
  password: string
  invitee?: {
    email: string
    password: string
  } | null
  band: {
    id: string
    name: string
    slug: string
    documentId: string
  }
}

export function loadE2EFixture() {
  const fixturePath = join(process.cwd(), 'e2e', '.generated', 'fixture.json')
  const statusPath = join(process.cwd(), 'e2e', '.generated', 'status.json')

  if (!existsSync(fixturePath)) {
    const reason = existsSync(statusPath)
      ? JSON.parse(readFileSync(statusPath, 'utf8')).reason
      : `Missing E2E fixture file at ${fixturePath}. Run npm run test:e2e:setup first.`

    return {
      ready: false,
      reason,
    } as const
  }

  return {
    ready: true,
    fixture: JSON.parse(readFileSync(fixturePath, 'utf8')) as E2EFixture,
  } as const
}

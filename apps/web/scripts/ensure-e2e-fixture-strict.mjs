import {existsSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const statusPath = join(appRoot, 'e2e', '.generated', 'status.json')

await import('./ensure-e2e-fixture.mjs')

if (!existsSync(statusPath)) {
  console.error('Authenticated E2E fixture status file was not created.')
  process.exitCode = 1
}

if (existsSync(statusPath)) {
  const status = JSON.parse(readFileSync(statusPath, 'utf8'))

  if (!status.ready) {
    console.error(status.reason || 'Authenticated E2E fixture is not ready.')
    process.exitCode = 1
  }
}

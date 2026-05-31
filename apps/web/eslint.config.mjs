import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import {defineConfig, globalIgnores} from 'eslint/config'

export default defineConfig([
  globalIgnores(['.next/**', 'next-env.d.ts']),
  ...nextVitals,
  ...nextTs,
])

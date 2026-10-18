// Pulls the admin-edited website content from your Google Sheet (through the Apps Script web app) at BUILD time.
//   node scripts/fetch-content.mjs            → writes src/content/overrides.json + public/content-version.json
//   node scripts/fetch-content.mjs --check    → prints changed=true|false (used by the auto-publish workflow)
// Only the public web-app URL is needed; the "content" action is public-readable by design (it is the site's own copy).
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { mirrorMedia } from './lib/mirror-media.mjs'

for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const API = (process.env.NEXT_PUBLIC_API_URL || '').trim()
const REQUIRED = process.env.REQUIRE_BACKEND === 'true'
const check = process.argv.includes('--check')

const fail = (msg) => { console.error(`✖ ${msg}`); process.exit(1) }
const warn = (msg) => console.warn(`! ${msg}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** GET <web app>?action=…  — retried, because Apps Script now and then answers with a transient error page. */
async function api(action) {
  let last
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(`${API}${API.includes('?') ? '&' : '?'}action=${action}`, { redirect: 'follow' })
      const data = await r.json()
      if (data && data.ok === true) return data
      last = new Error(data && data.error ? data.error : `unexpected answer (HTTP ${r.status})`)
    } catch (e) { last = e }
    await sleep(1500 * (i + 1))
  }
  throw last
}

if (check) {
  let changed = 'true', reason = ''
  try {
    if (!API) throw new Error('NEXT_PUBLIC_API_URL missing')
    const db = (await api('version')).version
    const site = (process.env.SITE_URL || '').replace(/\/+$/, '')
    if (!site) { reason = 'SITE_URL not set → always build' }
    else {
      const r = await fetch(`${site}/content-version.json?ts=${Date.now()}`)
      const live = r.ok ? (await r.json()).version : null
      changed = live === db ? 'false' : 'true'
      reason = `sheet=${db} · live=${live}`
    }
  } catch (e) { reason = `check failed (${e.message}) → build to be safe` }
  console.log(`changed=${changed}  (${reason})`)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`)
  process.exit(0)
}

mkdirSync('src/content', { recursive: true })
if (!existsSync('src/content/overrides.json')) writeFileSync('src/content/overrides.json', '{}\n')

if (!API) {
  if (REQUIRED) fail('NEXT_PUBLIC_API_URL is not set — refusing to build a site without its content.')
  warn('NEXT_PUBLIC_API_URL not set — building with the default content from src/config/profile.ts')
  writeFileSync('public/content-version.json', JSON.stringify({ version: 'none', builtAt: new Date().toISOString() }))
  process.exit(0)
}

try {
  const data = await api('content')
  let overrides = Object.fromEntries(data.items.map((x) => [x.key, x.value]))
  const m = await mirrorMedia(overrides)
  overrides = m.overrides
  if (m.mirrored || m.failed.length) console.log(`  pictures copied onto the site: ${m.mirrored}${m.failed.length ? ` · kept on Google Drive: ${m.failed.length} (${m.failed.map((f) => f.reason).join('; ')})` : ''}`)
  writeFileSync('src/content/overrides.json', JSON.stringify(overrides, null, 2) + '\n')
  writeFileSync('public/content-version.json', JSON.stringify({ version: data.version, builtAt: new Date().toISOString() }))
  console.log(`✔ content pulled from Google Sheets: ${data.items.length} section(s) [${Object.keys(overrides).join(', ') || 'none — using defaults'}]`)
} catch (e) {
  if (REQUIRED) fail(`could not fetch content: ${e.message}`)
  warn(`could not fetch content (${e.message}) — using defaults / last overrides.json`)
  writeFileSync('public/content-version.json', JSON.stringify({ version: 'none', builtAt: new Date().toISOString() }))
}

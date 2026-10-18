// The REAL website client code (api-client, admin-api, content-store, media) against the REAL Code.gs over HTTP.
import http from 'node:http'
// @ts-expect-error plain .mjs helper
import { startFakeGas } from './apps-script/server.mjs'

const gas = await startFakeGas(0, { now: Date.now() })
process.env.NEXT_PUBLIC_API_URL = gas.url
// minimal browser globals used by admin-api
const mem = new Map<string, string>()
Object.assign(globalThis, { window: globalThis, localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) } })

const { apiFetch, fetchContentVersion } = await import('../src/lib/api-client')
const A = await import('../src/lib/admin-api')
const { sheetsStore } = await import('../src/lib/content-store')
const M = await import('../src/lib/media')

let n = 0, bad = 0
const ok = (name: string, c: boolean, x: unknown = '') => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name} ${c ? '' : JSON.stringify(x)}`) }
const section = (t: string) => console.log(`\n== ${t} ==`)
const post = (path: string, body: unknown, method = 'POST') => apiFetch(path, { method, body: JSON.stringify(body) })
const w = gas.w

section('visitor forms through apiFetch (real HTTP, redirects, text/plain)')
{
  let r = await post('/api/contact', { name: 'Karim', email: 'karim@example.com', subject: 'Hi', message: 'A real message of enough length.' })
  ok('contact → 200 and a row in the sheet', r.ok && (await r.json()).ok === true && w.rows('messages').length === 1)
  r = await post('/api/contact', { name: 'K', email: 'bad', message: 'x' })
  const j = await r.json()
  ok('validation error → HTTP 400 with the server\'s message', r.status === 400 && j.error === 'Please enter your name', { s: r.status, j })
  for (let i = 0; i < 4; i++) r = await post('/api/contact', { name: 'Same Person', email: 'same@example.com', message: 'message number ' + i + ' padding' })
  ok('abuse limit → HTTP 429', r.status === 429, r.status)
  r = await post('/api/newsletter', { email: 'fan@example.com', source: 'footer' })
  ok('newsletter', r.ok && w.rows('subscribers').length === 1)
  r = await post('/api/faq-feedback', { slug: 'faq-pricing', helpful: true })
  ok('FAQ feedback', r.ok && w.rows('faq_feedback').length === 1)
  r = await apiFetch('/api/analytics', { method: 'POST', keepalive: false, body: JSON.stringify({ event: 'start_project', label: 'hero', path: '/' }) })
  ok('analytics', r.ok && w.rows('events').length === 1)
  r = await apiFetch('/api/nope')
  ok('unknown route → 404 (never reaches the server)', r.status === 404)
}

section('bookings')
{
  const sum = await (await apiFetch('/api/bookings?summary=1')).json()
  const day = Object.keys(sum.counts).find((d) => new Date(d + 'T00:00:00Z').getUTCDay() === 0)!   // a Sunday
  const slot = new Date(Date.parse(day + 'T00:00:00Z') + (11 * 60 - 360) * 60000).toISOString()
  ok('summary → { counts } for bookable days', typeof sum.counts === 'object' && Object.keys(sum.counts).length > 5)
  const b = { name: 'Nadia Islam', email: 'nadia@example.com', agenda: 'Discuss a forecasting project', slot, tzOffset: 360, tzName: 'Asia/Dhaka' }
  let r = await post('/api/bookings', b); const created = await r.json()
  ok('create booking → 200 + reference id', r.ok && /^[a-f0-9]{32}$/.test(created.id), created)
  r = await post('/api/bookings', { ...b, email: 'other@example.com' })
  ok('same slot → HTTP 409', r.status === 409)
  ok('taken list contains the slot', (await (await apiFetch(`/api/bookings?date=${day}`)).json()).taken.includes(slot))
  r = await post('/api/bookings', { ref: created.id, email: 'nadia@example.com', action: 'lookup' }, 'PUT')
  const lk = await r.json()
  ok('lookup (body "action" is carried as "verb")', r.ok && lk.status === 'proposed' && lk.slotUtc === slot, lk)
  r = await post('/api/bookings', { ref: created.id, email: 'nadia@example.com', action: 'cancel' }, 'PUT')
  ok('cancel', r.ok && (await r.json()).status === 'cancelled')
  r = await post('/api/bookings', { ref: created.id, email: 'wrong@example.com', action: 'lookup' }, 'PUT')
  ok('wrong e-mail → 404', r.status === 404)
}

section('project inquiry with attachments (multi-step upload + rollback)')
{
  const fields = { name: 'Rahim Uddin', email: 'rahim@example.com', serviceCategory: 'Data Analysis', projectTitle: 'Sales dashboard', description: 'We need a dashboard that shows weekly sales by region and product.', contactMethod: 'Email' }
  const form = (extra: [string, string | Blob, string?][] = [], o: Record<string, string> = {}) => { const fd = new FormData(); for (const [k, v] of Object.entries({ ...fields, ...o })) fd.set(k, v); for (const [k, v, f] of extra) { if (f) fd.append(k, v, f); else fd.append(k, v) } return fd }
  let r = await apiFetch('/api/inquiries', { method: 'POST', body: form() })
  ok('inquiry without files', r.ok && w.rows('inquiries').length === 1)
  const big = new Uint8Array(4 * 1024 * 1024).fill(65)
  r = await apiFetch('/api/inquiries', { method: 'POST', body: form([['files', new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' })], ['files', new File([big], 'big.pdf', { type: 'application/pdf' })]], { email: 'a2@example.com' }) })
  const withFiles = w.rows('inquiries').find((x: { email: string }) => x.email === 'a2@example.com')
  const att = JSON.parse(withFiles.attachments)
  ok('2 files (one 4 MB) uploaded to Drive and linked on the inquiry', r.ok && att.length === 2 && att[1].file_size === big.length && att.every((a: { url: string }) => /drive\.google\.com/.test(a.url)), att)
  ok('attachments are in the PRIVATE folder', [...w.files.values()].every((f: { sharing: string }) => f.sharing === 'PRIVATE'))
  const rows0 = w.rows('inquiries').length, trashed0 = w.log.trashed.length
  r = await apiFetch('/api/inquiries', { method: 'POST', body: form([['files', new File(['x'], 'ok.pdf', { type: 'application/pdf' })], ['files', new File(['MZ'], 'virus.exe', { type: 'application/octet-stream' })]], { email: 'a3@example.com' }) })
  ok('a rejected file → friendly 500 and the half-saved inquiry is rolled back (row + earlier file removed)', r.status === 500 && /attachments/.test((await r.json()).error) && w.rows('inquiries').length === rows0 && w.log.trashed.length === trashed0 + 1)
  const before = w.rows('inquiries').length
  r = await apiFetch('/api/inquiries', { method: 'POST', body: form([], { email: 'bot@example.com', website: 'http://spam' }) })
  ok('honeypot: success, nothing stored', r.ok && w.rows('inquiries').length === before)
  r = await apiFetch('/api/inquiries', { method: 'POST', body: JSON.stringify({}) })
  ok('non-FormData body → 400', r.status === 400)
}

section('admin sign-in, calls and session handling')
{
  let msg = ''
  try { await A.login('owner@example.com', 'wrong-password') } catch (e) { msg = (e as Error).message }
  ok('wrong password → error message, no session', msg === 'Invalid email or password.' && A.getSession() === null, msg)
  await A.login('OWNER@example.com', 'a-long-test-password-123')
  const s = A.getSession()!
  ok('sign-in stores a session (token, e-mail, expiry ≈ 12 h)', !!s && s.email === 'owner@example.com' && s.expiresAt > Date.now() + 11 * 3600e3, s)
  const dash = await A.adminCall('dashboard')
  ok('adminCall works with the stored token', dash.total_inquiries >= 2 && dash.subscribers === 1, dash)
  const rows = (await A.adminCall('list', { sheet: 'inquiries' })).rows
  ok('inquiries list carries attachments with Drive links', rows.some((r: { inquiry_attachments: unknown[] }) => r.inquiry_attachments.length === 2))
  let events = 0; const off = A.onSessionChange(() => events++)
  mem.set('admin.session', JSON.stringify({ ...s, token: s.token.slice(0, -3) + 'abc' }))
  let authErr: unknown; try { await A.adminCall('dashboard') } catch (e) { authErr = e }
  ok('a bad/expired token → AuthError, session cleared, UI is notified', authErr instanceof A.AuthError && A.getSession() === null && events === 1, authErr)
  off()
  mem.set('admin.session', JSON.stringify({ ...s, expiresAt: Date.now() - 1000 }))
  ok('an expired stored session is ignored', A.getSession() === null)
  let noSess: unknown; try { await A.adminCall('dashboard') } catch (e) { noSess = e }
  ok('without a session adminCall refuses locally (no network call)', noSess instanceof A.AuthError)
  await A.login('owner@example.com', 'a-long-test-password-123')
  A.logout(); ok('sign out clears it', A.getSession() === null)
  await A.login('owner@example.com', 'a-long-test-password-123')
}

section('content store + media library (real client code)')
{
  await sheetsStore.save('services', [{ id: 'a', title: 'First' }])
  await sheetsStore.save('services', [{ id: 'a', title: 'Second' }])
  ok('save → load roundtrip', JSON.stringify(await sheetsStore.load('services')) === JSON.stringify([{ id: 'a', title: 'Second' }]) && (await sheetsStore.load('nothing')) === null)
  const h = await sheetsStore.history('services')
  ok('history has the previous version', h.length === 1 && (h[0].value as { title: string }[])[0].title === 'First')
  ok('public version endpoint matches', (await fetchContentVersion()) === w.get({ action: 'version' }).version)
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const f = (b: Buffer, name: string) => new File([new Uint8Array(b)], name, { type: 'image/png' })
  const up = await M.uploadImage(f(PNG, 'Sales Chart.png'))
  ok('uploadImage → asset with a public Drive address', !up.duplicate && up.asset.url === `https://lh3.googleusercontent.com/d/${up.asset.id}` && M.assetUrl(up.asset) === up.asset.url, up)
  const dup = await M.uploadImage(f(PNG, 'renamed.png'))
  ok('same picture again → reported as duplicate, nothing new stored', dup.duplicate && dup.asset.id === up.asset.id && (await M.listAssets()).length === 1)
  await M.updateAssetMeta(up.asset.id, 'Chart', 'Weekly')
  ok('alt/caption saved', (await M.listAssets())[0].alt === 'Chart')
  await sheetsStore.save('projects', [{ image: up.asset.url }])
  ok('findUsage reports where a picture is used', JSON.stringify(await M.findUsage(up.asset)) === JSON.stringify([{ key: 'projects', count: 1 }]))
  const rep = await M.replaceImage(up.asset, f(Buffer.concat([PNG, Buffer.from('2')]), 'new.png'))
  ok('replaceImage → new asset; content that used the old one is rewired', rep.id !== up.asset.id && JSON.stringify(await sheetsStore.load('projects')).includes(rep.id) && !JSON.stringify(await sheetsStore.load('projects')).includes(up.asset.id))
  ok('pictures of the wrong type are refused before any upload', !!M.validateImageFile(new File(['x'], 'a.pdf', { type: 'application/pdf' })))
  await M.deleteAsset(rep); ok('deleteAsset', (await M.listAssets()).length === 0)
}

section('network failures')
{
  const html = http.createServer((_q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); s.end('<html>Quota exceeded</html>') })
  await new Promise<void>((r) => html.listen(0, '127.0.0.1', r))
  const { callApi } = await import('../src/lib/api-client')
  void callApi
  await gas.close(); html.close()
  let netErr = ''; try { await post('/api/contact', { name: 'Ab', email: 'a@b.co', message: 'hello hello hello' }) } catch (e) { netErr = (e as Error).message }
  ok('server unreachable → Error("network") (the forms show their "try again" message)', netErr === 'network', netErr)
}

console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} website-client checks passed`); process.exit(bad ? 1 : 0)

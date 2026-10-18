// Build-time mirroring of Google Drive pictures onto the site (scripts/lib/mirror-media.mjs)
// @ts-expect-error plain .mjs helper
import { collectDriveIds, mirrorMedia, downloadDriveImage } from '../scripts/lib/mirror-media.mjs'

let n = 0, bad = 0
const ok = (name: string, c: boolean, x: unknown = '') => { n++; if (!c) bad++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name} ${c ? '' : JSON.stringify(x)}`) }

const ID1 = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4', ID2 = 'Zz9Yy8Xx7Ww6Vv5Uu4Tt3Ss2Rr1Qq0', BAD = 'Bad0Bad0Bad0Bad0Bad0Bad0Bad0'
const lh3 = (id: string, sfx = '') => `https://lh3.googleusercontent.com/d/${id}${sfx}`
const content = {
  services: [{ id: 's1', image: lh3(ID1), imageAlt: 'x' }, { id: 's2', image: lh3(ID2, '=w800'), more: [lh3(ID1)] }, { id: 's3', image: 'https://example.com/keep.jpg' }],
  kaggleActivities: [{ title: 'T', image: lh3(BAD) }],
  note: 'text mentioning https://lh3.googleusercontent.com/d/short is not a real id',
}
ok('finds each distinct Drive picture once (ids ≥ 20 chars; size suffix ignored)', JSON.stringify(collectDriveIds(JSON.stringify(content)).sort()) === JSON.stringify([ID1, ID2, BAD].sort()))

const png = Buffer.from('iVBORw0KGgo=', 'base64')
const calls: string[] = []
const fakeFetch = async (url: string) => {
  calls.push(url)
  const id = url.match(/id=([^&]+)|\/d\/([^=?]+)/)!.slice(1).find(Boolean)!
  if (id === BAD) return new Response('<html>quota exceeded</html>', { status: 200, headers: { 'content-type': 'text/html' } })
  if (id === ID2 && url.includes('drive.usercontent')) return new Response('', { status: 404 })
  return new Response(png, { status: 200, headers: { 'content-type': id === ID2 ? 'image/webp' : 'image/png' } })
}
const r = await mirrorMedia(content, { write: false, fetchImpl: fakeFetch as unknown as typeof fetch })
const svc = (r.overrides as typeof content).services
ok('downloaded pictures are rewritten to local /media/<id>.<ext> paths (every occurrence)', svc[0].image === `/media/${ID1}.png` && (svc[1] as { more: string[] }).more[0] === `/media/${ID1}.png`, svc)
ok('falls back to the second address when the first fails', svc[1].image === `/media/${ID2}.webp` && calls.some((u) => u.includes('drive.usercontent') && u.includes(ID2)) && calls.some((u) => u.startsWith('https://lh3') && u.includes(ID2)), calls)
ok('an HTML answer (quota page) is NOT saved as a picture — the Drive address is kept, build continues', (r.overrides as typeof content).kaggleActivities[0].image === lh3(BAD) && r.failed.length === 1 && /content type/.test(r.failed[0].reason), r.failed)
ok('other URLs and text are untouched', svc[2].image === 'https://example.com/keep.jpg' && (r.overrides as typeof content).note === content.note)
ok('input object is not mutated', content.services[0].image === lh3(ID1))
ok('mirrored count', r.mirrored === 2)
const none = await mirrorMedia({ a: 1 }, { write: false, fetchImpl: (() => { throw new Error('must not be called') }) as unknown as typeof fetch })
ok('no pictures → no network calls', none.mirrored === 0 && none.failed.length === 0)
let threw = ''; try { await downloadDriveImage(ID1, (async () => { throw new Error('offline') }) as unknown as typeof fetch) } catch (e) { threw = (e as Error).message }
ok('network failure surfaces a reason (not a crash)', threw === 'offline', threw)

console.log(`\n${bad ? '✖' : '✔'} ${n - bad}/${n} media-mirroring checks passed`); process.exit(bad ? 1 : 0)

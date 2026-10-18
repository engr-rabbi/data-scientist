// Build-time helper: pictures uploaded in the admin live in Google Drive. For the PUBLIC site they are
// copied onto the site itself (public/media/…) so visitors never depend on Google Drive's hot-link
// limits and the pictures load from the same fast host as everything else.
// Best effort: if a picture cannot be downloaded, its Drive address is kept and the build continues.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

/** https://lh3.googleusercontent.com/d/<FILE_ID>[=w800] */
export const DRIVE_URL_RE = /https:\/\/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]{20,})(?:=[A-Za-z0-9-]+)?/g

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
const MAX_BYTES = 12 * 1024 * 1024

export const collectDriveIds = (text) => [...new Set([...text.matchAll(DRIVE_URL_RE)].map((m) => m[1]))]

export async function downloadDriveImage(id, fetchImpl = fetch) {
  const candidates = [
    `https://drive.usercontent.google.com/download?id=${id}&export=download`,
    `https://lh3.googleusercontent.com/d/${id}`,
  ]
  let last = 'no candidate worked'
  for (const url of candidates) {
    try {
      const res = await fetchImpl(url, { redirect: 'follow' })
      const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      if (!res.ok) { last = `HTTP ${res.status}`; continue }
      if (!EXT[type]) { last = `unexpected content type "${type}"`; continue }  // e.g. an HTML "can't scan for viruses" page
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length === 0 || buf.length > MAX_BYTES) { last = `bad size ${buf.length}`; continue }
      return { buf, ext: EXT[type] }
    } catch (e) { last = e.message }
  }
  throw new Error(last)
}

/**
 * @param overrides  the content object ({ key: value })
 * @returns { overrides: rewritten copy, mirrored: n, failed: [{id, reason}] }
 */
export async function mirrorMedia(overrides, { dir = 'public/media', publicPrefix = '/media', fetchImpl = fetch, write = true } = {}) {
  const json = JSON.stringify(overrides)
  const ids = collectDriveIds(json)
  if (write) { rmSync(dir, { recursive: true, force: true }); if (ids.length) mkdirSync(dir, { recursive: true }) }
  const map = new Map(), failed = []
  for (const id of ids) {
    try {
      const { buf, ext } = await downloadDriveImage(id, fetchImpl)
      if (write) writeFileSync(`${dir}/${id}.${ext}`, buf)
      map.set(id, `${publicPrefix}/${id}.${ext}`)
    } catch (e) { failed.push({ id, reason: e.message }) }
  }
  const rewritten = json.replace(DRIVE_URL_RE, (m, id) => map.get(id) ?? m)
  return { overrides: JSON.parse(rewritten), mirrored: map.size, failed }
}

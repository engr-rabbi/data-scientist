import { adminCall } from '@/lib/admin-api'
import { fileToBase64 } from '@/lib/api-client'

/**
 * Image library logic (browser). Pictures are stored in a Google Drive folder that is shared
 * "anyone with the link can view"; their metadata (alt text, caption, size, content hash) lives
 * in the "media" tab of your Google Sheet. The hash of every upload is checked first, so the same
 * picture is never stored twice. An asset's id IS its Google Drive file id.
 */
export interface MediaAsset {
  id: string
  /** Google Drive file id (kept under the old name "path" so the picker code did not change) */
  path: string
  url?: string
  file_name: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  sha256: string | null
  alt: string | null
  caption: string | null
  created_at: string
}

export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024   // what the admin may pick from disk
export const MAX_STORED_BYTES = 5 * 1024 * 1024      // limit after optimisation (Apps Script request size)
export const MAX_WIDTH = 1600
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }

/** Public address of a picture (works in <img> straight away; the build mirrors it onto the site itself). */
export const driveImageUrl = (fileId: string) => `https://lh3.googleusercontent.com/d/${fileId}`
export const assetUrl = (a: Pick<MediaAsset, 'path'> & { url?: string }) => a.url || driveImageUrl(a.path)

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function safeBaseName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
  return base || 'image'
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `“${file.name}”: only PNG, JPG, WEBP, GIF or AVIF pictures are allowed.`
  if (file.size > MAX_ORIGINAL_BYTES) return `“${file.name}” is larger than 25 MB.`
  return null
}

/** Downscales big pictures (max 1600 px wide) and converts to WebP when that is smaller. */
export async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  const keep = (width: number, height: number) => ({ blob: file as Blob, width, height, type: file.type })
  // Decoding is best-effort: where the browser cannot decode (or has no createImageBitmap) the file is stored as it is.
  const bmp: ImageBitmap | null = typeof createImageBitmap === 'function' ? await createImageBitmap(file).catch(() => null) : null
  if (!bmp) return keep(0, 0)
  const { width, height } = bmp
  if (file.type === 'image/gif' || file.type === 'image/avif') { bmp.close(); return keep(width, height) }
  if (width <= MAX_WIDTH && file.size <= 1.2 * 1024 * 1024) { bmp.close(); return keep(width, height) }
  const scale = Math.min(1, MAX_WIDTH / width)
  const w = Math.round(width * scale), h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const webp = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85))
  return webp && webp.size < file.size ? { blob: webp, width: w, height: h, type: 'image/webp' } : keep(width, height)
}

const bytesPayload = async (blob: Blob, prepared: { type: string; width: number; height: number }, file: File, hash: string) => ({
  fileName: file.name, mimeType: prepared.type, data: await fileToBase64(blob), sha256: hash, width: prepared.width || null, height: prepared.height || null,
})

/** Uploads a picture unless the library already has it (same content hash). */
export async function uploadImage(file: File): Promise<{ asset: MediaAsset; duplicate: boolean }> {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)
  const hash = await sha256Hex(file)
  const existing = await adminCall<{ asset: MediaAsset | null }>('mediaFindByHash', { sha256: hash })
  if (existing.asset) return { asset: existing.asset, duplicate: true }

  const prepared = await prepareImage(file)
  if (prepared.blob.size > MAX_STORED_BYTES) throw new Error(`“${file.name}” is still over 5 MB after optimisation — please use a smaller picture.`)
  const r = await adminCall<{ asset: MediaAsset; duplicate: boolean }>('mediaUpload', { ...(await bytesPayload(prepared.blob, prepared, file, hash)), alt: '', caption: '' })
  return { asset: r.asset, duplicate: r.duplicate }
}

/**
 * Replaces the FILE behind a library picture. Google Drive cannot swap the bytes of an existing
 * file from a script, so the server stores the new file and switches every place on the website
 * that used the old picture to the new one. NOTE: the returned asset has a NEW id / address.
 */
export async function replaceImage(asset: MediaAsset, file: File): Promise<MediaAsset> {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)
  const hash = await sha256Hex(file)
  const prepared = await prepareImage(file)
  if (prepared.blob.size > MAX_STORED_BYTES) throw new Error('Still over 5 MB after optimisation — use a smaller picture.')
  const r = await adminCall<{ asset: MediaAsset }>('mediaReplace', { id: asset.id, ...(await bytesPayload(prepared.blob, prepared, file, hash)) })
  return r.asset
}

export async function updateAssetMeta(id: string, alt: string, caption: string): Promise<void> {
  await adminCall('mediaMeta', { id, alt, caption })
}

export async function deleteAsset(asset: MediaAsset): Promise<void> {
  await adminCall('mediaDelete', { id: asset.id })
}

export async function listAssets(): Promise<MediaAsset[]> {
  return (await adminCall<{ items: MediaAsset[] }>('mediaList')).items
}

/** Which content sections reference this picture? (so deleting it cannot silently break the site) */
export async function findUsage(asset: Pick<MediaAsset, 'path'>): Promise<{ key: string; count: number }[]> {
  const { items } = await adminCall<{ items: { key: string; value: unknown }[] }>('contentAll')
  return items
    .map((r) => ({ key: r.key, count: JSON.stringify(r.value).split(asset.path).length - 1 }))
    .filter((r) => r.count > 0)
}

export const formatBytes = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

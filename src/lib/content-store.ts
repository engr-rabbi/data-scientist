import { adminCall } from '@/lib/admin-api'

/** Where the admin reads / writes website content (one JSON document per section). */
export interface ContentStore {
  load(key: string): Promise<unknown | null>
  save(key: string, value: unknown): Promise<void>
  history(key: string): Promise<{ id: number; value: unknown; saved_at: string }[]>
}

/** The real store: sections live in the "content" tab of your Google Sheet (via the Apps Script web app). */
export const sheetsStore: ContentStore = {
  async load(key) {
    const { items } = await adminCall<{ items: { key: string; value: unknown }[] }>('contentAll')
    const hit = items.find((i) => i.key === key)
    return hit ? hit.value : null
  },
  async save(key, value) {
    await adminCall('contentSave', { key, value })
  },
  async history(key) {
    try {
      const { items } = await adminCall<{ items: { id: number; value: unknown; saved_at: string }[] }>('contentHistory', { key })
      return items
    } catch { return [] }
  },
}
